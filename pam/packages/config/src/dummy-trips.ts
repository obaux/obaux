/**
 * Example trips (D-213) — a visit a member has agreed to make: where, when,
 * and who they are meeting. Nothing writes a trip yet; this is what the
 * redesigned Trips tab shows until something does, as every example screen
 * does (D-172). The places are the example places (`dummy-places.ts`), so a
 * pin opens a place that resolves; the people are the example connections.
 */
import type { Category } from './categories.js';

export interface DummyTrip {
  readonly id: string;
  /** A `dummy-places.ts` id. */
  readonly placeId: string;
  readonly placeName: string;
  readonly category: Category;
  readonly address: string;
  readonly lat: number;
  readonly lon: number;
  /** ISO start time. */
  readonly startsAt: string;
  /** A `dummy-connections.ts` id — who they are meeting there. */
  readonly withId: string;
  /** Which of the program's services the visit is for (D-313). */
  readonly serviceId?: string;
}

const daysFromNow = (n: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

/*
 * A member's upcoming example visits: two, not three (Will, 5 October,
 * D-303). The food pantry has no visit, so Saved and the place show what a
 * place without an appointment looks like beside two that have one.
 */
export const DUMMY_TRIPS: readonly DummyTrip[] = [
  {
    id: 'dummy-trip-1',
    placeId: 'dummy-place-learning',
    placeName: 'Example Learning Center',
    category: 'education',
    address: '123 Main St',
    lat: 39.9526,
    lon: -75.1652,
    startsAt: daysFromNow(2, 10),
    withId: 'dummy-p1',
    serviceId: 'service-ged',
  },
  {
    id: 'dummy-trip-2',
    placeId: 'dummy-place-workforce',
    placeName: 'Example Workforce Center',
    category: 'workforce',
    address: '456 Market St',
    lat: 39.9515,
    lon: -75.1605,
    startsAt: daysFromNow(5, 13),
    withId: 'dummy-p2',
    serviceId: 'service-apprentice',
  },
];

// Still in the pool for other people's example histories (a case manager's
// view of a member), so those keep three places to vary across.
const PANTRY_TRIP: DummyTrip = {
  id: 'dummy-trip-3',
  placeId: 'dummy-place-food',
  placeName: 'Example Food Pantry',
  category: 'family_services',
  address: '789 Broad St',
  lat: 39.9612,
  lon: -75.1583,
  startsAt: daysFromNow(9, 11),
  withId: 'dummy-a1',
};
const HISTORY_POOL: readonly DummyTrip[] = [...DUMMY_TRIPS, PANTRY_TRIP];

/**
 * Example trips for any member, past and coming up (D-227) — what a case
 * manager sees on a member's page. The same three example places, on dates
 * that differ by person (from their id), so two members never look identical
 * and a screenshot is the same twice.
 */
export function dummyTripsFor(personId: string): DummyTrip[] {
  const seed = [...personId].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7);
  const offsets = [-24, -12, -4, 3, 10].map((d, i) => d + ((seed + i * 5) % 3));
  return offsets.map((offset, i) => {
    const base = HISTORY_POOL[(seed + i) % HISTORY_POOL.length]!;
    return {
      ...base,
      id: `${base.id}-${personId}-${i}`,
      startsAt: daysFromNow(offset, [9, 10, 13, 15][(seed + i) % 4]!),
    };
  });
}
