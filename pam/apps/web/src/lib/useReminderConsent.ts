'use client';

/**
 * Whether somebody has agreed to be texted reminders.
 *
 * One row per person in `notification_preferences`. **No row means nobody has
 * asked them yet**, which is different from a no — it is what tells the app to
 * show the reminders screen after a first sign-in, and it is why "Not now"
 * writes a row rather than doing nothing.
 *
 * The sign-in code is not covered by any of this. PAM has no passwords, so
 * asking for a code is asking to be texted one; this is only about the messages
 * that arrive later, unprompted (D-085).
 */

/** `null` when nobody has been asked yet. */
export async function getReminderConsent(memberId: string): Promise<boolean | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data } = await createClient()
      .from('notification_preferences')
      .select('sms_enabled')
      .eq('member_id', memberId)
      .maybeSingle();

    return data ? Boolean((data as { sms_enabled: boolean }).sms_enabled) : null;
  } catch {
    return null;
  }
}

/** Records the answer. Returns false when it could not be saved. */
export async function setReminderConsent(memberId: string, enabled: boolean): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient()
      .from('notification_preferences')
      .upsert({ member_id: memberId, sms_enabled: enabled }, { onConflict: 'member_id' });
    return !error;
  } catch {
    return false;
  }
}
