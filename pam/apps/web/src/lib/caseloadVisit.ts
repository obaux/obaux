/**
 * The one visit line on a member's card on a case manager's Home (card a93, Dot's design, Will 17 October). The next
 * visit; otherwise the most recent past visit that is marked, whichever way ("Marked as there" or "Not marked as there",
 * Sage's words, ledger 6867b09b); nothing if there are none. Read from what the case manager already sees on the member's page (`appointments`,
 * `appointments_select_admin`): the day and time and whether they went or missed it (`transparency.canSee.appointments`).
 * A cancelled visit, and a past visit nobody has marked yet, are neither.
 */
export type CaseloadVisit = {
  readonly kind: 'next' | 'went' | 'missed';
  readonly at: string;
  /**
   * Room for the program that booked the visit (a94, Will 17 October): when programs can book visits, a missed visit a
   * program booked says so. Piper's visit column fills it; until then it is never set.
   */
  readonly bookedBy?: string;
};

/**
 * Whether the program marked the member as there. The one rule for "went" everywhere a person's visits are shown: the
 * member's page (`useMemberTrips`, "Programs attended in the past") and Home's line both use it, so a case manager never
 * sees a "Went" the member's page does not show (Sage, a93). `missed` is the overnight mark (`sweep_missed_visits()`).
 */
export const wentTo = (status: string | null): boolean => status === 'attended';
// Only the overnight sweep sets 'missed' (`sweep_missed_visits()`, D-526): nobody marked the visit. No program marks a person
// missed, which is why Sage's words say "Not marked as there", not "Missed".
export const missed = (status: string | null): boolean => status === 'missed';

export interface VisitRow {
  readonly member_id: string;
  readonly starts_at: string;
  readonly status: string | null;
}

/** The line for one member's visits, at `now` (ms). */
export function visitLineOf(visits: readonly VisitRow[], now: number): CaseloadVisit | null {
  const live = visits.filter((v) => v.status !== 'cancelled');
  const time = (v: VisitRow) => Date.parse(v.starts_at);
  const next = live
    .filter((v) => time(v) >= now)
    .sort((a, b) => time(a) - time(b))[0];
  if (next) return { kind: 'next', at: next.starts_at };
  // Otherwise the most recent past visit that is marked, whichever way (Mira, 17 October, from the card Will chose):
  // went Oct 10 and missed Oct 14 shows the 14th. An unmarked past visit is skipped.
  const last = live
    .filter((v) => time(v) < now && (wentTo(v.status) || missed(v.status)))
    .sort((a, b) => time(b) - time(a))[0];
  if (!last) return null;
  return { kind: wentTo(last.status) ? 'went' : 'missed', at: last.starts_at };
}

/** Every member's line from one read of the whole list's visits. */
export function visitLinesByMember(rows: readonly VisitRow[], now: number): Map<string, CaseloadVisit> {
  const byMember = new Map<string, VisitRow[]>();
  for (const row of rows) byMember.set(row.member_id, [...(byMember.get(row.member_id) ?? []), row]);
  const out = new Map<string, CaseloadVisit>();
  for (const [member, visits] of byMember) {
    const line = visitLineOf(visits, now);
    if (line) out.set(member, line);
  }
  return out;
}
