'use client';

import { useEffect, useState } from 'react';
import { DUMMY_TRIPS } from '@pam/config/dummy-trips';
import { readAddedTrips, savedTripsStatus, TRIPS_CHANGED, withMoves, type AddedTrip, type SavedTripsStatus } from './addedTrips';

/**
 * Every trip a member has, through one hook (D-454): the example trips, the
 * ones added in this tab, and the member's saved ones, each at its moved time,
 * soonest first. Read after mount (storage is the browser's, and the first
 * render has to match the server's) and again whenever a trip is added, moved
 * or loaded — which is also when a saved trip arrives from the database.
 *
 * `added` is what the member made (this tab's and saved), without the example
 * set — what Trips draws beside the examples and what a place checks for "you
 * have a visit here". `status` is the saved trips' read: `loading` while they
 * are being asked for, so a screen can hold its empty state back.
 */
export interface TripsNow {
  readonly examples: readonly AddedTrip[];
  readonly added: readonly AddedTrip[];
  /** Examples and added together. */
  readonly all: readonly AddedTrip[];
  readonly status: SavedTripsStatus;
}

const bySoonest = (a: AddedTrip, b: AddedTrip) => a.startsAt.localeCompare(b.startsAt);

export function useTrips(): TripsNow {
  const [now, setNow] = useState<TripsNow>({ examples: [], added: [], all: [], status: 'idle' });
  useEffect(() => {
    const read = () => {
      const examples = withMoves(DUMMY_TRIPS.map((trip): AddedTrip => ({ ...trip, note: '' }))).sort(bySoonest);
      const added = withMoves(readAddedTrips()).sort(bySoonest);
      setNow({ examples, added, all: [...examples, ...added].sort(bySoonest), status: savedTripsStatus() });
    };
    read();
    window.addEventListener(TRIPS_CHANGED, read);
    return () => window.removeEventListener(TRIPS_CHANGED, read);
  }, []);
  return now;
}
