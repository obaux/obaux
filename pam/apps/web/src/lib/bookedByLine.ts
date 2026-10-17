/**
 * Whether a case manager is told which program booked a visit (D-595). Will chose `'every'` on 17 October 2026, 15:21 ("signed on all").
 * It stays one line so a later change of mind is one line.
 *
 * - `'every'`: "Booked by {program}" sits next to every visit a program booked for the member (the guide's view only; the member's own card
 *   says just "Booked for you", Will, 15:21).
 * - `'missed'`: only next to one the member did not go to.
 */
export const BOOKED_BY_SHOWN_ON: 'every' | 'missed' = 'every';

/** The visit, as far as this line is concerned. */
export interface BookedVisit {
  readonly bookedByProgram?: boolean;
  readonly missed?: boolean;
}

/** True when "Booked by {program}" goes next to this visit — one condition for every screen that shows it. */
export function showsBookedBy(visit: BookedVisit): boolean {
  if (visit.bookedByProgram !== true) return false;
  return BOOKED_BY_SHOWN_ON === 'every' || visit.missed === true;
}
