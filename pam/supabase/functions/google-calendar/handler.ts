// google-calendar: Pam keeps one calendar of a member's visits in their Google account (D-539).
//
// One public function (deploy with JWT verification OFF: Google's redirect and the clock have no member login, and the
// member's own calls are checked here against their login). Routes, by the last part of the address:
//   POST status      {live, connected, state}        the member's login
//   POST connect     {url}: where to send them to sign in to Google
//   GET  callback    Google sends the member back here with a code; Pam makes the calendar and keeps the token
//   POST disconnect  deletes the calendar in Google, revokes the token, deletes the row, all at once
//   POST sync        the clock (every 15 minutes, with x-dispatch-secret): writes what changed
//
// The rules that matter:
//   1. OFF unless GOOGLE_SYNC_LIVE is 'on' and every secret is set. Off, it touches nothing: not Google, not the database.
//   2. ONE scope, calendar.app.created: only the calendar Pam made. If Google grants more, Pam refuses it and revokes it.
//   3. The refresh token is kept encrypted with GOOGLE_TOKEN_KEY (a secret, never in the database). The access token is
//      never kept. Nothing is logged but a status: no token, no member, no visit.
//   4. What goes in an event is event.ts: the same as the calendar link, the same discreet default, the same setting.
//   5. Never retry forever: a refused token breaks the connection (the member sees "Reconnect Google"); five failed runs
//      in a row break it; a run does at most 100 writes per member and 50 members.
// Secrets (names only): GOOGLE_SYNC_LIVE, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_TOKEN_KEY, GOOGLE_STATE_SECRET,
// DISPATCH_SECRET (the same one the other clocks use), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (provided).

import { seal, sha256Hex, signState, unseal, verifyState } from './crypto.ts';
import { APP, eventFor, type VisitsAnswer } from './event.ts';
import {
  accessToken,
  authUrl,
  createCalendar,
  deleteCalendar,
  deleteEvent,
  exchangeCode,
  grantedOnlyOurScope,
  Refused,
  revoke,
  writeEvent,
  type Credentials,
} from './google.ts';

export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
  readonly now?: () => number;
}

export const ALLOWED_ORIGINS: readonly string[] = ['https://app.joinpam.org'];
export const LIMITS = { members: 50, writes: 100, failures: 5 } as const;
const STATE_MINUTES = 10;

const json = (status: number, body: unknown, origin: string | null = null): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(origin) } });

function cors(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = { Vary: 'Origin' };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
    headers['Access-Control-Max-Age'] = '600';
  }
  return headers;
}

const redirect = (result: 'connected' | 'failed' | 'off'): Response =>
  new Response(null, { status: 302, headers: { Location: `${APP}/calendar/?google=${result}`, 'Cache-Control': 'no-store' } });

interface Config {
  readonly creds: Credentials;
  readonly tokenKey: string;
  readonly stateSecret: string;
}

/** The settings, or null if Pam is off (GOOGLE_SYNC_LIVE not 'on', or a secret missing). */
function config(deps: Deps): Config | null {
  if (deps.get('GOOGLE_SYNC_LIVE') !== 'on') return null;
  const clientId = deps.get('GOOGLE_CLIENT_ID');
  const clientSecret = deps.get('GOOGLE_CLIENT_SECRET');
  const tokenKey = deps.get('GOOGLE_TOKEN_KEY');
  const stateSecret = deps.get('GOOGLE_STATE_SECRET');
  const base = deps.get('SUPABASE_URL');
  if (!clientId || !clientSecret || !tokenKey || !stateSecret || !base) return null;
  return { creds: { clientId, clientSecret, redirectUri: `${base}/functions/v1/google-calendar/callback` }, tokenKey, stateSecret };
}

