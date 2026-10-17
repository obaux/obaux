'use client';

import { useEffect, useState } from 'react';

/**
 * How many people wait for each city Pam is not in yet (D-593; card a96, Will: "We'll want that number as a reference to
 * decide which cities to prioritize next"). Counts only: `waiting_city_counts()` returns a place and a number, biggest
 * first, and refuses anyone who is not a super admin. Nothing here can name a person.
 */
export interface WaitingCity {
  readonly place: string;
  readonly people: number;
}

export type WaitingCitiesState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly cities: readonly WaitingCity[] }
  | { readonly status: 'error'; readonly offline: boolean };

export function useWaitingCities(enabled: boolean): WaitingCitiesState {
  const [state, setState] = useState<WaitingCitiesState>({ status: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('waiting_city_counts');
        if (cancelled) return;
        if (error || !Array.isArray(data)) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        setState({
          status: 'ready',
          cities: (data as { place: string; people: number }[]).map((row) => ({ place: row.place, people: row.people })),
        });
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return state;
}

/** Everyone waiting, across every city: the number on Home's row. */
export const peopleWaiting = (cities: readonly WaitingCity[]): number => cities.reduce((sum, c) => sum + c.people, 0);
