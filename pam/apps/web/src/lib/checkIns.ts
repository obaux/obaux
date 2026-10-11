'use client';

import { useEffect, useState } from 'react';

/**
 * Who has been checked in (D-316, Will, 6 October): a program taps the circle
 * beside a visit when the person arrives. Kept in the browser session, like
 * the trips a member adds (D-225). A real visit (a uuid) is the database's
 * (D-526, attendance part B): the lead's tap asks `check_in_visit` and the
 * browser copy only follows what the database said, so a failed ask leaves
 * the circle as it was. An example visit stays in the session. Only a
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

/** Asks the database to change a real visit; false when it said no or could not be reached. */
async function ask(door: 'check_in_visit' | 'undo_check_in', appointmentId: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc(door, { p_appointment_id: appointmentId });
    return !error;
  } catch {
    return false;
  }
}

/** Marks the visit as arrived, now. Resolves false when a real visit could not be saved. */
export async function checkIn(appointmentId: string): Promise<boolean> {
  if (UUID.test(appointmentId) && !(await ask('check_in_visit', appointmentId))) return false;
  write({ ...readCheckIns(), [appointmentId]: new Date().toISOString() });
  return true;
}

/** Takes it back — a mistaken tap, confirmed first. Resolves false when a real visit could not be saved. */
export async function undoCheckIn(appointmentId: string): Promise<boolean> {
  if (UUID.test(appointmentId) && !(await ask('undo_check_in', appointmentId))) return false;
  const next = { ...readCheckIns() };
  delete next[appointmentId];
  write(next);
  return true;
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
