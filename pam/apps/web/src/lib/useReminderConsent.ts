'use client';

/**
 * Whether somebody has agreed to be texted reminders.
 *
 * One row per person in `notification_preferences`. **No row means nobody has
 * asked them yet**, which is different from a no — it is what tells the app to
 * show the reminders screen after a first sign-in, and it is why "Not now"
 * writes a row rather than doing nothing.
 *
 * The sign-in code is not covered by any of this. Pam has no passwords, so
 * asking for a code is asking to be texted one; this is only about the messages
 * that arrive later, unprompted (D-085).
 */

/**
 * Where somebody stands on texts. `stopped` is a STOP the person sent: it is
 * stored (`sms_stopped_at`), nothing in the app can clear it (the database
 * refuses it, 20261010071947_a_stored_stop_cannot_be_cleared_from_the_app), and every
 * screen that asks about texts shows it instead of a question (D-453).
 */
export interface TextStatus {
  /** `null` when nobody has been asked yet. A stopped person is never `true`. */
  readonly consent: boolean | null;
  readonly stopped: boolean;
}

export async function getTextStatus(memberId: string): Promise<TextStatus> {
  try {
    const { createClient } = await import('./supabase');
    const { data } = await createClient()
      .from('notification_preferences')
      .select('sms_enabled, sms_stopped_at')
      .eq('member_id', memberId)
      .maybeSingle();

    if (!data) return { consent: null, stopped: false };
    const row = data as { sms_enabled: boolean; sms_stopped_at: string | null };
    const stopped = row.sms_stopped_at != null;
    return { consent: stopped ? false : Boolean(row.sms_enabled), stopped };
  } catch {
    return { consent: null, stopped: false };
  }
}

/** `null` when nobody has been asked yet; `false` after a STOP, whatever else is stored. */
export async function getReminderConsent(memberId: string): Promise<boolean | null> {
  return (await getTextStatus(memberId)).consent;
}

/**
 * Records the answer. Returns false when it could not be saved — and always
 * false for a yes after a STOP: that is never written, here or by the database.
 */
export async function setReminderConsent(memberId: string, enabled: boolean): Promise<boolean> {
  try {
    if (enabled && (await getTextStatus(memberId)).stopped) return false;
    const { createClient } = await import('./supabase');
    const { error } = await createClient()
      .from('notification_preferences')
      .upsert({ member_id: memberId, sms_enabled: enabled }, { onConflict: 'member_id' });
    return !error;
  } catch {
    return false;
  }
}
