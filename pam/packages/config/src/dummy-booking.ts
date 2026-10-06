/**
 * How a program takes people (D-313, Will, 6 October: "some programs
 * won't have a booking thing, only day/time, and show up at that time,
 * either weekly, bi weekly, or monthly").
 *
 * - **appointment** (the default): a member plans a visit — picks a day
 *   and time in New trip, and the program sees it coming.
 * - **drop-in**: there is nothing to book. The program meets on a
 *   schedule — every Tuesday at 4, every other Wednesday at 6, the first
 *   Monday of the month — and a member just comes. The place's page says
 *   when, and offers directions instead of Plan a trip.
 *
 * Example only, keyed by place id, like the services. The real listing
 * would carry this (a column on `services`, 0003) once Will approves it.
 */
export type DropInCadence = 'weekly' | 'biweekly' | 'monthly';

export interface DropInSchedule {
  readonly cadence: DropInCadence;
  /** 0 = Sunday … 6 = Saturday, as `Date.getDay()`. */
  readonly weekday: number;
  readonly hour: number;
  readonly minute: number;
}

export type DummyBooking = { readonly kind: 'appointment' } | { readonly kind: 'dropin'; readonly schedule: DropInSchedule };

const DROP_IN: Readonly<Record<string, DropInSchedule>> = {
  'dummy-place-food': { cadence: 'weekly', weekday: 2, hour: 16, minute: 0 },
  'dummy-place-family': { cadence: 'biweekly', weekday: 3, hour: 18, minute: 0 },
  'dummy-place-adult-ed': { cadence: 'monthly', weekday: 1, hour: 18, minute: 30 },
};

export function bookingFor(placeId: string): DummyBooking {
  const schedule = DROP_IN[placeId];
  return schedule ? { kind: 'dropin', schedule } : { kind: 'appointment' };
}

/** The next time this schedule meets, from now — for "Next: Tuesday, October 13". */
export function nextDropIn(schedule: DropInSchedule, now: Date = new Date()): Date {
  const next = new Date(now);
  next.setHours(schedule.hour, schedule.minute, 0, 0);
  const ahead = (schedule.weekday - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + ahead);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 7);
  if (schedule.cadence === 'monthly') {
    // The first such weekday of the month: this month's if still ahead, else next month's.
    const first = (year: number, month: number) => {
      const d = new Date(year, month, 1, schedule.hour, schedule.minute, 0, 0);
      d.setDate(1 + ((schedule.weekday - d.getDay() + 7) % 7));
      return d;
    };
    const thisMonth = first(now.getFullYear(), now.getMonth());
    return thisMonth.getTime() > now.getTime() ? thisMonth : first(now.getFullYear(), now.getMonth() + 1);
  }
  return next;
}
