import { describe, expect, it } from 'vitest';
import { APP_ERROR_QUEUE_MAX, codeFromAnswer, codeFromError, createReporter, databaseAnswered, failureFor, failureKindOf } from './reportAppError';

/** D-616: a failed action is reported with an action key and a code, never a message; it never throws; it waits offline. */
function setup(opts: { online?: boolean; reach?: boolean; throws?: boolean } = {}) {
  const state = { online: opts.online ?? true, reach: opts.reach ?? true, sent: [] as Record<string, unknown>[], later: [] as (() => void)[] };
  const report = createReporter({
    send: async (wire) => {
      if (opts.throws) throw new Error('boom');
      if (!state.reach) return false;
      state.sent.push({ ...wire });
      return true;
    },
    online: () => state.online,
    whenOnline: (fn) => state.later.push(fn),
    describe: () => ({ p_area: '/alerts/', p_build: 'b76', p_platform: 'web', p_locale: 'es' }),
  });
  return { state, report };
}
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('reportAppError', () => {
  it('sends the action and the code with where and on what, and nothing else', async () => {
    const { state, report } = setup();
    report({ action: 'alerts.switch.closed', code: 500 });
    await settle();
    expect(state.sent).toEqual([
      { p_area: '/alerts/', p_build: 'b76', p_platform: 'web', p_locale: 'es', p_action: 'alerts.switch.closed', p_code: '500' },
    ]);
    expect(Object.keys(state.sent[0]!).sort()).toEqual(['p_action', 'p_area', 'p_build', 'p_code', 'p_locale', 'p_platform']);
  });

  it('turns an error message passed as the code into "unknown": the words of an error never leave the phone', async () => {
    const { state, report } = setup();
    report({ action: 'messages.send', code: 'duplicate key (phone)=(+12155550100) already exists' });
    await settle();
    expect(state.sent.map((w) => w['p_code'])).toEqual(['unknown']);
    expect(JSON.stringify(state.sent)).not.toMatch(/2155550100|duplicate/);
  });

  it('keeps a SQLSTATE and the three words, and sends "unknown" when there is no code', async () => {
    const { state, report } = setup();
    for (const code of ['23505', 'offline', 'timeout', undefined, null]) report({ action: 'messages.send', code });
    await settle();
    await settle();
    expect(state.sent.map((w) => w['p_code'])).toEqual(['23505', 'offline', 'timeout', 'unknown', 'unknown']);
  });

  it('drops an action that is not on the closed list, and does not throw', async () => {
    const { state, report } = setup();
    expect(() => report({ action: 'free.text.here' })).not.toThrow();
    expect(() => report({ action: undefined as unknown as string })).not.toThrow();
    await settle();
    expect(state.sent).toEqual([]);
  });

  it('does not throw when sending throws', async () => {
    const { report } = setup({ throws: true });
    expect(() => report({ action: 'messages.send', code: 500 })).not.toThrow();
    await settle();
  });

  it('waits offline, keeps ten at most (the oldest dropped), and sends them in order when the network is back', async () => {
    const { state, report } = setup({ online: false });
    for (let i = 0; i < APP_ERROR_QUEUE_MAX + 3; i++) report({ action: 'messages.send', code: String(400 + i) });
    await settle();
    expect(state.sent).toEqual([]);
    expect(state.later.length).toBe(1);
    state.online = true;
    state.later[0]!();
    await settle();
    await settle();
    expect(state.sent.map((w) => w['p_code'])).toEqual(Array.from({ length: APP_ERROR_QUEUE_MAX }, (_, i) => String(403 + i)));
  });

  it('keeps a report when the network fails under it and tries again when it is back', async () => {
    const { state, report } = setup({ reach: false });
    report({ action: 'messages.photo', code: 'timeout' });
    await settle();
    expect(state.sent).toEqual([]);
    expect(state.later.length).toBe(1);
    state.reach = true;
    state.later[0]!();
    await settle();
    expect(state.sent.map((w) => w['p_code'])).toEqual(['timeout']);
  });
});

