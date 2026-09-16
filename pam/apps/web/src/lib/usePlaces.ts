'use client';

import { useEffect, useState } from 'react';
import type { Category } from '@pam/config';

/**
 * The nearest services to a point, from the real catalogue.
 *
 * One RPC, `services_near`, does the work. It runs `security invoker`, so what
 * comes back is whatever RLS lets this caller see and nothing more — a
 * signed-out member gets the published catalogue, which is the same set the
 * penetration suite verified. The app cannot widen it by asking differently.
 *
 * Distance is metres here and stays metres until the moment it is displayed:
 * formatting belongs to `distanceLabel()` in @pam/config, which knows about
 * locales and rounding (D-043).
 *
 * The client is imported inside the effect, as in `useSupportPhone` — 60 kB
 * gzipped that nothing on first paint needs, against a 500 kB budget (§12).
 */
export interface NearbyPlace {
  id: string;
  name: string;
  /** The organisation's own spelling, for the Google lookup (see 0019). */
  lookupName: string | null;
  category: Category;
  address: string | null;
  phone: string | null;
  placeId: string | null;
  /**
   * The place's own point. Directions are built from this rather than the
   * address, which the city feeds do not keep current (see 0023).
   */
  lat: number | null;
  lon: number | null;
  meters: number;
  /**
   * Whether PAM holds opening hours for this place at all. True for six rows
   * out of 754 today. `hoursFor()` in @pam/config decides what a screen may
   * show when it is false (D-044, and the placeholder Will asked for on 16
   * September).
   */
  hasHours: boolean;
  /** The place's own hours as stored, or null. Parsed by `hoursFor()`. */
  hours: unknown;
  /** One sentence about what this place is (0050). */
  description: string | null;
  website: string | null;
  /** 'students' or 'youth' when narrower than anybody; null otherwise. */
  audience: string | null;
}

/**
 * Four states, all of which a screen must render. "Loading forever" and "blank
 * because the query failed" are the two failure modes §0 rules out, so the
 * caller is made to handle `error` and `empty` explicitly rather than falling
 * through to an empty list.
 */
export type PlacesState =
  | { status: 'loading' }
  | { status: 'ready'; places: NearbyPlace[] }
  | { status: 'empty' }
  | { status: 'error'; offline: boolean };

interface PlacesQuery {
  lat: number;
  lon: number;
  category?: Category;
  limit?: number;
}

interface ServicesNearRow {
  id: string;
  name: string;
  lookup_name: string | null;
  category: Category;
  address: string | null;
  phone: string | null;
  place_id: string | null;
  lat: number | null;
  lon: number | null;
  meters: number;
  has_hours: boolean;
  description_plain: string | null;
  website: string | null;
  audience: string | null;
  hours: unknown;
}

export function usePlaces({ lat, lon, category, limit = 20 }: PlacesQuery): PlacesState {
  const [state, setState] = useState<PlacesState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const { data, error } = await supabase.rpc('services_near', {
          p_lat: lat,
          p_lon: lon,
          p_category: category ?? null,
          p_limit: limit,
        });

        if (cancelled) return;
        if (error) {
          // Distinguishing offline from broken changes which notice a member
          // reads, and offline is the common case on this hardware (§12).
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        const rows = (data ?? []) as ServicesNearRow[];
        if (rows.length === 0) {
          setState({ status: 'empty' });
          return;
        }

        setState({
          status: 'ready',
          places: rows.map((row) => ({
            id: row.id,
            name: row.name,
            lookupName: row.lookup_name,
            category: row.category,
            address: row.address,
            phone: row.phone,
            placeId: row.place_id,
            lat: row.lat,
            lon: row.lon,
            meters: row.meters,
            hasHours: row.has_hours,
            hours: row.hours ?? null,
            description: row.description_plain,
            website: row.website,
            audience: row.audience,
          })),
        });
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    };

    setState({ status: 'loading' });
    void load();
    return () => {
      cancelled = true;
    };
  }, [lat, lon, category, limit]);

  return state;
}

/** Metres to miles, for `distanceLabel`. */
export const METRES_PER_MILE = 1609.344;
