'use client';

import { useEffect, useState } from 'react';
import { settleWithin, withStatus } from './settle';

/**
 * Who has been checked in (D-316, Will, 6 October): a program taps the circle
 * beside a visit when the person arrives. Kept in the browser session, like
 * the trips a member adds (D-225). A real visit (a uuid) is the database's
 * (D-526, attendance part B): the lead's tap asks `check_in_visit` and the
 * browser copy only follows what the database said, so a failed ask leaves
 * the circle as it was (D-616: and the small alert at the bottom says so; an ask
 * with no answer in 15 seconds counts as failed, and is read again once it answers). An example visit stays in the session. Only a
 * program checks people in, for now.
 */
const KEY = 'pam.checkins';
export const CHECKINS_CHANGED = 'pam:checkins-changed';

export function readCheckIns(): Readonly<Record<string, string>> {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function write(next: Readonly<Record<string, string>>): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Not kept is survivable in a demo.
  }
  window.dispatchEvent(new Event(CHECKINS_CHANGED));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** What a change came to: done, or not done, with the error (for the log's code) and, when no answer came in time, the late answer. */
export type CheckInResult = { readonly ok: true } | { readonly ok: false; readonly error: unknown; readonly late?: Promise<void> };

type Asked = { readonly ok: true; readonly stillMarked: boolean } | { readonly ok: false; readonly error: unknown; readonly late?: Promise<void> };

/** Asks the database to change a real visit. */
async function ask(door: 'check_in_visit' | 'undo_check_in', appointmentId: string): Promise<Asked> {
  try {
    const { createClient } = await import('./supabase');
    const settled = await settleWithin(Promise.resolve(createClient().rpc(door, { p_appointment_id: appointmentId })));
    if (settled.status === 'timeout') return { ok: false, error: settled.error, late: settled.late };
    if (settled.status === 'failed') return { ok: false, error: settled.error };
    const { data, error, status } = settled.value;
    if (error) return { ok: false, error: withStatus(error, status) };
    const row = (Array.isArray(data) ? data[0] : data) as { status?: string } | undefined;
    return { ok: true, stillMarked: row?.status === 'attended' };
  } catch (error) {
    return { ok: false, error };
  }
}

/** The check-ins of the program's visits, read again from the database (after a save that answered late). */
export async function rereadCheckIns(): Promise<void> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('my_program_visits');
    if (error) return;
    const rows = (data ?? []) as { appointment_id: string; checked_in_at: string | null }[];
    seedCheckIns(rows.map((row) => ({ id: row.appointment_id, checkedInAt: row.checked_in_at })));
  } catch {
    // Not read: the circle stays as the last answer left it.
  }
}

/** Marks the visit as arrived, now. A real visit that could not be saved says so, and the circle stays as it was. */
export async function checkIn(appointmentId: string): Promise<CheckInResult> {
  if (UUID.test(appointmentId)) {
    const answer = await ask('check_in_visit', appointmentId);
    if (!answer.ok) return answer;
  }
  write({ ...readCheckIns(), [appointmentId]: new Date().toISOString() });
  return { ok: true };
}

/** Takes it back — a mistaken tap, confirmed first. A real visit that could not be saved says so. */
export async function undoCheckIn(appointmentId: string): Promise<CheckInResult> {
  if (UUID.test(appointmentId)) {
    const answer = await ask('undo_check_in', appointmentId);
    if (!answer.ok) return answer;
    // Still marked after the undo: the mark was not the program's to take back. The screen
    // says nothing different for it (the database answers the same either way, D-535).
    if (answer.stillMarked) return { ok: true };
  }
  const next = { ...readCheckIns() };
  delete next[appointmentId];
  write(next);
  return { ok: true };
}

/** What the database says about real visits just read: checked in where it is, not where it is not. */
export function seedCheckIns(visits: readonly { id: string; checkedInAt: string | null }[]): void {
  const next = { ...readCheckIns() };
  for (const v of visits) {
    if (v.checkedInAt) next[v.id] = v.checkedInAt;
    else delete next[v.id];
  }
  write(next);
}

/** The check-ins, re-read whenever one changes. Empty until the browser has run. */
export function useCheckIns(): Readonly<Record<string, string>> {
  const [ids, setIds] = useState<Readonly<Record<string, string>>>({});
  useEffect(() => {
    const read = () => setIds(readCheckIns());
    read();
    window.addEventListener(CHECKINS_CHANGED, read);
    return () => window.removeEventListener(CHECKINS_CHANGED, read);
  }, []);
  return ids;
}
