import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { settleWithin } from './settle';
import { codeFromError } from './reportAppError';

/** A save with no answer in time is logged as `timeout`, not `unknown` (Iris's D-618 table). */
describe('settleWithin', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('hands back an error that the log classifies as a timeout', async () => {
    const never = new Promise<void>(() => undefined);
    const settling = settleWithin(never, 15_000);
    await vi.advanceTimersByTimeAsync(15_000);
    const settled = await settling;
    expect(settled.status).toBe('timeout');
    if (settled.status !== 'timeout') return;
    expect(codeFromError(settled.error, true)).toBe('timeout');
  });

  it('keeps a failure its own, and an answer in time ok', async () => {
    const failed = await settleWithin(Promise.reject(Object.assign(new Error('x'), { code: '23505' })));
    expect(failed.status).toBe('failed');
    if (failed.status === 'failed') expect(codeFromError(failed.error, true)).toBe('23505');
    expect((await settleWithin(Promise.resolve(1))).status).toBe('ok');
  });
});

describe('withStatus (Iris L5)', () => {
  it('lets the log name a 500 that has no SQLSTATE, and carries nothing else of the answer', async () => {
    const { withStatus } = await import('./settle');
    const { codeFromError } = await import('./reportAppError');
    const answer = withStatus({ name: 'PostgrestError', code: '', message: 'a person typed this' }, 500);
    expect(codeFromError(answer)).toBe('500');
    expect(JSON.stringify(answer)).not.toContain('person');
    expect(codeFromError(withStatus({ code: '42501', message: 'x' }, 403))).toBe('42501');
    expect(withStatus(null, 500)).toBeNull();
  });
});
