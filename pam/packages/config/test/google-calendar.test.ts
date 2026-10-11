import { afterEach, describe, expect, it, vi } from 'vitest';
import { seal, signState, unseal, verifyState } from '../../../supabase/functions/google-calendar/crypto.ts';
import { handle, LIMITS, type Deps } from '../../../supabase/functions/google-calendar/handler.ts';
import { eventFor, eventIdOf, type Visit } from '../../../supabase/functions/google-calendar/event.ts';
import { SCOPE } from '../../../supabase/functions/google-calendar/google.ts';
import { buildCalendar } from '../../../supabase/functions/calendar-feed/ics.ts';

/**
 * Pam keeps one calendar of a member's visits in their Google account (D-539). A fake database and a fake Google;
 * nothing leaves the test. The things that matter: off means off; one scope and nothing more; the token is kept sealed;
 * what goes in an event is what the link sends; a refused token breaks the connection and nothing retries forever;
 * Disconnect always disconnects.
 */
const KEY = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));
const MEMBER = 'cccccccc-0000-0000-0000-00000000aaaa';
const OTHER = 'cccccccc-0000-0000-0000-00000000bbbb';
const SECRET = 'dispatch-secret';
const ENV = {
  GOOGLE_SYNC_LIVE: 'on',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  GOOGLE_TOKEN_KEY: KEY,
  GOOGLE_STATE_SECRET: 'state-secret',
  DISPATCH_SECRET: SECRET,
  SUPABASE_URL: 'https://stub.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  SUPABASE_ANON_KEY: 'anon-key',
};
const NOW = new Date('2026-10-12T15:00:00Z').getTime();

const visit = (n: number, extra: Partial<Visit> = {}): Visit => ({
  id: `aaaaaaaa-0000-0000-0000-${String(n).padStart(12, '0')}`,
  starts_at: new Date(NOW + n * 86_400_000).toISOString(),
  ends_at: null,
  place_id: '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a',
  name: null,
  address: null,
  ...extra,
});

interface Options {
  env?: Partial<typeof ENV> | Record<string, string | undefined>;
  visits?: Visit[];
  showDetails?: boolean;
  /** Google answers: */
  grant?: string;
  refreshStatus?: number;
  writeStatus?: number;
  calendarGone?: boolean;
  loggedIn?: boolean;
}

