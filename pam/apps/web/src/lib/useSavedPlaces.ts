'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Category, Role } from '@pam/config';
import { useMalfunction } from './malfunction';
import { settleWithin } from './settle';

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
 * **A control moves only after its save** (D-616, D-617). The heart, or the Remove on Saved, changes when the write has gone through,
 * not before: a place that says "Saved" and is not is worse than a save that visibly failed. A save that has not been answered in 15
 * seconds counts as failed; when its answer finally comes, the set is read again, so the screen shows what is true. A failure is the
 * small alert at the bottom (`useMalfunction`), named `places.save` or `places.unsave` in the error log, and it scrolls the heart clear.
 * While a place's write is out, a second tap on it is ignored, so nobody taps twice because nothing moved.
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
} {
  const [state, setState] = useState<SavedPlacesState>({ status: 'loading' });
  const [reads, setReads] = useState(0);
  const malfunction = useMalfunction();
  /** The places whose write is out: a second tap on one of them is ignored until it is answered. */
  const writing = useRef(new Set<string>());

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
  }, [enabled, demoRole, reads]);

  const isSaved = useCallback(
    (serviceId: string) =>
      state.status === 'ready' && state.places.some((place) => place.id === serviceId),
    [state],
  );

  /** One write to the database: the row, in or out. Throws on any failure. */
  const write = useCallback(async (change: 'save' | 'unsave', serviceId: string): Promise<void> => {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('signed out');
    const { error } =
      change === 'save'
        ? await supabase.from('saved_places').insert({ member_id: auth.user.id, service_id: serviceId })
        : await supabase.from('saved_places').delete().eq('member_id', auth.user.id).eq('service_id', serviceId);
    if (error) throw error;
  }, []);

  /** The set moves only once the write has gone through; a failure, or no answer in 15 seconds, is the alert and the set stays as it was. */
  const change = useCallback(
    async (kind: 'save' | 'unsave', serviceId: string, apply: (places: readonly SavedPlace[]) => readonly SavedPlace[]) => {
      if (state.status !== 'ready' || writing.current.has(serviceId)) return;
      const from = typeof document === 'undefined' ? null : document.activeElement;
      const next = apply(state.places);

      if (demoRole) {
        setState({ status: 'ready', places: next });
        const { writeDemoSaved } = await import('./savedPlacesDemo');
        writeDemoSaved(demoRole, next);
        return;
      }

      writing.current.add(serviceId);
      const settled = await settleWithin(write(kind, serviceId));
      writing.current.delete(serviceId);
      if (settled.status === 'ok') {
        setState((now) => (now.status === 'ready' ? { status: 'ready', places: apply(now.places) } : now));
        return;
      }
      malfunction.show(kind === 'save' ? 'places.save' : 'places.unsave', settled.error, from);
      // No answer in time: the write may still land, so read the set again once it has answered.
      if (settled.status === 'timeout') void settled.late.then(() => setReads((n) => n + 1));
    },
    [state, demoRole, malfunction, write],
  );

  const save = useCallback(
    (place: SavedPlace) => change('save', place.id, (places) => (places.some((p) => p.id === place.id) ? places : [place, ...places])),
    [change],
  );
  const unsave = useCallback(
    (serviceId: string) => change('unsave', serviceId, (places) => places.filter((place) => place.id !== serviceId)),
    [change],
  );

  return { state, isSaved, save, unsave };
}
