'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Case-manager and program-lead claims waiting on a super admin (0054).
 *
 * `staff_requests` already grants a super admin full read access by RLS
 * (0046) — this is a direct table read, not an RPC, because nothing here is
 * more sensitive than what `directory_people` already shows: a name, a role
 * somebody asked for, and a city they typed. Deciding one is the RPC
 * (`review_staff_request`); reading the list is not.
 */

export interface StaffRequestRow {
  readonly userId: string;
  readonly wantsRole: 'admin' | 'provider';
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly city: string | null;
  readonly createdAt: string;
}

export type StaffRequestsState =
  | { status: 'loading' }
  | { status: 'ready'; requests: readonly StaffRequestRow[] }
  | { status: 'error'; offline: boolean };

export function useStaffRequests(enabled: boolean): {
  state: StaffRequestsState;
  refresh: () => void;
} {
  const [state, setState] = useState<StaffRequestsState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient()
          .from('staff_requests')
          .select('user_id, wants_role, first_name, last_name, city, created_at')
          .is('decision', null)
          .order('created_at', { ascending: true });

        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        const rows = (data ?? []) as {
          user_id: string;
          wants_role: 'admin' | 'provider';
          first_name: string | null;
          last_name: string | null;
          city: string | null;
          created_at: string;
        }[];

        setState({
          status: 'ready',
          requests: rows.map((row) => ({
            userId: row.user_id,
            wantsRole: row.wants_role,
            firstName: row.first_name,
            lastName: row.last_name,
            city: row.city,
            createdAt: row.created_at,
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

/** Approves or denies one request. Region only matters (and is required) on approval. */
export async function reviewStaffRequest(
  userId: string,
  decision: 'approved' | 'denied',
  regionId?: string,
): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('review_staff_request', {
      p_user_id: userId,
      p_decision: decision,
      ...(regionId ? { p_region_id: regionId } : {}),
    });
    return !error;
  } catch {
    return false;
  }
}