function world(opts: Options = {}) {
  const env: Record<string, string | undefined> = { ...ENV, ...opts.env };
  const calls: string[] = [];
  const db = {
    connections: new Map<string, { refresh_token_enc: string; calendar_id: string; state: string; failures: number }>(),
    events: new Map<string, { appointment_id: string; event_id: string; content_hash: string }>(),
    cleanups: new Map<string, { id: string; refresh_token_enc: string; calendar_id: string; attempts: number }>(),
    cleanupResults: [] as { calendar: boolean; revoked: boolean }[],
    visits: opts.visits ?? [],
    showDetails: opts.showDetails ?? false,
  };
  const google = {
    calendars: new Map<string, Map<string, Record<string, unknown>>>(),
    revoked: [] as string[],
    deletedCalendars: [] as string[],
    writes: 0,
  };
  const okJson = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? init.body : '';
    calls.push(`${method} ${url.split('?')[0]}`);

    if (url.endsWith('/auth/v1/user')) return opts.loggedIn === false ? okJson({}, 401) : okJson({ id: MEMBER });

    if (url.includes('/rest/v1/rpc/')) {
      const name = url.split('/rpc/')[1]!;
      const args = body ? (JSON.parse(body) as Record<string, any>) : {};
      const id = args['p_member'] as string;
      switch (name) {
        case 'google_connection_get': {
          const c = db.connections.get(id);
          return okJson(c ? [c] : []);
        }
        case 'google_connection_save':
          db.connections.set(id, { refresh_token_enc: args['p_token_enc'], calendar_id: args['p_calendar_id'], state: 'connected', failures: 0 });
          db.events.clear();
          return okJson(null);
        case 'google_connections_due':
          return okJson([...db.connections].filter(([, c]) => c.state === 'connected').map(([member_id, c]) => ({ member_id, ...c })));
        case 'google_sync_visits':
          return okJson({ show_details: db.showDetails, visits: db.visits });
        case 'google_events_for':
          return okJson([...db.events.values()]);
        case 'google_event_set':
          db.events.set(args['p_appointment'], { appointment_id: args['p_appointment'], event_id: args['p_event'], content_hash: args['p_hash'] });
          return okJson(null);
        case 'google_cleanups_due':
          return okJson([...db.cleanups.values()]);
        case 'google_cleanup_done': {
          db.cleanupResults.push({ calendar: args['p_calendar_removed'], revoked: args['p_revoked'] });
          const done = args['p_calendar_removed'] && args['p_revoked'];
          const row = db.cleanups.get(args['p_id']);
          if (done || !row || row.attempts + 1 >= LIMITS.failures) db.cleanups.delete(args['p_id']);
          else row.attempts += 1;
          return okJson(done ? 'done' : 'again');
        }
        case 'google_event_forget':
          db.events.delete(args['p_appointment']);
          return okJson(null);
        case 'google_connection_mark': {
          const c = db.connections.get(id)!;
          c.failures = args['p_ok'] ? 0 : c.failures + 1;
          if (args['p_refused'] || (!args['p_ok'] && c.failures >= LIMITS.failures)) c.state = 'broken';
          return okJson(c.state);
        }
        case 'google_connection_delete':
          db.connections.delete(id);
          db.events.clear();
          return okJson(null);
      }
      throw new Error(`unexpected rpc ${name}`);
    }

    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      const form = new URLSearchParams(body);
      if (form.get('grant_type') === 'authorization_code') {
        return okJson({ refresh_token: 'REFRESH-1', access_token: 'ACCESS-1', scope: opts.grant ?? SCOPE });
      }
      if (opts.refreshStatus && opts.refreshStatus !== 200) return okJson({ error: 'invalid_grant' }, opts.refreshStatus);
      return okJson({ access_token: 'ACCESS-2' });
    }
    if (url.startsWith('https://oauth2.googleapis.com/revoke')) {
      google.revoked.push(new URLSearchParams(body).get('token')!);
      return okJson({});
    }

    const calendarMatch = url.match(/\/calendar\/v3\/calendars(?:\/([^/?]+))?(?:\/events(?:\/([^/?]+))?)?/);
    if (calendarMatch) {
      const [, calendarId, eventId] = calendarMatch;
      const isEvents = url.includes('/events');
      if (!isEvents && method === 'POST') {
        google.calendars.set('cal-1', new Map());
        return okJson({ id: 'cal-1' });
      }
      if (!isEvents && method === 'DELETE') {
        google.deletedCalendars.push(decodeURIComponent(calendarId!));
        google.calendars.delete(decodeURIComponent(calendarId!));
        return new Response(null, { status: 204 });
      }
      const events = google.calendars.get(decodeURIComponent(calendarId!));
      if (opts.calendarGone || !events) return okJson({ error: 'Not Found' }, 404);
      if (opts.writeStatus) return okJson({ error: 'nope' }, opts.writeStatus);
      google.writes += 1;
      if (method === 'POST') {
        const event = JSON.parse(body) as { id: string };
        if (events.has(event.id)) return okJson({ error: 'conflict' }, 409);
        events.set(event.id, event);
        return okJson(event);
      }
      if (method === 'PUT') {
        if (!events.has(eventId!)) return okJson({ error: 'Not Found' }, 404);
        events.set(eventId!, JSON.parse(body));
        return okJson({});
      }
      if (method === 'DELETE') {
        events.delete(eventId!);
        return new Response(null, { status: 204 });
      }
    }
    throw new Error(`unexpected request ${method} ${url}`);
  }) as typeof fetch;

  const deps: Deps = { get: (name) => env[name], fetch: fetcher, now: () => NOW };
  const call = (route: string, init: RequestInit = {}) =>
    handle(new Request(`https://stub.supabase.co/functions/v1/google-calendar/${route}`, { method: 'POST', headers: { authorization: 'Bearer user-jwt' }, ...init }), deps);
  const sync = () => call('sync', { headers: { 'x-dispatch-secret': SECRET } });
  /** Signs in to Google and comes back: the member is connected. */
  async function connect() {
    const { url } = (await (await call('connect')).json()) as { url: string };
    const state = new URL(url).searchParams.get('state')!;
    const back = await handle(new Request(`https://stub.supabase.co/functions/v1/google-calendar/callback?code=CODE&state=${encodeURIComponent(state)}`), deps);
    return { back, url, state };
  }
  return { deps, call, sync, connect, db, google, calls };
}

