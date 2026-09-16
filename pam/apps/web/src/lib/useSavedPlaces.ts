'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Category, Role } from '@pam/config';

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
 *
 * **A role preview is a demo, not a second account** (Will, 16 September).
 * Saving is `saved_places.member_id = auth.uid()` — one row set per real
 * account, whatever role's screen it is currently being looked at through.
 * Before this, a super admin who tapped Save while "Viewing as Member" wrote
 * a real row under their own super-admin account, and it kept showing up in
 * every other preview too — the opposite of what a preview is supposed to
 * demonstrate. Pass `demoRole` whenever the caller is currently previewing a
 * role that is not the signed-in account's own, and this hook stops touching
 * Supabase entirely: it reads and writes a local, per-role list seeded from
 * `@pam/config/dummy-places`, kept in `sessionStorage` so it survives a
 * navigation but never reaches the database and never leaks into a different
 * preview. Leave `demoRole` unset (or `null`) for real use, including for a
 * super admin looking at their own, real "Super admin" screen.
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
  /** The same three the search card uses, so the two cards match (0052). */
  readonly description?: string | null;
  readonly audience?: string | null;
  readonly hours?: unknown;
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
  description_plain?: string | null;
  website?: string | null;
  audience?: string | null;
  hours?: unknown;
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
    description: row.description_plain ?? null,
    audience: row.audience ?? null,
    hours: row.hours ?? null,
  };
}

export function useSavedPlaces(
  enabled: boolean,
  demoRole?: Role | null,
): {
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

    if (demoRole) {
      let cancelled = false;
      void import('./savedPlacesDemo').then(({ readDemoSaved }) => {
        if (!cancelled) setState({ status: 'ready', places: readDemoSaved(demoRole) });
      });
      return () => {
        cancelled = true;
      };
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
  }, [enabled, demoRole]);

  const isSaved = useCallback(
    (serviceId: string) =>
      state.status === 'ready' && state.places.some((place) => place.id === serviceId),
    [state],
  );

  const save = useCallback(
    async (place: SavedPlace) => {
      if (state.status !== 'ready' || state.places.some((p) => p.id === place.id)) return;
      const before = state.places;
      const after = [place, ...before];
      setFailed(false);
      setState({ status: 'ready', places: after });

      if (demoRole) {
        const { writeDemoSaved } = await import('./savedPlacesDemo');
        writeDemoSaved(demoRole, after);
        return;
      }

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
    [state, demoRole],
  );

  const unsave = useCallback(
    async (serviceId: string) => {
      if (state.status !== 'ready') return;
      const before = state.places;
      const after = before.filter((place) => place.id !== serviceId);
      setFailed(false);
      setState({ status: 'ready', places: after });

      if (demoRole) {
        const { writeDemoSaved } = await import('./savedPlacesDemo');
        writeDemoSaved(demoRole, after);
        return;
      }

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
    [state, demoRole],
  );

  return { state, isSaved, save, unsave, failed };
}
