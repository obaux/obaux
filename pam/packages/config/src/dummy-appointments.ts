/**
 * Example appointments at a program (D-218) — who is coming in, when, and
 * for what — so a program lead's Home can show a day, a week and a month.
 * Nothing books an appointment yet; like every example set (D-172), this is
 * what the screen draws until something does. The people are the example
 * members (`dummy-people.ts`), so each opens onto a page that resolves.
 *
 * Built relative to today, so the schedule always has a today, a this week
 * and a this month whenever it is looked at.
 */
export type AppointmentKind = 'intake' | 'class' | 'checkin' | 'tour';

export interface DummyAppointment {
  readonly id: string;
  /** A `dummy-people.ts` member id. */
  readonly personId: string;
  readonly firstName: string;
  /** ISO start time. */
  readonly startsAt: string;
  readonly minutes: number;
  readonly kind: AppointmentKind;
}

const PEOPLE = [
  ['dummy-m1', 'Jordan'],
  ['dummy-m2', 'Keisha'],
  ['dummy-m3', 'Miguel'],
  ['dummy-m4', 'Aaliyah'],
  ['dummy-m5', 'Devon'],
  ['dummy-m6', 'Priya'],
] as const;

const KINDS: readonly AppointmentKind[] = ['intake', 'class', 'checkin', 'tour'];
// Times in the day, as [hour, minute].
const SLOTS: readonly (readonly [number, number])[] = [
  [9, 0],
  [10, 30],
  [13, 0],
  [15, 30],
];

function at(dayOffset: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Three weeks either side of today, weekdays only, between none and four
 * people a day — a pattern, not random, so a screenshot is the same twice.
 */
function build(): DummyAppointment[] {
  const out: DummyAppointment[] = [];
  for (let offset = -21; offset <= 35; offset += 1) {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue;
    const count = offset === 0 ? 4 : Math.abs(offset * 7 + weekday) % 4;
    for (let i = 0; i < count; i += 1) {
      const slot = SLOTS[i]!;
      const person = PEOPLE[Math.abs(offset * 3 + i) % PEOPLE.length]!;
      out.push({
        id: `dummy-appt-${offset}-${i}`,
        personId: person[0],
        firstName: person[1],
        startsAt: at(offset, slot[0], slot[1]),
        minutes: i % 2 === 0 ? 60 : 30,
        kind: KINDS[Math.abs(offset + i) % KINDS.length]!,
      });
    }
  }
  return out;
}

export const DUMMY_APPOINTMENTS: readonly DummyAppointment[] = build();
