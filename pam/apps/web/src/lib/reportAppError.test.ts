import { describe, expect, it } from 'vitest';
import { APP_ERROR_QUEUE_MAX, createReporter } from './reportAppError';

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
