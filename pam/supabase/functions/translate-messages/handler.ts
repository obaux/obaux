// translate-messages: the words of a conversation, in the reader's language.
// (The handler, with everything it touches passed in so it can be tested; index.ts wires it to Deno.)
//
// Called by the app, as the signed-in reader, when they open a conversation
// that has messages from somebody else. It answers from what it has already
// translated (public.message_translations, 0082) and asks the translation
// service only about the rest, then keeps what it learned.
//
// The three rules that matter:
//
//   1. It is off until somebody switches it on. Without MESSAGE_TRANSLATION=on
//      it answers { enabled: false } and touches nothing: not the database,
//      not the service. Shipping this function changes nothing a member sees
//      (the app has its own switch, MESSAGE_TRANSLATION in packages/config,
//      tied to the privacy page's words about it).
//   2. It reads messages AS THE READER, with their own sign-in, so the
//      database's own rule — only the two people in a conversation can read
//      its messages — decides what it may translate. It never reads with the
//      service role. The service role is used for one thing only: writing the
//      cache, which nobody signed in can do.
//   3. It never logs a message. Counts and ids at most.

import { BadRequest, parseRequest, translateAll, type Candidate, type Translated, type Translator } from './core.ts';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** Everything the handler touches outside itself, so a test can hand it fakes. */
export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
  readonly translator: Translator | null;
}

interface Env {
  readonly url: string;
  readonly anon: string;
  readonly service: string;
}

function env(deps: Deps): Env {
  const url = deps.get('SUPABASE_URL');
  const anon = deps.get('SUPABASE_ANON_KEY');
  const service = deps.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !service) throw new Error('the function has no database credentials');
  return { url, anon, service };
}

/** A REST call as the reader — their own sign-in, never the service role. */
async function asReader(deps: Deps, e: Env, jwt: string, path: string): Promise<Response> {
  return await deps.fetch(`${e.url}${path}`, { headers: { apikey: e.anon, Authorization: `Bearer ${jwt}` } });
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  const { translator } = deps;
  if (deps.get('MESSAGE_TRANSLATION') !== 'on') return reply(200, { enabled: false, translations: [] });
  if (request.method !== 'POST') return reply(405, { error: 'POST only' });
  if (!translator) return reply(503, { error: 'translation is not set up' });

  const jwt = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return reply(401, { error: 'sign in first' });

  let wanted;
  try {
    wanted = parseRequest(await request.json());
  } catch (error) {
    if (error instanceof BadRequest) return reply(400, { error: error.message });
    return reply(400, { error: 'a JSON object is expected' });
  }

  const e = env(deps);

  // Who is asking.
  const who = await asReader(deps, e, jwt, '/auth/v1/user');
  if (!who.ok) return reply(401, { error: 'sign in first' });
  const reader = ((await who.json()) as { id?: string }).id;
  if (!reader) return reply(401, { error: 'sign in first' });

  // The messages the reader may read — the database decides which.
  const ids = wanted.messageIds.join(',');
  const rows = await asReader(deps, e, jwt, `/rest/v1/messages?id=in.(${ids})&select=id,sender_id,body`);
  if (!rows.ok) return reply(502, { error: 'could not read the messages' });
  const messages: Candidate[] = ((await rows.json()) as { id: string; sender_id: string; body: string | null }[]).map(
    (m) => ({ id: m.id, senderId: m.sender_id, body: m.body }),
  );

  // What is already known, in this language.
  const known = await asReader(
    deps,
    e,
    jwt,
    `/rest/v1/message_translations?message_id=in.(${ids})&target_locale=eq.${wanted.target}&select=message_id,source_locale,body`,
  );
  if (!known.ok) return reply(502, { error: 'could not read the saved translations' });
  const cached = (await known.json()) as { message_id: string; source_locale: string; body: string | null }[];

  let fresh: Translated[];
  try {
    fresh = await translateAll(translator, reader, messages, new Set(cached.map((c) => c.message_id)), wanted.target);
  } catch (error) {
    // The service is down or refused: the reader keeps the original, which is
    // always right to show. Say nothing about why — the status is in the logs.
    console.error('translation failed', error instanceof Error ? error.message : 'unknown');
    return reply(200, { enabled: true, translations: fromCache(cached), unavailable: true });
  }

  if (fresh.length > 0) {
    const save = await deps.fetch(`${e.url}/rest/v1/message_translations`, {
      method: 'POST',
      headers: {
        apikey: e.service,
        Authorization: `Bearer ${e.service}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(
        fresh.map((f) => ({
          message_id: f.id,
          target_locale: wanted.target,
          source_locale: f.sourceLocale,
          body: f.body,
          provider: translator.name,
        })),
      ),
    });
    // Not fatal: the reader still gets this translation, it is simply asked
    // for again next time.
    if (!save.ok) console.error('could not save translations', save.status);
  }

  const mine = new Set(messages.filter((m) => m.senderId === reader).map((m) => m.id));
  const all = [
    ...fromCache(cached),
    ...fresh.filter((f) => f.body !== null).map((f) => ({ messageId: f.id, sourceLocale: f.sourceLocale, body: f.body as string })),
  ].filter((t) => !mine.has(t.messageId));
  return reply(200, { enabled: true, translations: all });
}

function fromCache(cached: { message_id: string; source_locale: string; body: string | null }[]) {
  return cached
    .filter((c) => c.body !== null)
    .map((c) => ({ messageId: c.message_id, sourceLocale: c.source_locale, body: c.body as string }));
}
