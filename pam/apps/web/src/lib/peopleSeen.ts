import { peopleSeenKey } from '@pam/config/people-activity';

/**
 * When this account last looked at Home's people strip — kept in
 * `localStorage`, per account, and nowhere else (D-198: "prefer client-side").
 * A save newer than this lights a ring; looking at the strip moves it to now.
 *
 * Every read and write is wrapped: a private window, cleared site data or a
 * blocked store all just mean "never looked", and the week-long fallback in
 * `isNewSave` takes it from there.
 */
export function readPeopleSeen(accountId: string): string | null {
  try {
    return window.localStorage.getItem(peopleSeenKey(accountId));
  } catch {
    return null;
  }
}

export function writePeopleSeen(accountId: string, at: string = new Date().toISOString()): void {
  try {
    window.localStorage.setItem(peopleSeenKey(accountId), at);
  } catch {
    // Nothing to do: the next look will simply use the fallback window.
  }
}
