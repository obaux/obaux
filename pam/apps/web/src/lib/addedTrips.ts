'use client';

/**
 * Trips a member added in this visit (D-225) — the example flow's output,
 * kept in the browser session so the new trip shows on the map and in the
 * drawer, as the real one would. For an example place that is all it is: the
 * flow is front end only, like every example set (D-172).
 *
 * **A real place is saved (D-454).** A trip to a place in the catalogue is
 * written to the database (`book_trip`) and read back with `my_trips()` by
 * `SavedTripsSync` (`savedTrips.ts`), which hands it to `setSavedTrips`. From
 * then on `readAddedTrips()` returns both — this tab's example trips and the
 * member's saved ones — so every screen that lists trips, and listens for
 * `TRIPS_CHANGED`, shows a saved trip with no change of its own.
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
  /** Booked by a program for this member (D-316): their id and first name. */
  readonly forMemberId?: string;
  readonly forName?: string;
  /** Which of the program's services the visit is for (D-313). */
  readonly serviceId?: string;
  readonly serviceName?: string;
}

const KEY = 'pam.trips.added';

/** This tab's own trips: the example places', and a program's booking for a member (D-316). */
function readLocalTrips(): AddedTrip[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AddedTrip[]) : [];
  } catch {
    return [];
  }
}

/** The member's saved trips (D-454), set by `SavedTripsSync`; empty until they are read. */
let saved: readonly AddedTrip[] = [];
export type SavedTripsStatus = 'idle' | 'loading' | 'ready' | 'error';
let savedStatus: SavedTripsStatus = 'idle';

export function setSavedTrips(trips: readonly AddedTrip[], status: SavedTripsStatus = 'ready'): void {
  saved = trips;
  savedStatus = status;
  window.dispatchEvent(new Event(TRIPS_CHANGED));
}

export function savedTripsStatus(): SavedTripsStatus {
  return savedStatus;
}

/** Every trip added or saved: this tab's, then the member's own. */
export function readAddedTrips(): AddedTrip[] {
  return [...readLocalTrips(), ...saved];
}

export function addTrip(trip: AddedTrip): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...readLocalTrips(), trip]));
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

/** A trip of this tab, moved (an example place's). A saved trip is moved in the database (`moveSavedTrip`). */
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
