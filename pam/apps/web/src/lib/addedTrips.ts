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

/*
 * A visit moved with "Change appointment" (Will, 5 October, D-281): its new
 * time, by trip id, kept beside the added trips. One map for both kinds —
 * an example trip can't be rewritten, and an added one is simpler moved the
 * same way — and every screen that lists trips reads through `withMoves`.
 */
const MOVED = 'pam.trips.moved';
export const TRIPS_CHANGED = 'pam:trips-changed';

export function readMoves(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(MOVED);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function moveTrip(id: string, startsAt: string): void {
  try {
    sessionStorage.setItem(MOVED, JSON.stringify({ ...readMoves(), [id]: startsAt }));
  } catch {
    // Not kept is survivable in a demo.
  }
  // A screen still mounted underneath — the place the change began on —
  // reads again when it comes back into view.
  window.dispatchEvent(new Event(TRIPS_CHANGED));
}

/** The same trips, each at its moved time if it was moved. */
export function withMoves<T extends { readonly id: string; readonly startsAt: string }>(trips: readonly T[]): T[] {
  const moves = readMoves();
  return trips.map((trip) => (moves[trip.id] ? { ...trip, startsAt: moves[trip.id]! } : trip));
}
