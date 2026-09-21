/**
 * Which avatars on Home's people strip get a ring, and in what order (D-198).
 *
 * A ring means "something new from this person" — one of exactly two things:
 *
 *  1. an unread message from them to the viewer, or
 *  2. a place they saved since the viewer last looked at the strip.
 *
 * Both are facts the viewer is entitled to: the first is their own
 * conversation list; the second is the one activity fact the transparency
 * contract now grants (`new_save_without_the_place`, D-199) — a time, never
 * the place. This module does not know where either came from; the real
 * strip feeds it `useConversations` and `people_activity()` (0067), the
 * example strip feeds it `DUMMY_THREADS` and a dummy `lastSavedAt`, and the
 * two cannot drift because the ranking is written once here.
 *
 * Lit people move to the front, most recent activity first. Everybody else
 * keeps the order they arrived in (the strip lists first names A–Z, so an
 * unlit strip reads the same as before). A person with both an unread
 * message and a new save is lit for the message: tapping them should open
 * the conversation, which is the thing that needs an answer.
 *
 * "Since the viewer last looked" is a timestamp the client keeps per
 * account (`localStorage`, `peopleSeenKey`). It is a convenience, not a
 * record — clearing site data forgets it, and the fallback is a week: with
 * no stored value, a save inside the last seven days counts as new, and
 * anything older does not, so a first visit is not a wall of rings.
 */

export const FIRST_LOOK_WINDOW_MS = 7 * 86_400_000;

/** The localStorage key holding when this account last looked at its people strip. */
export function peopleSeenKey(accountId: string): string {
  return `pam.peopleSeen.${accountId}`;
}

export type LitReason = 'message' | 'save';

export interface PersonSignals {
  /** When their newest unread message to the viewer arrived, or null. */
  readonly unreadAt: string | null;
  /** When they last saved a place, or null. Only ever a time — never the place. */
  readonly lastSavedAt: string | null;
}

export interface RankedPerson<T> {
  readonly person: T;
  /** Why the ring is lit, or null for no ring. */
  readonly reason: LitReason | null;
  /** The newest thing from them, for ordering. */
  readonly activityAt: string | null;
}

/** A save counts as new when it is later than the viewer's last look — or, with no look recorded, within the last week. */
export function isNewSave(lastSavedAt: string | null, lastSeen: string | null, now: Date = new Date()): boolean {
  if (!lastSavedAt) return false;
  const floor = lastSeen ?? new Date(now.getTime() - FIRST_LOOK_WINDOW_MS).toISOString();
  return lastSavedAt > floor;
}

export function rankPeople<T>(
  people: readonly T[],
  signalsFor: (person: T) => PersonSignals,
  lastSeen: string | null,
  now: Date = new Date(),
): readonly RankedPerson<T>[] {
  const ranked = people.map((person, index) => {
    const { unreadAt, lastSavedAt } = signalsFor(person);
    const newSave = isNewSave(lastSavedAt, lastSeen, now);
    const reason: LitReason | null = unreadAt ? 'message' : newSave ? 'save' : null;
    const activityAt = reason === 'message' ? unreadAt : reason === 'save' ? lastSavedAt : null;
    return { person, reason, activityAt, index };
  });

  const lit = ranked
    .filter((r) => r.reason !== null)
    .sort((a, b) => (b.activityAt ?? '').localeCompare(a.activityAt ?? '') || a.index - b.index);
  const rest = ranked.filter((r) => r.reason === null);

  return [...lit, ...rest].map(({ person, reason, activityAt }) => ({ person, reason, activityAt }));
}
