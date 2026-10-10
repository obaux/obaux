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
  /** What a program lead said about their program at sign-up (0056), if anything. */
  readonly program: RequestedProgram | null;
}

export interface RequestedProgram {
  readonly name: string;
  readonly category: string | null;
  readonly subcategory: string | null;
  readonly description: string | null;
  readonly address: string | null;
  readonly phone: string | null;
  readonly website: string | null;
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
          .select(
            'user_id, wants_role, first_name, last_name, city, created_at, program_name, program_category, program_subcategory, program_description, program_address, program_phone, program_website',
          )
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
          program_name?: string | null;
          program_category?: string | null;
          program_subcategory?: string | null;
          program_description?: string | null;
          program_address?: string | null;
          program_phone?: string | null;
          program_website?: string | null;
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
            program: row.program_name
              ? {
                  name: row.program_name,
                  category: row.program_category ?? null,
                  subcategory: row.program_subcategory ?? null,
                  description: row.program_description ?? null,
                  address: row.program_address ?? null,
                  phone: row.program_phone ?? null,
                  website: row.program_website ?? null,
                }
              : null,
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

/** Why a decision did not go through, in the terms the screen explains (D-491). */
export type ReviewFailure = 'pair' | 'city' | 'decided' | 'gone' | 'other';

export type ReviewResult =
  | { readonly ok: true; readonly addedToExisting: boolean }
  | { readonly ok: false; readonly reason: ReviewFailure };

function failureOf(message: string): ReviewFailure {
  if (message.includes('ROLE_PAIR_NOT_ALLOWED')) return 'pair';
  if (message.includes('ACCOUNT_IN_OTHER_CITY')) return 'city';
  if (message.includes('REQUEST_ALREADY_DECIDED')) return 'decided';
  if (message.includes('REQUEST_NOT_FOUND')) return 'gone';
  return 'other';
}

/**
 * Approves or denies one request. Region only matters (and is required) on
 * approval. An approval for somebody who already has an account (a member who
 * asked to lead a program while the request waited) adds the role to it; the
 * result says so, so the screen can tell the super admin what happened.
 */
export async function reviewStaffRequest(
  userId: string,
  decision: 'approved' | 'denied',
  regionId?: string,
): Promise<ReviewResult> {
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const { error } = await supabase.rpc('review_staff_request', {
      p_user_id: userId,
      p_decision: decision,
      ...(regionId ? { p_region_id: regionId } : {}),
    });
    if (error) return { ok: false, reason: failureOf(error.message ?? '') };
    if (decision === 'denied') return { ok: true, addedToExisting: false };
    // A super admin reads any account's roles: member and provider together means the role was added to an account that existed.
    const { data } = await supabase.from('profile_roles').select('role').eq('profile_id', userId);
    const roles = Array.isArray(data) ? data.map((r) => (r as { role?: string }).role) : [];
    return { ok: true, addedToExisting: roles.includes('member') && roles.includes('provider') };
  } catch {
    return { ok: false, reason: 'other' };
  }
}

/**
 * The number a requester signed up with, so the super admin can text them
 * from their own phone about how Pam will work (0072, D-262). Only while the
 * request is open, and every read is audited; null if there is none.
 */
export async function staffRequestPhone(userId: string): Promise<string | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('staff_request_phone', { p_user_id: userId });
    if (error || typeof data !== 'string' || !data) return null;
    return data;
  } catch {
    return null;
  }
}
