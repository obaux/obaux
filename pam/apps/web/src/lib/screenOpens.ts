'use client';

import { useEffect } from 'react';
import { useSession } from './useSession';
import { useExamplesOn } from './useExamplesOn';

/**
 * Counting how many phones open Your points and Profile, once a day each (a69, signed as a76; D-555).
 *
 * The phone tells the server to add one (`count_screen_open`), and keeps a note on itself that it has
 * done so today, so a phone counts at most once a day. The note is a date in this phone's own storage
 * and is never sent. The call carries only the screen's name. Only these two screens: counting
 * another needs a new line in Privacy first, which is why the type is closed.
 *
 * Only a real member's phone counts. A demo account, Storybook, and staff looking at the member's
 * screens do not, so the number is not padded by people trying the app out.
 */
export type CountedScreen = 'points' | 'profile';

const NOTE = 'pam.counted.';

/** This phone's date, as `2026-10-12`. */
export function dayOf(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

interface Notes {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Asks the server to add one for `screen` unless this phone already did today. The note is written
 * before the call, so two opens at once count once, and taken back if the call fails, so the next
 * open tries again. Resolves to whether a call was made. Never throws.
 */
export async function countOnce(
  screen: CountedScreen,
  call: (screen: CountedScreen) => Promise<boolean>,
  notes: Notes | null,
  now: Date = new Date(),
): Promise<boolean> {
  const today = dayOf(now);
  try {
    if (notes?.getItem(NOTE + screen) === today) return false;
    notes?.setItem(NOTE + screen, today);
  } catch {
    // No storage on this phone: it would count on every open, so it does not count at all.
    return false;
  }
  let ok = false;
  try {
    ok = await call(screen);
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      notes?.removeItem(NOTE + screen);
    } catch {
      // Nothing to take back.
    }
  }
  return true;
}

async function callServer(screen: CountedScreen): Promise<boolean> {
  const { createClient } = await import('./supabase');
  const { error } = await createClient().rpc('count_screen_open', { p_screen: screen });
  return !error;
}

/** Counts this open of `screen` for a signed-in member, once a day. Put it on the screen itself. */
export function useCountScreenOpen(screen: CountedScreen): void {
  const { state } = useSession();
  // Storybook, a demo account and anyone looking at example data are trying the app out, not using it.
  const examples = useExamplesOn();
  const counts = state.status === 'signed-in' && state.session.role === 'member' && !state.session.isDemo && !examples;
  useEffect(() => {
    if (!counts) return;
    let notes: Notes | null = null;
    try {
      notes = window.localStorage;
    } catch {
      notes = null;
    }
    void countOnce(screen, callServer, notes);
  }, [counts, screen]);
}
