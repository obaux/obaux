'use client';

import { useEffect, useState } from 'react';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import type { SessionState } from './useSession';
import type { ProgramDetails } from './useJoin';

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

const SENT = 'pam.setup.sent';
/** After this long, the review page says it is taking longer (D-381). */
export const REVIEW_DAYS = 3;

/**
 * What a lead sent, and when (D-381): for "See what you sent", for editing
 * after Pam asks for changes, and for saying honestly when the wait runs
 * long. Kept for the tab, like the rest (the real record comes with loading
 * a lead's own program, before launch). `changes` is Pam's note when it
 * asks for some — nothing sets it in the prototype but a story.
 */
export interface SentProgram {
  readonly details: ProgramDetails;
  readonly sentAt: string;
  readonly changes?: string | null;
}

export function saveSentProgram(details: ProgramDetails, extra: Partial<Omit<SentProgram, 'details'>> = {}): void {
  try {
    sessionStorage.setItem(
      SENT,
      JSON.stringify({ details, sentAt: extra.sentAt ?? new Date().toISOString(), changes: extra.changes ?? null }),
    );
  } catch {
    // Without storage, "See what you sent" has nothing to show; harmless.
  }
  window.dispatchEvent(new Event(SETUP_CHANGED));
}

export function readSentProgram(): SentProgram | null {
  try {
    const raw = sessionStorage.getItem(SENT);
    return raw ? (JSON.parse(raw) as SentProgram) : null;
  } catch {
    return null;
  }
}

/** Where a sent program stands (D-381). */
export type ReviewStatus = 'review' | 'late' | 'changes';

export function reviewStatusOf(sent: SentProgram | null, now = Date.now()): ReviewStatus {
  if (sent?.changes) return 'changes';
  if (sent && now - Date.parse(sent.sentAt) > REVIEW_DAYS * 86_400_000) return 'late';
  return 'review';
}

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
  /** While under review: still checking, taking longer, or changes asked for (D-381). */
  readonly reviewStatus: ReviewStatus;
  /** What was sent, if this tab knows. */
  readonly sent: SentProgram | null;
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
    reviewStatus: reviewStatusOf(readSentProgram()),
    sent: readSentProgram(),
    hasPhoto: isExample || photoUrl !== null || read(DONE + 'photo'),
  };
}