async function rpc<T>(deps: Deps, name: string, args: Record<string, unknown>): Promise<T> {
  const base = deps.get('SUPABASE_URL');
  const key = deps.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!base || !key) throw new Error('the function has no database credentials');
  const response = await deps.fetch(`${base}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** The signed-in member, from their own login; null if there is none or it is no good. */
async function memberOf(deps: Deps, request: Request): Promise<string | null> {
  const authorization = request.headers.get('authorization');
  const base = deps.get('SUPABASE_URL');
  if (!authorization || !base) return null;
  const response = await deps.fetch(`${base}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: deps.get('SUPABASE_ANON_KEY') ?? deps.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { id?: string };
  return body.id ?? null;
}

interface ConnectionRow {
  readonly refresh_token_enc: string;
  readonly calendar_id: string;
  readonly state: string;
}

const routeOf = (url: string): string => new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
/** A reason in a few words (a route and a status), never a token, a member or a visit. */
const quiet = (what: string, error: unknown) =>
  console.error(`google-calendar ${what}`, error instanceof Error ? `${error.constructor.name}: ${error.message.slice(0, 80)}` : 'unknown');

export async function handle(request: Request, deps: Deps): Promise<Response> {
  const origin = request.headers.get('origin');
  const route = routeOf(request.url);
  const now = deps.now?.() ?? Date.now();

  if (request.method === 'OPTIONS') return new Response(null, { status: origin && ALLOWED_ORIGINS.includes(origin) ? 204 : 403, headers: cors(origin) });
  const live = config(deps);

  if (route === 'callback') return request.method === 'GET' ? callback(request, deps, live, now) : json(405, { error: 'GET only' });
  if (route === 'sync') return request.method === 'POST' ? sync(request, deps, live) : json(405, { error: 'POST only' });

  if (route !== 'status' && route !== 'connect' && route !== 'disconnect') return json(404, { error: 'not found' }, origin);
  if (request.method !== 'POST' && request.method !== 'GET') return json(405, { error: 'POST only' }, origin);
  if (!live) return route === 'status' ? json(200, { live: false }, origin) : json(503, { live: false }, origin);

  const member = await memberOf(deps, request);
  if (!member) return json(401, { error: 'sign in first' }, origin);

  if (route === 'status') {
    const rows = await rpc<ConnectionRow[]>(deps, 'google_connection_get', { p_member: member });
    return json(200, { live: true, connected: rows.length > 0, state: rows[0]?.state ?? null }, origin);
  }
  if (route === 'connect') {
    const state = await signState(member, now + STATE_MINUTES * 60_000, live.stateSecret);
    return json(200, { url: authUrl(live.creds, state) }, origin);
  }
  return disconnect(deps, live, member, origin);
}

async function callback(request: Request, deps: Deps, live: Config | null, now: number): Promise<Response> {
  if (!live) return redirect('off');
  const params = new URL(request.url).searchParams;
  const code = params.get('code');
  const state = params.get('state');
  if (params.get('error') || !code || !state) return redirect('failed');
  const member = await verifyState(state, now, live.stateSecret);
  if (!member) return redirect('failed');
  try {
    const got = await exchangeCode(deps.fetch, live.creds, code);
    // Pam asked for one scope. Anything else (or nothing) is refused, and given back.
    if (!grantedOnlyOurScope(got.scope)) {
      await revoke(deps.fetch, got.refreshToken);
      return redirect('failed');
    }
    // A reconnect starts a new calendar; the old one, if Google still has it, is Pam's to remove.
    const before = await rpc<ConnectionRow[]>(deps, 'google_connection_get', { p_member: member });
    const calendarId = await createCalendar(deps.fetch, got.accessToken);
    if (before[0]) await deleteCalendar(deps.fetch, got.accessToken, before[0].calendar_id);
    await rpc(deps, 'google_connection_save', { p_member: member, p_token_enc: await seal(got.refreshToken, live.tokenKey), p_calendar_id: calendarId });
    return redirect('connected');
  } catch (error) {
    quiet('callback', error);
    return redirect('failed');
  }
}

