'use client';

import { codeFromAnswer, codeFromError } from './reportAppError';

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
  /**
   * The read itself failed, so nobody knows whether this number has been stopped. The screens show it as before; a save of a YES then
   * refuses (it sends nothing) until a read works, because "could not read" is not "not stopped" (Iris, 19 October). `code` is why.
   */
  readonly readFailed?: { readonly code: string };
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
    const { data, error, status } = await createClient()
      .from('notification_preferences')
      .select('sms_enabled, sms_stopped_at, alert_message, alert_booked, alert_changed, alert_trip')
      .eq('member_id', memberId)
      .maybeSingle();
    if (error) return { consent: null, stopped: false, alerts: NO_ALERTS, readFailed: { code: codeFromAnswer(error, status) } };

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
  } catch (caught) {
    return { consent: null, stopped: false, alerts: NO_ALERTS, readFailed: { code: codeFromError(caught) } };
  }
}

/** `null` when nobody has been asked yet; `false` after a STOP, whatever else is stored. */
export async function getReminderConsent(memberId: string): Promise<boolean | null> {
  return (await getTextStatus(memberId)).consent;
}

/**
 * What a save of the text settings answers (D-616): `{ ok: true }`, or `{ ok: false, code }` where `code` has already been through
 * `appErrorCode` (an HTTP status, a SQLSTATE, `offline`, `timeout` or `unknown`) so the screen can hand it straight to
 * `reportAppError`. `stopped: true` marks the one refusal that is not a failure: a yes after a STOP is never written, and is not
 * to be reported as a problem.
 */
export type SaveResult = { readonly ok: true } | { readonly ok: false; readonly code: string; readonly stopped?: true };

const SAVED: SaveResult = { ok: true };
const REFUSED_AFTER_STOP: SaveResult = { ok: false, code: 'unknown', stopped: true };

/**
 * Records the answer. `ok: false` when it could not be saved — and always
 * for a yes after a STOP: that is never written, here or by the database.
 */
export async function setReminderConsent(memberId: string, enabled: boolean): Promise<SaveResult> {
  try {
    if (enabled) {
      const status = await getTextStatus(memberId);
      if (status.stopped) return REFUSED_AFTER_STOP;
      // Could not read whether they are stopped: a yes is not saved on a guess. Turning texts off is always safe.
      if (status.readFailed) return { ok: false, code: status.readFailed.code };
    }
    const { createClient } = await import('./supabase');
    const { error, status } = await createClient()
      .from('notification_preferences')
      .upsert({ member_id: memberId, sms_enabled: enabled }, { onConflict: 'member_id' });
    return error ? { ok: false, code: codeFromAnswer(error, status) } : SAVED;
  } catch (caught) {
    return { ok: false, code: codeFromError(caught) };
  }
}

/**
 * Turns one Text alerts switch on or off (D-478). Turning one on records the yes to texts too, as it always has. Turning one off
 * only turns that switch off: it never withdraws the yes (Lena, 18 October, D-615: a switch is only on once the person has agreed on
 * the consent screen, and no text goes without a switch on, so a staff member who turns the last one off has not left a way to be
 * texted, and does not have to agree again to turn one back on; a STOP still ends everything). `alertsAreAllTheyGetTexts` is kept for
 * callers and no longer changes anything. Always refused for a yes after a STOP (`stopped`); the database holds the same line.
 */
export async function setTextAlert(
  memberId: string,
  kind: AlertKind,
  on: boolean,
  current: AlertFlags,
  alertsAreAllTheyGetTexts: boolean,
): Promise<SaveResult> {
  try {
    if (on) {
      const status = await getTextStatus(memberId);
      if (status.stopped) return REFUSED_AFTER_STOP;
      if (status.readFailed) return { ok: false, code: status.readFailed.code };
    }
    const { createClient } = await import('./supabase');
    void current;
    void alertsAreAllTheyGetTexts;
    const row: Record<string, unknown> = { member_id: memberId, [ALERT_COLUMN[kind]]: on };
    if (on) row.sms_enabled = true;
    const { error, status } = await createClient().from('notification_preferences').upsert(row, { onConflict: 'member_id' });
    return error ? { ok: false, code: codeFromAnswer(error, status) } : SAVED;
  } catch (caught) {
    return { ok: false, code: codeFromError(caught) };
  }
}
