'use client';

import { useEffect, useState } from 'react';
import { DUMMY_TRIPS } from '@pam/config/dummy-trips';
import { readAddedTrips, TRIPS_CHANGED, withMoves } from './addedTrips';

export interface NextVisit {
  readonly id: string;
  readonly startsAt: string;
}

/**
 * The soonest visit still ahead at each place, by place id (D-292) — for
 * Saved's "Wed, Oct 7 · 10:00 AM" tags. Example trips plus the ones added
 * this visit, each at its moved time (D-281), so changing an appointment
 * changes the tag. Read after mount (storage is the browser's), and again
 * whenever a trip moves.
 *
 * `isOn` false (anyone but a member) answers nothing: staff have no trips.
 */
export function useNextVisits(isOn: boolean): Readonly<Record<string, NextVisit>> {
  const [visits, setVisits] = useState<Readonly<Record<string, NextVisit>>>({});
  useEffect(() => {
    if (!isOn) {
      setVisits({});
      return;
    }
    const read = () => {
      const now = Date.now();
      const next: Record<string, NextVisit> = {};
      for (const trip of withMoves([...DUMMY_TRIPS, ...readAddedTrips()])) {
        if (new Date(trip.startsAt).getTime() <= now) continue;
        const have = next[trip.placeId];
        if (!have || trip.startsAt < have.startsAt) next[trip.placeId] = { id: trip.id, startsAt: trip.startsAt };
      }
      setVisits(next);
    };
    read();
    window.addEventListener(TRIPS_CHANGED, read);
    return () => window.removeEventListener(TRIPS_CHANGED, read);
  }, [isOn]);
  return visits;
}
