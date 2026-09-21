'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Category } from '@pam/config';
import type { NearbyPlace } from './usePlaces';

/**
 * Places with an open flag, for the people who review them (D-189).
 *
 * `flagged_services()` (0066) answers for a case manager or a super admin
 * and returns zero rows for anybody else — the guard is inside the
 * function. A flagged place has left the public catalogue (`flag_service`
 * sets `is_active = false`), so this is the only way it is seen at all
 * until somebody decides. Same row shape as `usePlaces` plus the flag, so
 * the same `PlaceCard` draws it.
 */
export interface FlaggedPlace extends NearbyPlace {
  readonly flagId: string;
  readonly reason: 'closed' | 'moved' | 'not_accepting' | 'wrong_info';
  readonly note: string | null;
  readonly flagCount: number;
  readonly flaggedAt: string;
}

export type FlaggedPlacesState =
  | { status: 'loading' }
  | { status: 'ready'; places: FlaggedPlace[] }
  | { status: 'empty' }
  | { status: 'error'; offline: boolean };

interface Row {
  id: string;
  name: string;
  lookup_name: string | null;
  category: Category;
  address: string | null;
  phone: string | null;
  place_id: string | null;
  lat: number | null;
  lon: number | null;
  has_hours: boolean;
  description_plain: string | null;
  website: string | null;
  audience: string | null;
  hours: unknown;
  flag_id: string;
  reason: FlaggedPlace['reason'];
  note: string | null;
  flag_count: number;
  flagged_at: string;
}

export function useFlaggedPlaces(enabled: boolean): { state: FlaggedPlacesState; refresh: () => void } {
  const [state, setState] = useState<FlaggedPlacesState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('flagged_services');
        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        const rows = (data ?? []) as Row[];
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
            meters: 0,
            hasHours: row.has_hours,
            hours: row.hours ?? null,
            description: row.description_plain,
            website: row.website,
            audience: row.audience,
            flagId: row.flag_id,
            reason: row.reason,
            note: row.note,
            flagCount: Number(row.flag_count),
            flaggedAt: row.flagged_at,
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
  }, [enabled, nonce]);

  return { state, refresh };
}

/**
 * Decides a flag — `resolve_service_flag()` (0036): keep the place on the
 * list, or take it off and tell whoever saved it. Super admin only, which the
 * function enforces; the screen only offers it to one.
 */
export async function resolveFlag(flagId: string, action: 'keep' | 'remove'): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('resolve_service_flag', {
      p_flag_id: flagId,
      p_action: action,
    });
    return !error;
  } catch {
    return false;
  }
}