describe('codeFromError', () => {
  it('says offline without a network, timeout for an abort, and otherwise only a status or SQLSTATE', () => {
    expect(codeFromError(new Error('x'), false)).toBe('offline');
    expect(codeFromError({ name: 'AbortError' }, true)).toBe('timeout');
    expect(codeFromError({ code: '42501', message: 'permission denied for (phone)=(+12155550100)' }, true)).toBe('42501');
    expect(codeFromError({ status: 503 }, true)).toBe('503');
    expect(codeFromError({ code: 'PGRST202' }, true)).toBe('unknown');
    expect(codeFromError(new Error('duplicate (phone)=(+12155550100)'), true)).toBe('unknown');
    expect(codeFromError(undefined, true)).toBe('unknown');
  });
});

describe('the HTTP status names a failure that has no SQLSTATE (Iris D2)', () => {
  it('uses the answer\'s status when the error has no closed-shape code, and the SQLSTATE when it has one', () => {
    expect(codeFromAnswer({ code: '', message: '' }, 500)).toBe('500');
    expect(codeFromAnswer({ code: 'PGRST301', message: 'words' }, 401)).toBe('401');
    expect(codeFromAnswer({ code: '42501' }, 403)).toBe('42501');
    expect(codeFromAnswer({ code: '' }, 0)).toBe('unknown');
    expect(codeFromAnswer(null, undefined)).toBe('unknown');
    expect(codeFromError({ status: 503 }, true)).toBe('503');
  });
});

describe('a report the database answered is not sent again (Iris D3)', () => {
  it('any HTTP status is an answer, even a 5xx with nothing in it; only status 0, a network failure, is not', () => {
    expect(databaseAnswered({ status: 200 })).toBe(true);
    expect(databaseAnswered({ status: 204 })).toBe(true);
    expect(databaseAnswered({ status: 500 })).toBe(true);
    expect(databaseAnswered({ status: 404 })).toBe(true);
    expect(databaseAnswered({ status: 0 })).toBe(false);
    expect(databaseAnswered({})).toBe(false);
  });

  it('an answered report leaves the queue, so the next failure does not send it a second time', async () => {
    const { state, report } = setup();
    report({ action: 'messages.send', code: 500 });
    await settle();
    report({ action: 'messages.photo', code: 'timeout' });
    await settle();
    expect(state.sent.map((w) => w['p_action'])).toEqual(['messages.send', 'messages.photo']);
  });
});

describe('failureKindOf (D-618)', () => {
  it('names the kind from the same code the log holds', () => {
    expect(failureKindOf({ code: '42501' }, true)).toBe('not-allowed');
    expect(failureKindOf({ code: '' , status: 401 }, true)).toBe('signed-out');
    expect(failureKindOf({ code: '23505' }, true)).toBe('changed');
    expect(failureKindOf({ name: 'AbortError' }, true)).toBe('timeout');
    expect(failureKindOf({ code: 'whatever', status: 500 }, true)).toBe('server');
    expect(failureKindOf(undefined, true)).toBe('server');
  });
  it('no network is offline, and a send refused for going too fast is too-many', () => {
    expect(failureKindOf({ code: '500' }, false)).toBe('offline');
    expect(failureKindOf(new Error('PAM_RATE_LIMITED'), true)).toBe('too-many');
  });
});