afterEach(() => vi.restoreAllMocks());

describe('off means off', () => {
  it('touches nothing when GOOGLE_SYNC_LIVE is not on: status says so, the rest are refused, the clock does no work', async () => {
    const w = world({ env: { GOOGLE_SYNC_LIVE: undefined }, visits: [visit(1)] });
    expect(await (await w.call('status')).json()).toEqual({ live: false });
    expect((await w.call('connect')).status).toBe(503);
    expect((await w.call('disconnect')).status).toBe(503);
    expect(await (await w.sync()).json()).toEqual({ live: false });
    const back = await handle(new Request('https://stub.supabase.co/functions/v1/google-calendar/callback?code=c&state=s'), w.deps);
    expect(back.headers.get('location')).toBe('https://app.joinpam.org/calendar/?google=off');
    expect(w.calls).toEqual([]);
  });

  it('is off too when a secret is missing', async () => {
    const w = world({ env: { GOOGLE_CLIENT_SECRET: undefined } });
    expect(await (await w.call('status')).json()).toEqual({ live: false });
  });

  it('does no work for the clock without the right secret', async () => {
    const w = world();
    expect((await w.call('sync')).status).toBe(401);
    expect((await w.call('sync', { headers: { 'x-dispatch-secret': 'wrong' } })).status).toBe(401);
    const unset = world({ env: { DISPATCH_SECRET: undefined } });
    expect((await unset.sync()).status).toBe(503);
    expect(w.calls).toEqual([]);
  });
});

describe('signing in to Google', () => {
  it('asks for exactly one scope, offline, and for a member who is signed in', async () => {
    const w = world();
    const { url } = (await (await w.call('connect')).json()) as { url: string };
    const params = new URL(url).searchParams;
    expect(url.startsWith('https://accounts.google.com/o/oauth2/v2/auth?')).toBe(true);
    expect(params.get('scope')).toBe('https://www.googleapis.com/auth/calendar.app.created');
    expect(params.get('access_type')).toBe('offline');
    expect(params.get('redirect_uri')).toBe('https://stub.supabase.co/functions/v1/google-calendar/callback');
    expect(params.get('include_granted_scopes')).toBe('false');
    const nobody = world({ loggedIn: false });
    expect((await nobody.call('connect')).status).toBe(401);
  });

  it('makes the calendar and keeps the refresh token sealed, never as it came', async () => {
    const w = world();
    const { back } = await w.connect();
    expect(back.headers.get('location')).toBe('https://app.joinpam.org/calendar/?google=connected');
    const row = w.db.connections.get(MEMBER)!;
    expect(row.calendar_id).toBe('cal-1');
    expect(row.refresh_token_enc).not.toContain('REFRESH-1');
    expect(row.refresh_token_enc.startsWith('v1.')).toBe(true);
    expect(await unseal(row.refresh_token_enc, KEY)).toBe('REFRESH-1');
    expect(await (await w.call('status')).json()).toEqual({ live: true, connected: true, state: 'connected' });
  });

  it('refuses a grant of more than the one scope, and gives it back', async () => {
    const w = world({ grant: `${SCOPE} https://www.googleapis.com/auth/calendar.readonly` });
    const { back } = await w.connect();
    expect(back.headers.get('location')).toBe('https://app.joinpam.org/calendar/?google=failed');
    expect(w.db.connections.size).toBe(0);
    expect(w.google.revoked).toEqual(['REFRESH-1']);
    expect(w.google.calendars.size).toBe(0);
  });

  it('refuses a state that is forged, expired or for no one, before it asks Google anything', async () => {
    const w = world();
    const good = await signState(MEMBER, NOW + 60_000, 'state-secret');
    const forged = await signState(MEMBER, NOW + 60_000, 'another-secret');
    const expired = await signState(MEMBER, NOW - 1, 'state-secret');
    for (const state of [forged, expired, 'garbage', `${good}x`]) {
      const back = await handle(new Request(`https://stub.supabase.co/functions/v1/google-calendar/callback?code=c&state=${encodeURIComponent(state)}`), w.deps);
      expect(back.headers.get('location')).toBe('https://app.joinpam.org/calendar/?google=failed');
    }
    const denied = await handle(new Request('https://stub.supabase.co/functions/v1/google-calendar/callback?error=access_denied'), w.deps);
    expect(denied.headers.get('location')).toBe('https://app.joinpam.org/calendar/?google=failed');
    expect(w.calls).toEqual([]);
  });
});

