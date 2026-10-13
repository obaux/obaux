'use client';

import { useEffect, useState } from 'react';
import type { Category } from '@pam/config';

/**
 * A real member's planned visits, for the case manager whose caseload they are on (D-509: a real account sees real things, never
 * examples). Read as the case manager: the database's own rule (`appointments_select_admin`, `admin_covers`) decides which members'
 * visits come back, so for anybody else this is empty. Only what a trip card shows is asked for (the place, its kind, the day and time):
 * not how a visit was marked, not a note.
 */
export interface MemberTrip {
  readonly id: string;
  readonly placeId: string;
  readonly placeName: string;
  readonly category: Category;
  readonly startsAt: string;
}

interface Row {
  readonly id: string;
  readonly starts_at: string;
  readonly service_id: string | null;
  readonly services: { readonly name: string | null; readonly category: string | null } | { readonly name: string | null; readonly category: string | null }[] | null;
}

export function tripsFromRows(rows: readonly Row[]): MemberTrip[] {
  return rows.flatMap((row) => {
    const service = Array.isArray(row.services) ? row.services[0] : row.services;
    if (!row.service_id || !service?.name) return [];
    return [{ id: row.id, placeId: row.service_id, placeName: service.name, category: (service.category ?? 'other') as Category, startsAt: row.starts_at }];
  });
}

export function useMemberTrips(memberId: string | null, enabled: boolean): readonly MemberTrip[] {
  const [trips, setTrips] = useState<readonly MemberTrip[]>([]);
  useEffect(() => {
    if (!enabled || !memberId) {
      setTrips([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient()
          .from('appointments')
          .select('id,starts_at,service_id,services(name,category)')
          .eq('member_id', memberId)
          .neq('status', 'cancelled')
          .order('starts_at', { ascending: true });
        if (cancelled) return;
        setTrips(error ? [] : tripsFromRows((data ?? []) as unknown as Row[]));
      } catch {
        if (!cancelled) setTrips([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memberId, enabled]);
  return trips;
}
