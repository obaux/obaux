'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Category } from '@pam/config';

/**
 * The places a member kept.
 *
 * `saved_places` has existed since 0003 with an own-rows-only policy — a member
 * reads and writes their own and nobody else's, not even their case manager.
 * Nothing wrote to it until now: Save on a place card was a button that changed
 * its own label and forgot by the next screen.
 *
 * Two things this deliberately does:
 *
 * **It answers before the network does.** Saving is one tap on a cheap phone on
 * a bad connection, and a card that waits 800ms to acknowledge is a card
 * somebody taps twice. The list updates first and the write follows; if the
 * write fails the change is rolled back and `failed` goes true, so the screen
 * can say so rather than quietly losing it.
 *
 * **It keeps the whole set in memory.** A member has a handful of saved places,
 * not thousands, so every screen that cares can ask "is this one saved" without
 * a query per card.
 */

export interface SavedPlace {
  readonly id: string;
  readonly name: string;
  readonly lookupName?: string | null;
  readonly category: Category;
  readonly address: string | null;
  readonly phone: string | null;
  readonly placeId: string | null;
  readonly lat: number | null;
  readonly lon: number | null;
}

export type SavedPlacesState =
  | { status: 'loading' }
  | { status: 'ready'; places: readonly SavedPlace[] }
  | { status: 'error'; offline: boolean };

interface ServiceRow {
  id: string;
  name: string;
  lookup_name: string | null;
  category: Category;
  address: string | null;
  phone: string | null;
  place_id: string | null;
  lat: number | null;
  lon: number | null;
}

function toPlace(row: ServiceRow): SavedPlace {
  return {
    id: row.id,
    name: row.name,
    lookupName: row.lookup_name,
    category: row.category,
    address: row.address,
    phone: row.phone,
    placeId: row.place_id,
    lat: row.lat,
    lon: row.lon,
  };
}

export function useSavedPlaces(enabled: boolean): {
  state: SavedPlacesState;
  /** True while the set is known and contains this place. */
  isSaved: (serviceId: string) => boolean;
  save: (place: SavedPlace) => Promise<void>;
  unsave: (serviceId: string) => Promise<void>;
  /** A write did not reach the database. The screen says so; the list is unchanged. */
  failed: boolean;
} {
  const [state, setState] = useState<SavedPlacesState>({ status: 'loading' });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'ready', places: [] });
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        // One call, in the same shape a place card already reads (0044). A
        // plain select cannot answer it: `services.geo` is a geography column,
        // and a card builds its directions link from the point.
        const { data, error } = await createClient().rpc('saved_places_mine');

        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        setState({
          status: 'ready',
          places: ((data ?? []) as ServiceRow[]).map(toPlace),
        });
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const isSaved = useCallback(
    (serviceId: string) =>
      state.status === 'ready' && state.places.some((place) => place.id === serviceId),
    [state],
  );

  const save = useCallback(
    async (place: SavedPlace) => {
      if (state.status !== 'ready' || state.places.some((p) => p.id === place.id)) return;
      const before = state.places;
      setFailed(false);
      setState({ status: 'ready', places: [place, ...before] });

      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error('signed out');

        const { error } = await supabase
          .from('saved_places')
          .insert({ member_id: auth.user.id, service_id: place.id });
        if (error) throw error;
      } catch {
        // Put it back the way it was. A place that says "Saved" and is not is
        // worse than a save that visibly failed.
        setState({ status: 'ready', places: before });
        setFailed(true);
      }
    },
    [state],
  );

  const unsave = useCallback(
    async (serviceId: string) => {
      if (state.status !== 'ready') return;
      const before = state.places;
      setFailed(false);
      setState({ status: 'ready', places: before.filter((place) => place.id !== serviceId) });

      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error('signed out');

        const { error } = await supabase
          .from('saved_places')
          .delete()
          .eq('member_id', auth.user.id)
          .eq('service_id', serviceId);
        if (error) throw error;
      } catch {
        setState({ status: 'ready', places: before });
        setFailed(true);
      }
    },
    [state],
  );

  return { state, isSaved, save, unsave, failed };
}