describe('keeping the calendar in step', () => {
  it('writes each visit once, leaves an unchanged one alone, changes a moved one and removes a cancelled one', async () => {
    const w = world({ visits: [visit(1), visit(2)] });
    await w.connect();
    expect(await (await w.sync()).json()).toMatchObject({ created: 2, changed: 0, removed: 0 });
    expect(w.google.calendars.get('cal-1')!.size).toBe(2);

    expect(await (await w.sync()).json()).toMatchObject({ created: 0, changed: 0, removed: 0 });

    w.db.visits = [visit(1, { starts_at: new Date(NOW + 5 * 86_400_000).toISOString() }), visit(2)];
    expect(await (await w.sync()).json()).toMatchObject({ created: 0, changed: 1, removed: 0 });

    w.db.visits = [visit(2)];
    expect(await (await w.sync()).json()).toMatchObject({ created: 0, changed: 0, removed: 1 });
    expect([...w.google.calendars.get('cal-1')!.keys()]).toEqual([eventIdOf(visit(2).id)]);
  });

  it('is discreet by default, shows the place only when the member says so, and changing it changes the events', async () => {
    const placed = visit(1, { name: 'Fresh Start Kitchen', address: '1234 Market St, Philadelphia' });
    const w = world({ visits: [placed] });
    await w.connect();
    await w.sync();
    const event = [...w.google.calendars.get('cal-1')!.values()][0] as { summary: string; location?: string; source: { url: string } };
    expect(event.summary).toBe('Pam visit');
    expect(event.location).toBeUndefined();
    expect(event.source.url).toBe('https://app.joinpam.org/trips/');

    w.db.showDetails = true;
    expect(await (await w.sync()).json()).toMatchObject({ changed: 1 });
    const shown = [...w.google.calendars.get('cal-1')!.values()][0] as { summary: string; location?: string };
    expect(shown.summary).toBe('Pam visit: Fresh Start Kitchen');
    expect(shown.location).toBe('1234 Market St, Philadelphia');
  });

  it('says what the link says: the same summary, place and address, link, in both shapes', () => {
    for (const showDetails of [false, true]) {
      const v = visit(3, { name: 'Fresh Start Kitchen', address: '1234 Market St, Philadelphia' });
      const text = buildCalendar({ show_details: showDetails, visits: [v] }, new Date(NOW)).replace(/\r\n /g, '');
      const event = eventFor(v, showDetails)!;
      expect(text).toContain(`SUMMARY:${event.summary}`);
      expect(text).toContain(`URL:${event.source.url}`);
      if (showDetails) expect(text).toContain(`LOCATION:${event.location!.replace(/,/g, '\\,')}`);
      else expect(text).not.toContain('LOCATION');
    }
  });

  it('puts nothing in an event but the fields above: no note, no member name, no attendance, no reminder of its own', () => {
    const text = JSON.stringify(eventFor(visit(1, { name: 'Fresh Start Kitchen', address: '1 St' }), true));
    expect(text).not.toMatch(/note|attend|points|first_name|description|attendees/i);
    expect(eventFor(visit(1), false)!.reminders).toEqual({ useDefault: false });
  });

  it('does at most 100 writes for one member in a run, and finishes the rest next time', async () => {
    const many = Array.from({ length: 120 }, (_, n) => visit(n + 1));
    const w = world({ visits: many });
    await w.connect();
    expect(await (await w.sync()).json()).toMatchObject({ created: LIMITS.writes });
    expect(await (await w.sync()).json()).toMatchObject({ created: 20 });
    expect(w.google.calendars.get('cal-1')!.size).toBe(120);
  });
});

