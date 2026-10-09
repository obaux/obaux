import { describe, expect, it } from 'vitest';
import { handle, type Deps } from '../../../supabase/functions/translate-messages/handler.ts';
import type { Incoming, Translated, Translator } from '../../../supabase/functions/translate-messages/core.ts';

/**
 * The function around the core (D-414): who it reads as, what it writes with,
 * and what it does when things are off or down. Run against a fake database
 * and a fake translation service; nothing leaves the test.
 */
const URL_ = 'https://stub.supabase.co';
const READER_JWT = 'reader.jwt.token';
const SERVICE_KEY = 'service-role-key';
const ANON_KEY = 'anon-key';
const ME = 'aaaaaaaa-0000-4000-8000-00000000000a';
const THEM = 'bbbbbbbb-0000-4000-8000-00000000000b';
const M1 = '11111111-1111-4111-8111-111111111111';
const M2 = '22222222-2222-4222-8222-222222222222';
const M3 = '33333333-3333-4333-8333-333333333333';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly authorization: string | null;
  readonly body: unknown;
}

function world(opts: {
  messages?: { id: string; sender_id: string; body: string | null }[];
  cached?: { message_id: string; source_locale: string; body: string | null }[];
  saveStatus?: number;
  switchOn?: boolean;
  key?: boolean;
  translations?: Translated[];
  serviceDown?: boolean;
} = {}) {
  const calls: Call[] = [];
  const asked: Incoming[][] = [];
  const messages = opts.messages ?? [
    { id: M1, sender_id: THEM, body: 'Llego a las diez.' },
    { id: M2, sender_id: ME, body: 'Gracias' },
    { id: M3, sender_id: THEM, body: '10:30' },
  ];
  const translator: Translator = {
    name: 'test:fake',
    async translate(items) {
      asked.push([...items]);
      if (opts.serviceDown) throw new Error('503');
      return opts.translations ?? [{ id: M1, sourceLocale: 'es', body: 'I arrive at ten.' }];
    },
  };
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      method: init?.method ?? 'GET',
      authorization: headers.get('Authorization'),
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
    if (url.endsWith('/auth/v1/user')) return headers.get('Authorization') === `Bearer ${READER_JWT}` ? json({ id: ME }) : json({}, 401);
    if (url.includes('/rest/v1/messages?')) return json(messages);
    if (url.includes('/rest/v1/message_translations?')) return json(opts.cached ?? []);
    if (url.endsWith('/rest/v1/message_translations')) return new Response(null, { status: opts.saveStatus ?? 201 });
    return json({}, 404);
  };
  const env: Record<string, string | undefined> = {
    SUPABASE_URL: URL_,
    SUPABASE_ANON_KEY: ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    MESSAGE_TRANSLATION: opts.switchOn === false ? undefined : 'on',
  };
  const deps: Deps = { get: (n) => env[n], fetch: fakeFetch, translator: opts.key === false ? null : translator };
  return { calls, asked, deps };
}

