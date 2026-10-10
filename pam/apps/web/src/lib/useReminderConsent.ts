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
  /** The Text alerts switches (D-478): one per kind of text about something that happened. All start off. */
  readonly alerts: AlertFlags;
}

/** The four texts that say something happened (D-478): a message, a visit booked, a visit changed, a visit planned. */
export type AlertKind = 'message' | 'booked' | 'changed' | 'trip';
export type AlertFlags = Readonly<Record<AlertKind, boolean>>;
const NO_ALERTS: AlertFlags = { message: false, booked: false, changed: false, trip: false };
const ALERT_COLUMN: Record<AlertKind, string> = {
  message: 'alert_message',
  booked: 'alert_booked',
  changed: 'alert_changed',
  trip: 'alert_trip',
};

export async function getTextStatus(memberId: string): Promise<TextStatus> {
  try {
    const { createClient } = await import('./supabase');
    const { data } = await createClient()
      .from('notification_preferences')
      .select('sms_enabled, sms_stopped_at, alert_message, alert_booked, alert_changed, alert_trip')
      .eq('member_id', memberId)
      .maybeSingle();

    if (!data) return { consent: null, stopped: false, alerts: NO_ALERTS };
    const row = data as {
      sms_enabled: boolean;
      sms_stopped_at: string | null;
      alert_message?: boolean;
      alert_booked?: boolean;
      alert_changed?: boolean;
      alert_trip?: boolean;
    };
    const stopped = row.sms_stopped_at != null;
    return {
      consent: stopped ? false : Boolean(row.sms_enabled),
      stopped,
      alerts: {
        message: Boolean(row.alert_message),
        booked: Boolean(row.alert_booked),
        changed: Boolean(row.alert_changed),
        trip: Boolean(row.alert_trip),
      },
    };
  } catch {
    return { consent: null, stopped: false, alerts: NO_ALERTS };
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

/**
 * Turns one Text alerts switch on or off (D-478). Turning one on records the yes
 * to texts too, as it always has; turning the last one off withdraws it, but only
 * when `alertsAreAllTheyGetTexts` (a case manager or program: for them the yes
 * exists for the alerts). A member's yes also covers their reminders and saved
 * places, so one alert going off never withdraws it. Always false for a yes after
 * a STOP; the database holds the same line.
 */
export async function setTextAlert(
  memberId: string,
  kind: AlertKind,
  on: boolean,
  current: AlertFlags,
  alertsAreAllTheyGetTexts: boolean,
): Promise<boolean> {
  try {
    if (on && (await getTextStatus(memberId)).stopped) return false;
    const { createClient } = await import('./supabase');
    const anyOther = (Object.keys(current) as AlertKind[]).some((k) => k !== kind && current[k]);
    const row: Record<string, unknown> = { member_id: memberId, [ALERT_COLUMN[kind]]: on };
    if (on) row.sms_enabled = true;
    else if (alertsAreAllTheyGetTexts && !anyOther) row.sms_enabled = false;
    const { error } = await createClient().from('notification_preferences').upsert(row, { onConflict: 'member_id' });
    return !error;
  } catch {
    return false;
  }
}
