'use client';

import { useEffect, useState } from 'react';

/**
 * Who has been checked in (D-316, Will, 6 October): a program taps the circle
 * beside a visit when the person arrives. Kept in the browser session, like
 * the trips a member adds (D-225) — the appointments table has
 * `checked_in_at` and `attendance_method` for the real thing (0004), and
 * nothing writes them yet. Only a program checks people in, for now.
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

/** Marks the visit as arrived, now. */
export function checkIn(appointmentId: string): void {
  write({ ...readCheckIns(), [appointmentId]: new Date().toISOString() });
}

/** Takes it back — a mistaken tap, confirmed first. */
export function undoCheckIn(appointmentId: string): void {
  const next = { ...readCheckIns() };
  delete next[appointmentId];
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