async function disconnect(deps: Deps, live: Config, member: string, origin: string | null): Promise<Response> {
  const rows = await rpc<ConnectionRow[]>(deps, 'google_connection_get', { p_member: member });
  const row = rows[0];
  let calendarRemoved = true;
  let revoked = true;
  if (row) {
    // Each step is tried and its result told; the row goes whatever Google says, so "Disconnect" always disconnects.
    try {
      const refresh = await unseal(row.refresh_token_enc, live.tokenKey);
      try {
        calendarRemoved = await deleteCalendar(deps.fetch, await accessToken(deps.fetch, live.creds, refresh), row.calendar_id);
      } catch {
        calendarRemoved = false;
      }
      revoked = await revoke(deps.fetch, refresh);
    } catch (error) {
      quiet('disconnect', error);
      calendarRemoved = false;
      revoked = false;
    }
    await rpc(deps, 'google_connection_delete', { p_member: member });
  }
  return json(200, { ok: true, calendarRemoved, revoked }, origin);
}

interface Counts {
  members: number;
  created: number;
  changed: number;
  removed: number;
  refused: number;
  unwell: number;
}

async function sync(request: Request, deps: Deps, live: Config | null): Promise<Response> {
  const expected = deps.get('DISPATCH_SECRET');
  if (!expected) return json(503, { error: 'not set up' });
  if (request.headers.get('x-dispatch-secret') !== expected) return json(401, { error: 'not allowed' });
  if (!live) return json(200, { live: false });

  const due = await rpc<{ member_id: string; refresh_token_enc: string; calendar_id: string }[]>(deps, 'google_connections_due', { p_limit: LIMITS.members });
  const counts: Counts = { members: 0, created: 0, changed: 0, removed: 0, refused: 0, unwell: 0 };
  for (const row of due) {
    counts.members += 1;
    try {
      await syncMember(deps, live, row, counts);
      await rpc(deps, 'google_connection_mark', { p_member: row.member_id, p_ok: true, p_refused: false });
    } catch (error) {
      const refused = error instanceof Refused;
      if (refused) counts.refused += 1;
      else counts.unwell += 1;
      quiet(refused ? 'refused' : 'unwell', error);
      await rpc(deps, 'google_connection_mark', { p_member: row.member_id, p_ok: false, p_refused: refused }).catch(() => {});
    }
  }
  return json(200, { live: true, ...counts });
}

async function syncMember(deps: Deps, live: Config, row: { member_id: string; refresh_token_enc: string; calendar_id: string }, counts: Counts): Promise<void> {
  const token = await accessToken(deps.fetch, live.creds, await unseal(row.refresh_token_enc, live.tokenKey));
  const answer = await rpc<VisitsAnswer>(deps, 'google_sync_visits', { p_member: row.member_id });
  const known = new Map(
    (await rpc<{ appointment_id: string; event_id: string; content_hash: string }[]>(deps, 'google_events_for', { p_member: row.member_id })).map((e) => [e.appointment_id, e]),
  );
  let writes = 0;
  const wanted = new Set<string>();
  for (const visit of answer.visits) {
    const event = eventFor(visit, answer.show_details);
    if (!event) continue;
    wanted.add(visit.id);
    const hash = await sha256Hex(JSON.stringify(event));
    const have = known.get(visit.id);
    if (have && have.content_hash === hash) continue;
    if (writes >= LIMITS.writes) continue; // the rest next time
    const done = await writeEvent(deps.fetch, token, row.calendar_id, event, Boolean(have));
    if (done === 'created') counts.created += 1;
    else counts.changed += 1;
    writes += 1;
    await rpc(deps, 'google_event_set', { p_member: row.member_id, p_appointment: visit.id, p_event: event.id, p_hash: hash });
  }
  for (const [visitId, have] of known) {
    if (wanted.has(visitId) || writes >= LIMITS.writes) continue;
    await deleteEvent(deps.fetch, token, row.calendar_id, have.event_id);
    counts.removed += 1;
    writes += 1;
    await rpc(deps, 'google_event_forget', { p_member: row.member_id, p_appointment: visitId });
  }
}