const ask = (body: unknown, jwt: string | null = READER_JWT) =>
  new Request(`${URL_}/functions/v1/translate-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    body: JSON.stringify(body),
  });

const ASK = { messageIds: [M1, M2, M3], target: 'en' };

describe('while it is switched off', () => {
  it('answers that it is off and touches nothing', async () => {
    const w = world({ switchOn: false });
    const res = await handle(ask(ASK), w.deps);
    expect(await res.json()).toEqual({ enabled: false, translations: [] });
    expect(w.calls).toEqual([]);
    expect(w.asked).toEqual([]);
  });

  it('is off unless it is exactly "on"', async () => {
    const w = world();
    const deps: Deps = { ...w.deps, get: (n) => (n === 'MESSAGE_TRANSLATION' ? 'true' : w.deps.get(n)) };
    expect(await (await handle(ask(ASK), deps)).json()).toEqual({ enabled: false, translations: [] });
    expect(w.calls).toEqual([]);
  });
});

describe('when it is on', () => {
  it('needs a sign-in', async () => {
    const w = world();
    expect((await handle(ask(ASK, null), w.deps)).status).toBe(401);
    expect(w.asked).toEqual([]);
  });

  it('refuses a sign-in the database does not know', async () => {
    const w = world();
    expect((await handle(ask(ASK, 'forged'), w.deps)).status).toBe(401);
    expect(w.asked).toEqual([]);
  });

  it('says so when no translation service is set up, and asks nothing', async () => {
    const w = world({ key: false });
    expect((await handle(ask(ASK), w.deps)).status).toBe(503);
    expect(w.calls).toEqual([]);
  });

  it('refuses a request that is not one', async () => {
    const w = world();
    expect((await handle(ask({ messageIds: ['x'], target: 'en' }), w.deps)).status).toBe(400);
    expect((await handle(ask({ messageIds: [M1], target: 'fr' }), w.deps)).status).toBe(400);
    expect((await handle(new Request(URL_, { method: 'POST', headers: { Authorization: `Bearer ${READER_JWT}` }, body: 'nope' }), w.deps)).status).toBe(400);
    expect((await handle(new Request(URL_, { method: 'GET', headers: { Authorization: `Bearer ${READER_JWT}` } }), w.deps)).status).toBe(405);
    expect(w.asked).toEqual([]);
  });

  it('returns the translation of what somebody else wrote, not of the reader’s own words', async () => {
    const w = world();
    const res = await handle(ask(ASK), w.deps);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      enabled: true,
      translations: [{ messageId: M1, sourceLocale: 'es', body: 'I arrive at ten.' }],
    });
    // Asked about M1 only: M2 is theirs, M3 is a time of day.
    expect(w.asked).toHaveLength(1);
    expect(w.asked[0]!.map((a) => a.id)).toEqual([M1]);
  });

  it('reads as the reader, and writes with the service role, and nothing else', async () => {
    const w = world();
    await handle(ask(ASK), w.deps);
    for (const call of w.calls) {
      if (call.method === 'GET') {
        expect(call.authorization).toBe(`Bearer ${READER_JWT}`);
      } else {
        expect(call.method).toBe('POST');
        expect(call.url).toBe(`${URL_}/rest/v1/message_translations`);
        expect(call.authorization).toBe(`Bearer ${SERVICE_KEY}`);
      }
    }
    // Exactly one write: the cache.
    expect(w.calls.filter((c) => c.method !== 'GET')).toHaveLength(1);
  });

  it('keeps what it learned, including that a message needed none', async () => {
    const w = world();
    await handle(ask(ASK), w.deps);
    const save = w.calls.find((c) => c.method === 'POST')!;
    expect(save.body).toEqual([
      { message_id: M3, target_locale: 'en', source_locale: 'und', body: null, provider: 'test:fake' },
      { message_id: M1, target_locale: 'en', source_locale: 'es', body: 'I arrive at ten.', provider: 'test:fake' },
    ]);
  });

  it('does not ask the service again about what it already knows', async () => {
    const w = world({
      cached: [
        { message_id: M1, source_locale: 'es', body: 'I arrive at ten.' },
        { message_id: M3, source_locale: 'und', body: null },
      ],
    });
    const res = await handle(ask(ASK), w.deps);
    expect(w.asked).toEqual([]);
    expect(w.calls.filter((c) => c.method === 'POST')).toEqual([]);
    expect(await res.json()).toEqual({
      enabled: true,
      translations: [{ messageId: M1, sourceLocale: 'es', body: 'I arrive at ten.' }],
    });
  });

  it('never returns a translation of the reader’s own message, even if one was cached', async () => {
    const w = world({ cached: [{ message_id: M2, source_locale: 'en', body: 'Thanks' }] });
    const res = (await (await handle(ask(ASK), w.deps)).json()) as { translations: { messageId: string }[] };
    expect(res.translations.map((t) => t.messageId)).not.toContain(M2);
  });

  it('shows the originals when the service is down, and says it was', async () => {
    const w = world({ serviceDown: true, cached: [{ message_id: M3, source_locale: 'es', body: 'Already known' }] });
    const res = await handle(ask(ASK), w.deps);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      enabled: true,
      translations: [{ messageId: M3, sourceLocale: 'es', body: 'Already known' }],
      unavailable: true,
    });
    expect(w.calls.filter((c) => c.method === 'POST')).toEqual([]);
  });

  it('still gives the reader the translation when saving it fails', async () => {
    const w = world({ saveStatus: 500 });
    const res = await handle(ask(ASK), w.deps);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { translations: unknown[] }).translations).toHaveLength(1);
  });

  it('translates only what the database lets the reader read', async () => {
    // The database answers for the reader (row-level security): a message in
    // somebody else's conversation simply is not in the list.
    const w = world({ messages: [{ id: M1, sender_id: THEM, body: 'Hola' }] });
    await handle(ask(ASK), w.deps);
    expect(w.asked[0]!.map((a) => a.id)).toEqual([M1]);
  });

  it('does not write a message into any log line', async () => {
    const w = world({ serviceDown: true });
    const logged: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => void logged.push(args.map(String).join(' '));
    try {
      await handle(ask(ASK), w.deps);
    } finally {
      console.error = original;
    }
    expect(logged.join('\n')).not.toMatch(/Llego|diez|Gracias/);
  });
});
