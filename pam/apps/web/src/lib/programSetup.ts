'use client';

import { useEffect, useState } from 'react';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import type { SessionState } from './useSession';
import type { ProgramDetails } from './useJoin';
import type { OwnProgram } from './ownProgram';
import { useOwnProgram } from './useOwnProgram';

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
 * profile, and — since D-447 — the lead's own program: a program lead who has
 * one on file sees it, waiting for review or live, on any phone, whatever this
 * tab remembers. Only when there is none do the tab's marks decide.
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

/**
 * Delete and start over (Will, 7 October, D-385): what was sent is gone and
 * the account is back to having no program — the Program tab is Add a
 * program again, and Home's first card is Add your program. In the real app
 * this also withdraws the listing from Pam's review queue (before-launch).
 */
export function startOver(): void {
  try {
    sessionStorage.removeItem(SENT);
    sessionStorage.removeItem(DONE + 'program');
  } catch {
    // Private mode: nothing was kept to delete.
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

/**
 * Whether the lead's program is approved and live (D-383). Until it is, the
 * Program tab is a page of its own — Add a program, then Sent to Pam — that
 * covers the bottom bar and goes Back to Home. In the prototype only the
 * example account has a live program; nothing approves a sent one.
 */
export function isProgramLive(): boolean {
  return USE_DUMMY_PEOPLE && !read(FRESH);
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
   * Pam" until a super admin approves it. Read from the lead's program when
   * they have one on file (D-447); the tab's mark otherwise.
   */
  readonly isUnderReview: boolean;
  /**
   * Approved and taking visits: there is a program to book into (D-384). The
   * lead's own program once it is approved; the example account's otherwise.
   */
  readonly isLive: boolean;
  /** While under review: still checking, taking longer, or changes asked for (D-381). */
  readonly reviewStatus: ReviewStatus;
  /** What was sent, if this tab or the database knows. */
  readonly sent: SentProgram | null;
  readonly hasPhoto: boolean;
  /** The lead's own program, loaded from the database (D-447); null when there is none to show. */
  readonly program: OwnProgram | null;
  /** The database is still being asked: screens that choose between Add and the program wait. */
  readonly isLoading: boolean;
}

export function useProgramSetup(session: SessionState): ProgramSetup {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const again = () => setTick((n) => n + 1);
    window.addEventListener(SETUP_CHANGED, again);
    return () => window.removeEventListener(SETUP_CHANGED, again);
  }, []);
  void tick;
  const own = useOwnProgram(session);
  const program = own.status === 'ready' ? own.program : null;
  const isExample = USE_DUMMY_PEOPLE && !read(FRESH) && program === null;
  const photoUrl = session.status === 'signed-in' ? session.session.photoUrl : null;
  const sent: SentProgram | null = program
    ? { details: program.details, sentAt: program.sentAt, changes: program.changesNote }
    : readSentProgram();
  return {
    isExample,
    hasProgram: isExample || program !== null || read(DONE + 'program'),
    isUnderReview: program ? !program.isLive : !isExample && read(DONE + 'program'),
    isLive: program ? program.isLive : isExample,
    reviewStatus: reviewStatusOf(sent),
    sent,
    hasPhoto: isExample || photoUrl !== null || read(DONE + 'photo'),
    program,
    isLoading: own.status === 'loading',
  };
}