describe('when Google says no, Pam stops: it never retries forever', () => {
  it('breaks the connection at once when Google refuses the token, and the clock leaves it alone after', async () => {
    const w = world({ visits: [visit(1)] });
    await w.connect();
    w.deps.fetch; // connected with a good token; now Google refuses it
    const refused = world({ visits: [visit(1)], refreshStatus: 400 });
    refused.db.connections.set(MEMBER, { refresh_token_enc: await seal('REFRESH-1', KEY), calendar_id: 'cal-1', state: 'connected', failures: 0 });
    expect(await (await refused.sync()).json()).toMatchObject({ refused: 1 });
    expect(refused.db.connections.get(MEMBER)!.state).toBe('broken');
    const before = refused.calls.length;
    expect(await (await refused.sync()).json()).toMatchObject({ members: 0 });
    expect(refused.calls.length).toBe(before + 2); // only the lists of who is due and what is to clean up
    expect(await (await refused.call('status')).json()).toEqual({ live: true, connected: true, state: 'broken' });
  });

  it('breaks it when the member has deleted the calendar in Google', async () => {
    const w = world({ visits: [visit(1)] });
    await w.connect();
    const gone = world({ visits: [visit(1)], calendarGone: true });
    gone.db.connections.set(MEMBER, { refresh_token_enc: await seal('REFRESH-1', KEY), calendar_id: 'cal-1', state: 'connected', failures: 0 });
    expect(await (await gone.sync()).json()).toMatchObject({ refused: 1 });
    expect(gone.db.connections.get(MEMBER)!.state).toBe('broken');
  });

  it('tries once per run when Google is unwell, and breaks it on the fifth run in a row', async () => {
    const w = world({ visits: [visit(1)], writeStatus: 500 });
    w.db.connections.set(MEMBER, { refresh_token_enc: await seal('REFRESH-1', KEY), calendar_id: 'cal-1', state: 'connected', failures: 0 });
    w.google.calendars.set('cal-1', new Map());
    for (let run = 1; run <= LIMITS.failures; run += 1) {
      const before = w.calls.filter((c) => c.includes('/events')).length;
      expect(await (await w.sync()).json()).toMatchObject({ unwell: 1 });
      expect(w.calls.filter((c) => c.includes('/events')).length - before).toBe(1);
      expect(w.db.connections.get(MEMBER)!.state).toBe(run < LIMITS.failures ? 'connected' : 'broken');
    }
  });
});

describe('Disconnect always disconnects', () => {
  it('deletes the calendar in Google, revokes the token and deletes the row, all at once', async () => {
    const w = world({ visits: [visit(1)] });
    await w.connect();
    await w.sync();
    const answer = await (await w.call('disconnect')).json();
    expect(answer).toEqual({ ok: true, calendarRemoved: true, revoked: true });
    expect(w.google.deletedCalendars).toEqual(['cal-1']);
    expect(w.google.revoked).toEqual(['REFRESH-1']);
    expect(w.db.connections.size).toBe(0);
    expect(w.db.events.size).toBe(0);
    expect(await (await w.call('status')).json()).toEqual({ live: true, connected: false, state: null });
  });

  it('deletes the row even when Google cannot be reached, and says what it could not do', async () => {
    const w = world({ refreshStatus: 400 });
    w.db.connections.set(MEMBER, { refresh_token_enc: await seal('REFRESH-1', KEY), calendar_id: 'cal-1', state: 'broken', failures: 5 });
    const answer = (await (await w.call('disconnect')).json()) as { ok: boolean; calendarRemoved: boolean };
    expect(answer.ok).toBe(true);
    expect(answer.calendarRemoved).toBe(false);
    expect(w.db.connections.size).toBe(0);
  });

  it('is for a member who is signed in, and only their own connection', async () => {
    const w = world({ loggedIn: false });
    expect((await w.call('disconnect')).status).toBe(401);
    const mine = world();
    mine.db.connections.set(OTHER, { refresh_token_enc: await seal('REFRESH-O', KEY), calendar_id: 'cal-o', state: 'connected', failures: 0 });
    await mine.call('disconnect');
    expect(mine.db.connections.has(OTHER)).toBe(true);
  });
});