describe('what Iris found in the codes (D-618)', () => {
  it('a bare word given as the error is its own code: the "timeout" the saves pass', () => {
    expect(codeFromError('timeout', true)).toBe('timeout');
    expect(codeFromError('offline', true)).toBe('offline');
    expect(codeFromError('some words (phone)=(+12155550100)', true)).toBe('unknown');
  });
  it('a supabase-js abort has no name, only a message that begins with it', () => {
    expect(codeFromError({ message: 'AbortError: signal is aborted without reason', code: '' }, true)).toBe('timeout');
    expect(failureKindOf({ message: 'AbortError: The operation was aborted', code: '' }, true)).toBe('timeout');
    expect(codeFromError({ message: 'not an AbortError at the start', code: '' }, true)).toBe('unknown');
  });
  it('a guard\'s own word names the kind where the message is in hand; the code alone says refused', () => {
    expect(failureKindOf({ code: 'P0001', message: 'OUTSIDE_THE_VISIT_WINDOW' }, true)).toBe('wrong-time');
    expect(failureKindOf({ code: 'P0001', message: 'PLANNED_TOO_LATE' }, true)).toBe('wrong-time');
    expect(failureKindOf({ code: 'P0001', message: 'ROLE_PAIR_NOT_ALLOWED' }, true)).toBe('refused');
    expect(failureKindOf({ code: 'P0001', message: 'VISIT_CANCELLED' }, true)).toBe('changed');
    expect(failureKindOf({ code: 'P0001', message: 'VISIT_NOT_FOUND' }, true)).toBe('gone');
    expect(failureKindOf({ code: 'P0001', message: 'ONLY_A_SUPER_ADMIN' }, true)).toBe('not-allowed');
    expect(failureKindOf({ code: 'P0001', message: 'something nobody listed' }, true)).toBe('refused');
    expect(failureKindOf({ code: 'P0001', message: 'VISIT_CANCELLED' }, false)).toBe('offline');
  });
});

describe('the whole error is read before the code is narrowed (D-618, Dot)', () => {
  it('an expired sign-in and a missing row are told apart by PostgREST\'s own codes and words', () => {
    expect(failureKindOf({ code: 'PGRST301', message: 'JWT expired' }, true)).toBe('signed-out');
    expect(failureKindOf({ code: 'PGRST303', message: 'x' }, true)).toBe('signed-out');
    expect(failureKindOf({ code: '', message: 'JWT expired' }, true)).toBe('signed-out');
    expect(failureKindOf({ code: 'PGRST116', message: 'The result contains 0 rows' }, true)).toBe('gone');
    expect(failureKindOf({ code: 'PGRST000', message: 'x' }, true)).toBe('server');
  });
  it('42501 is signed-out when there is no session and not-allowed when there is one', () => {
    expect(failureKindOf({ code: '42501' }, { online: true, signedIn: false })).toBe('signed-out');
    expect(failureKindOf({ code: '42501' }, { online: true, signedIn: true })).toBe('not-allowed');
    expect(failureKindOf({ code: '42501' }, { online: true })).toBe('not-allowed');
    expect(failureKindOf({ code: '403' }, { online: true, signedIn: false })).toBe('not-allowed');
  });
  it('a boolean second argument is still the network', () => {
    expect(failureKindOf({ code: '500' }, false)).toBe('offline');
  });
});

describe('failureFor: no alert when the outcome has already happened', () => {
  it('a place already saved, a visit already cancelled, a request already decided are done', () => {
    expect(failureFor('places.save', { code: '23505' }, true)).toBe('done');
    expect(failureFor('trips.cancel', { code: 'P0001', message: 'TRIP_NOT_FOUND' }, true)).toBe('done');
    expect(failureFor('trips.cancel', { code: 'P0001', message: 'VISIT_CANCELLED' }, true)).toBe('done');
    expect(failureFor('requests.review', { code: 'P0001', message: 'REQUEST_ALREADY_DECIDED' }, true)).toBe('done');
  });
  it('the same words on another action are a kind, not done; and 23505 elsewhere is changed', () => {
    expect(failureFor('checkin.here', { code: 'P0001', message: 'VISIT_CANCELLED' }, true)).toBe('changed');
    expect(failureFor('places.unsave', { code: '23505' }, true)).toBe('changed');
    expect(failureFor('places.save', { code: '500' }, true)).toBe('server');
    expect(failureFor('places.save', { code: '500' }, false)).toBe('offline');
  });
});
