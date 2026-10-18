/**
 * "Added to calendar" (D-604, a98 plan C): a note, kept on this phone only, that a visit was handed to a calendar from the sheet. Pam cannot see
 * a save, so this is the member's own tap and nothing more: the key is the visit's id and the value is the visit's start time (an ISO time string)
 * at the moment of the tap. No calendar name, no place, no request: nothing is sent to Pam and nothing goes in the database. When the visit's time
 * moves, the stored time no longer matches and the card asks the member to add it again (Sage, ledger b875573a). This file is the only
 * place that touches that storage; `AddVisitToCalendar.tsx` has no storage and makes no request.
 */
const PREFIX = 'pam.calendarAdded:';

/** The start time stored for a visit, or null: never added here, or the phone will not say (private window, storage blocked). */
export function addedStart(visitId: string): string | null {
  try {
    return window.localStorage.getItem(`${PREFIX}${visitId}`);
  } catch {
    return null;
  }
}

/** Notes that the visit, starting at `startsAt`, was handed to a calendar. */
export function markAdded(visitId: string, startsAt: Date): void {
  try {
    window.localStorage.setItem(`${PREFIX}${visitId}`, startsAt.toISOString());
  } catch {
    // The phone will not keep it: the card simply says "Add to calendar" again.
  }
}
