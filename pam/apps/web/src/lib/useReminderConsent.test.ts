import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setReminderConsent, setTextAlert } from './useReminderConsent';

/**
 * Turning a Text alerts switch off never withdraws the yes to texts (D-615, Lena): the switches are only on once the person agreed on
 * the consent screen, and no text goes without a switch on. A STOP still ends everything.
 */
const writes: Record<string, unknown>[] = [];
let stoppedAt: string | null = null;
let upsertError: Record<string, unknown> | null = null;
let readError: Record<string, unknown> | null = null;
let readThrows = false;

vi.mock('./supabase', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (readThrows) throw new Error('network');
            return readError
              ? { data: null, error: readError, status: 503 }
              : { data: { sms_enabled: true, sms_stopped_at: stoppedAt, alert_message: true }, error: null, status: 200 };
          },
        }),
      }),
      upsert: async (row: Record<string, unknown>) => {
        writes.push(row);
        return { error: upsertError };
      },
    }),
  }),
}));

const flags = { message: true, booked: false, changed: false, trip: false } as const;

describe('setTextAlert', () => {
  beforeEach(() => {
    writes.length = 0;
    stoppedAt = null;
    upsertError = null;
    readError = null;
    readThrows = false;
  });

  it('turning the last switch off turns only that switch off, for a case manager or a program too', async () => {
    expect(await setTextAlert('u1', 'message', false, flags, true)).toEqual({ ok: true });
    expect(writes).toEqual([{ member_id: 'u1', alert_message: false }]);
  });

  it('turning one on still records the yes to texts, with that switch', async () => {
    expect(await setTextAlert('u1', 'booked', true, flags, true)).toEqual({ ok: true });
    expect(writes).toEqual([{ member_id: 'u1', alert_booked: true, sms_enabled: true }]);
  });

  it('a yes after a STOP is never written', async () => {
    stoppedAt = '2026-10-08T15:00:00Z';
    expect(await setTextAlert('u1', 'booked', true, flags, false)).toEqual({ ok: false, code: 'unknown', stopped: true });
    expect(writes).toEqual([]);
  });

  it('a save that fails answers with its code, already through appErrorCode, and never the error words', async () => {
    upsertError = { code: '42501', message: 'permission denied for (phone)=(+12155550100)' };
    expect(await setTextAlert('u1', 'booked', true, flags, false)).toEqual({ ok: false, code: '42501' });
    expect(await setReminderConsent('u1', true)).toEqual({ ok: false, code: '42501' });
    upsertError = { code: 'PGRST301', message: 'words (phone)=(+12155550100)' };
    expect(await setTextAlert('u1', 'booked', true, flags, false)).toEqual({ ok: false, code: 'unknown' });
  });

  it('a yes to texts after a STOP is marked stopped, so it is not reported as a problem', async () => {
    stoppedAt = '2026-10-08T15:00:00Z';
    expect(await setReminderConsent('u1', true)).toEqual({ ok: false, code: 'unknown', stopped: true });
  });

  it('a read that fails is "cannot tell", not "not stopped": a yes is not saved on a guess (Iris, 19 October)', async () => {
    readError = { code: '', message: 'gateway' };
    expect(await setTextAlert('u1', 'booked', true, flags, false)).toEqual({ ok: false, code: '503' });
    expect(await setReminderConsent('u1', true)).toEqual({ ok: false, code: '503' });
    expect(writes).toEqual([]);
    readError = null;
    readThrows = true;
    expect(await setTextAlert('u1', 'booked', true, flags, false)).toMatchObject({ ok: false });
    expect(writes).toEqual([]);
  });

  it('...but turning texts off needs no read: a no is always safe to save', async () => {
    readError = { code: '', message: 'gateway' };
    expect(await setTextAlert('u1', 'message', false, flags, true)).toEqual({ ok: true });
    expect(await setReminderConsent('u1', false)).toEqual({ ok: true });
    expect(writes.length).toBe(2);
  });
});
