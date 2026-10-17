/**
 * The one visit line on a member's card on a case manager's Home (card a93, Dot's design, Will 17 October): the most useful
 * first. The next visit; otherwise the last visit the program marked them as there for; otherwise the last one marked missed;
 * nothing if there are no visits. Read from what the case manager already sees on the member's page (`appointments`,
 * `appointments_select_admin`): the day and time and whether they went or missed it (`transparency.canSee.appointments`).
 * A cancelled visit, and a past visit nobody has marked yet, are neither.
 */
export type CaseloadVisit =
  | { readonly kind: 'next'; readonly at: string }
  | { readonly kind: 'went'; readonly at: string }
  | { readonly kind: 'missed'; readonly at: string };

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
  const past = live.filter((v) => time(v) < now).sort((a, b) => time(b) - time(a));
  const went = past.find((v) => v.status === 'attended');
  if (went) return { kind: 'went', at: went.starts_at };
  const missed = past.find((v) => v.status === 'missed');
  if (missed) return { kind: 'missed', at: missed.starts_at };
  return null;
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
