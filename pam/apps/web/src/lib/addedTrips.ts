'use client';

/**
 * Trips a member added in this visit (D-225) — the example flow's output,
 * kept in the browser session so the new trip shows on the map and in the
 * drawer, as the real one would. Nothing books an appointment yet; the flow
 * is front end only, like every example set (D-172).
 */
export interface AddedTrip {
  readonly id: string;
  readonly placeId: string;
  readonly placeName: string;
  readonly category: string;
  readonly lat: number;
  readonly lon: number;
  readonly startsAt: string;
  readonly note: string;
}

const KEY = 'pam.trips.added';

export function readAddedTrips(): AddedTrip[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AddedTrip[]) : [];
  } catch {
    return [];
  }
}

export function addTrip(trip: AddedTrip): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...readAddedTrips(), trip]));
  } catch {
    // Not kept is survivable in a demo.
  }
}