describe('erasing an account tells Google too', () => {
  const queue = async (w: ReturnType<typeof world>) =>
    w.db.cleanups.set('clean-1', { id: 'clean-1', refresh_token_enc: await seal('REFRESH-GONE', KEY), calendar_id: 'cal-gone', attempts: 0 });

  it('deletes the calendar and revokes the token for a queued cleanup, with no one connected', async () => {
    const w = world();
    await queue(w);
    w.google.calendars.set('cal-gone', new Map());
    expect(await (await w.sync()).json()).toMatchObject({ members: 0, cleaned: 1, cleanupMissed: 0 });
    expect(w.google.deletedCalendars).toEqual(['cal-gone']);
    expect(w.google.revoked).toEqual(['REFRESH-GONE']);
    expect(w.db.cleanups.size).toBe(0);
  });

  it('tries again next run when Google is unwell, and the erase is not waiting for it', async () => {
    const w = world({ refreshStatus: 500 });
    await queue(w);
    expect(await (await w.sync()).json()).toMatchObject({ cleaned: 0, cleanupMissed: 1 });
    expect(w.db.cleanups.size).toBe(1);
    expect(w.db.cleanupResults[0]).toEqual({ calendar: false, revoked: true });
  });

  it('counts a token the member already took back as done: there is nothing left to reach', async () => {
    const w = world({ refreshStatus: 400 });
    await queue(w);
    expect(await (await w.sync()).json()).toMatchObject({ cleaned: 1 });
    expect(w.db.cleanups.size).toBe(0);
  });

  it('does nothing about it while Pam is off', async () => {
    const w = world({ env: { GOOGLE_SYNC_LIVE: undefined } });
    await queue(w);
    await w.sync();
    expect(w.calls).toEqual([]);
    expect(w.db.cleanups.size).toBe(1);
  });
});

describe('the seal', () => {
  it('opens only with the key, differs every time, and notices tampering', async () => {
    const a = await seal('REFRESH-1', KEY);
    const b = await seal('REFRESH-1', KEY);
    expect(a).not.toBe(b);
    expect(await unseal(a, KEY)).toBe('REFRESH-1');
    const other = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)));
    await expect(unseal(a, other)).rejects.toThrow();
    const flipped = `${a.slice(0, -4)}${a.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA'}`;
    await expect(unseal(flipped, KEY)).rejects.toThrow();
    await expect(seal('x', btoa('short'))).rejects.toThrow();
  });

  it('signs the sign-in state for one member and ten minutes', async () => {
    const state = await signState(MEMBER, NOW + 600_000, 's');
    expect(await verifyState(state, NOW, 's')).toBe(MEMBER);
    expect(await verifyState(state, NOW + 600_001, 's')).toBeNull();
    expect(await verifyState(state, NOW, 't')).toBeNull();
  });
});

describe('what is logged', () => {
  it('is never a token, a member or a visit, even when a run goes wrong', async () => {
    const spies = [vi.spyOn(console, 'log').mockImplementation(() => {}), vi.spyOn(console, 'error').mockImplementation(() => {}), vi.spyOn(console, 'warn').mockImplementation(() => {})];
    const w = world({ visits: [visit(1)], writeStatus: 500 });
    await w.connect();
    await w.sync();
    const refused = world({ refreshStatus: 400 });
    refused.db.connections.set(MEMBER, { refresh_token_enc: await seal('REFRESH-1', KEY), calendar_id: 'cal-1', state: 'connected', failures: 0 });
    await refused.sync();
    const said = spies.flatMap((s) => s.mock.calls.flat().map(String)).join(' ');
    expect(said).not.toMatch(/REFRESH|ACCESS|v1\.|cccccccc|aaaaaaaa|Bearer/);
  });
});
