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
}

const daysFromNow = (n: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

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
  },
  {
    id: 'dummy-trip-3',
    placeId: 'dummy-place-food',
    placeName: 'Example Food Pantry',
    category: 'family_services',
    address: '789 Broad St',
    lat: 39.9612,
    lon: -75.1583,
    startsAt: daysFromNow(9, 11),
    withId: 'dummy-a1',
  },
];
