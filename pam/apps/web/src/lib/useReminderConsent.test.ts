import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setTextAlert } from './useReminderConsent';

/**
 * Turning a Text alerts switch off never withdraws the yes to texts (D-615, Lena): the switches are only on once the person agreed on
 * the consent screen, and no text goes without a switch on. A STOP still ends everything.
 */
const writes: Record<string, unknown>[] = [];
let stoppedAt: string | null = null;

vi.mock('./supabase', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { sms_enabled: true, sms_stopped_at: stoppedAt, alert_message: true } }),
        }),
      }),
      upsert: async (row: Record<string, unknown>) => {
        writes.push(row);
        return { error: null };
      },
    }),
  }),
}));

const flags = { message: true, booked: false, changed: false, trip: false } as const;

describe('setTextAlert', () => {
  beforeEach(() => {
    writes.length = 0;
    stoppedAt = null;
  });

  it('turning the last switch off turns only that switch off, for a case manager or a program too', async () => {
    expect(await setTextAlert('u1', 'message', false, flags, true)).toBe(true);
    expect(writes).toEqual([{ member_id: 'u1', alert_message: false }]);
  });

  it('turning one on still records the yes to texts, with that switch', async () => {
    expect(await setTextAlert('u1', 'booked', true, flags, true)).toBe(true);
    expect(writes).toEqual([{ member_id: 'u1', alert_booked: true, sms_enabled: true }]);
  });

  it('a yes after a STOP is never written', async () => {
    stoppedAt = '2026-10-08T15:00:00Z';
    expect(await setTextAlert('u1', 'booked', true, flags, false)).toBe(false);
    expect(writes).toEqual([]);
  });
});
