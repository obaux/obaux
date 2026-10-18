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

function at(today: Date, dayOffset: number, hour: number, minute: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** A calendar day as a whole number (the day on the phone's own calendar), so a pattern can be keyed on the date itself. */
function dayNumber(day: Date): number {
  return Math.floor(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 86_400_000);
}

/**
 * Three weeks either side of today, weekdays only, between none and four
 * people a day — a pattern, not random, so a screenshot is the same twice.
 *
 * The count for a day is keyed on the date itself (its day number, mod 5), not on how far it is from today: a weekday's five days in a
 * row come to each of 0 to 4 exactly once, so no Monday-to-Friday week is ever empty, whatever today is (it was empty on a Sunday: the
 * old pattern, `offset * 7 + weekday`, is a multiple of 4 for every weekday of the coming week) and a day looks the same from any day.
 * Today, when it is a weekday, always has four.
 */
export function buildAppointments(today: Date): DummyAppointment[] {
  const out: DummyAppointment[] = [];
  for (let offset = -21; offset <= 35; offset += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() + offset);
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue;
    const count = offset === 0 ? 4 : dayNumber(day) % 5;
    for (let i = 0; i < count; i += 1) {
      const slot = SLOTS[i]!;
      const person = PEOPLE[Math.abs(offset * 3 + i) % PEOPLE.length]!;
      out.push({
        id: `dummy-appt-${offset}-${i}`,
        personId: person[0],
        firstName: person[1],
        startsAt: at(today, offset, slot[0], slot[1]),
        minutes: i % 2 === 0 ? 60 : 30,
        kind: KINDS[Math.abs(offset + i) % KINDS.length]!,
      });
    }
  }
  return out;
}

export const DUMMY_APPOINTMENTS: readonly DummyAppointment[] = buildAppointments(new Date());
