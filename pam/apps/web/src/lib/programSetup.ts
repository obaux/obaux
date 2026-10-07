'use client';

import { useEffect, useState } from 'react';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import type { SessionState } from './useSession';

/**
 * What a program lead has set up, for Home's getting-started cards (D-352).
 *
 * Two things a lead does once — add their program, add their photo — and
 * one that happens to them: a member books a visit. Home shows the cards
 * for what is still to do, and the calendar once somebody is booked.
 *
 * **Fresh or example.** Every demo account and story shows the example
 * program and its example bookings (`USE_DUMMY_PEOPLE`, D-172), so Home
 * there looks like a program in use. Somebody who has just finished signing
 * up on this device has nothing yet, and Home should say so: `JoinScreen`
 * marks the account fresh, and a fresh account sees no example data. The
 * mark lives for the tab (sessionStorage), like the rest of the prototype's
 * state, and every story starts without it.
 *
 * A step done this visit is remembered the same way, so adding a photo in
 * the prototype — where nothing is really stored — still takes its card off
 * Home. A real account also counts what the database says: a photo on the
 * profile.
 */
const FRESH = 'pam.setup.fresh';
const DONE = 'pam.setup.done.';
export const SETUP_CHANGED = 'pam:setup-changed';

export type SetupStep = 'program' | 'photo';

function read(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function write(key: string): void {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // Private mode: Home shows the card again next time, which is harmless.
  }
  window.dispatchEvent(new Event(SETUP_CHANGED));
}

/** Called as sign-up ends (D-353): this account has nothing in it yet. */
export function markFreshAccount(): void {
  write(FRESH);
}

/** A getting-started step was finished (program sent, photo saved). */
export function markSetupDone(step: SetupStep): void {
  write(DONE + step);
}

/** Whether this tab's account just signed up — no example data for it. */
export function isFreshAccount(): boolean {
  return read(FRESH);
}

export interface ProgramSetup {
  /** Example data is shown: a demo or story account, not a fresh one. */
  readonly isExample: boolean;
  readonly hasProgram: boolean;
  /**
   * Sent to Pam and not approved yet (D-379): the Program tab is "Sent to
   * Pam" until a super admin approves it. In the prototype nothing approves,
   * so a sent program stays here; the real state comes with loading a lead's
   * own program (before-launch, Programs).
   */
  readonly isUnderReview: boolean;
  readonly hasPhoto: boolean;
}

export function useProgramSetup(session: SessionState): ProgramSetup {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const again = () => setTick((n) => n + 1);
    window.addEventListener(SETUP_CHANGED, again);
    return () => window.removeEventListener(SETUP_CHANGED, again);
  }, []);
  void tick;
  const isExample = USE_DUMMY_PEOPLE && !read(FRESH);
  const photoUrl = session.status === 'signed-in' ? session.session.photoUrl : null;
  return {
    isExample,
    hasProgram: isExample || read(DONE + 'program'),
    isUnderReview: !isExample && read(DONE + 'program'),
    hasPhoto: isExample || photoUrl !== null || read(DONE + 'photo'),
  };
}
