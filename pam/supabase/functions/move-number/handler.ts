// move-number: an approved request moves an account's sign-in to the new phone number (D-567).
// (The handler, with everything it touches passed in so it can be tested; index.ts wires it to Deno.)
//
// Called by the app, as the person who just approved the request (a case manager, or the super admin
// who ticked "I spoke to this person"). The database has already recorded the yes; this does the part
// the database cannot: Supabase Auth owns the sign-in.
//
// The rules that matter:
//
//   1. It moves only what the database offers to the caller (`number_change_to_move`): a request this
//      caller approved, not yet moved, for an account that is not a super admin's. Anything else is
//      404, and nothing is touched.
//   2. In order: remove the temporary sign-in that proved the new number (so the number is free), move
//      the account's sign-in to it, then tell the database (`number_change_moved`), which updates the
//      profile and writes the audit row. If a step fails the request stays approved and not moved, and
//      the same call can be made again.
//   3. It never logs a phone number or a name. Ids and statuses at most.
//   4. Nothing leaves Pam: it calls this project's own Auth and REST endpoints and nothing else.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const JSON_HEADERS = { 'Content-Type': 'application/json', ...CORS };

export function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** Everything the handler touches outside itself, so a test can hand it fakes. */
export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function service(e: Env): Record<string, string> {
  return { apikey: e.service, Authorization: `Bearer ${e.service}`, 'Content-Type': 'application/json' };
}

async function rpc(deps: Deps, e: Env, name: string, args: Record<string, unknown>): Promise<Response> {
  return await deps.fetch(`${e.url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: service(e),
    body: JSON.stringify(args),
  });
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return reply(405, { error: 'POST only' });

  const jwt = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return reply(401, { error: 'sign in first' });

  let requestId: unknown;
  try {
    requestId = ((await request.json()) as { requestId?: unknown }).requestId;
  } catch {
    return reply(400, { error: 'a JSON object is expected' });
  }
  if (typeof requestId !== 'string' || !UUID.test(requestId)) return reply(400, { error: 'requestId is needed' });

  const e = env(deps);

  // Who is asking: their own sign-in, checked by Auth.
  const who = await deps.fetch(`${e.url}/auth/v1/user`, { headers: { apikey: e.anon, Authorization: `Bearer ${jwt}` } });
  if (!who.ok) return reply(401, { error: 'sign in first' });
  const caller = ((await who.json()) as { id?: string }).id;
  if (!caller) return reply(401, { error: 'sign in first' });

  // What this caller may move — the database decides.
  const plan = await rpc(deps, e, 'number_change_to_move', { p_id: requestId, p_caller: caller });
  if (!plan.ok) return reply(502, { error: 'could not read the request' });
  const rows = (await plan.json()) as { requester_id: string | null; profile_id: string; new_phone: string }[];
  const move = rows[0];
  if (!move) return reply(404, { error: 'nothing to move' });

  // 1. Free the number: remove the temporary sign-in that proved it (already gone is fine).
  if (move.requester_id) {
    const gone = await deps.fetch(`${e.url}/auth/v1/admin/users/${move.requester_id}`, {
      method: 'DELETE',
      headers: service(e),
    });
    if (!gone.ok && gone.status !== 404) {
      console.error('move-number: could not remove the temporary sign-in', gone.status);
      return reply(502, { error: 'could not free the new number' });
    }
  }

  // 2. Move the account's sign-in. Auth keeps numbers as digits, country code first.
  const moved = await deps.fetch(`${e.url}/auth/v1/admin/users/${move.profile_id}`, {
    method: 'PUT',
    headers: service(e),
    body: JSON.stringify({ phone: move.new_phone.replace(/\D/g, ''), phone_confirm: true }),
  });
  if (!moved.ok) {
    console.error('move-number: could not move the sign-in', moved.status);
    return reply(502, { error: 'could not move the sign-in' });
  }

  // 3. The database follows: the profile's number, the request, the audit row.
  const done = await rpc(deps, e, 'number_change_moved', { p_id: requestId });
  if (!done.ok) {
    console.error('move-number: the sign-in moved but the record did not', done.status);
    return reply(502, { error: 'moved, but the record was not updated' });
  }

  return reply(200, { moved: true });
}
