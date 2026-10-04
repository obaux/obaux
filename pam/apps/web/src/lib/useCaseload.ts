'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The people an admin is responsible for.
 *
 * The query asks for everyone and the database returns the caseload: the access
 * rules narrow it to this admin's assigned members and their own region, and a
 * member in another region comes back as nothing rather than as an error. That
 * is the §4.1 promise, and it is enforced one layer below this file.
 *
 * The columns here are exactly the §4.1 list in @pam/config/transparency, which
 * is the contract members are shown at onboarding. Adding one to this select
 * without adding it there — and telling members first — is a breach, not a
 * feature.
 */
export interface CaseloadMember {
  id: string;
  firstName: string | null;
  accessStatus: 'active' | 'limited' | 'suspended';
  /**
   * The features an admin has switched off for this person, by name.
   *
   * "Limited" on its own tells a case manager nothing they can act on — off
   * how, and since when? These are the actual rows behind that status, so the
   * list can say "Messages off" instead.
   */
  featuresOff: string[];
  lastActiveAt: string | null;
  points: number | null;
  /**
   * The program this member is genuinely connected to, if any — a real
   * `enrollments` row (`status` in `enrolled`/`active`, never `interested`,
   * `requested` or `dropped`), never inferred from being in the same region
   * as this admin. `admin_covers()` has two arms — a real caseload
   * assignment, or just sharing this admin's region — and a shared region on
   * its own is not a program connection worth naming; see D-175. `null` when
   * there is none, or when the member has more than one and this is simply
   * the most recently updated.
   */
  program: { name: string; serviceId: string } | null;
}

export type CaseloadState =
  | { status: 'loading' }
  | { status: 'ready'; members: CaseloadMember[] }
  | { status: 'empty' }
  | { status: 'error'; offline: boolean };

export function useCaseload(enabled: boolean): { state: CaseloadState; refresh: () => void } {
  const [state, setState] = useState<CaseloadState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();

        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, access_status, last_active_at')
          .eq('role', 'member')
          .order('last_active_at', { ascending: false, nullsFirst: false });

        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        const rows = (data ?? []) as {
          id: string;
          first_name: string | null;
          access_status: CaseloadMember['accessStatus'];
          last_active_at: string | null;
        }[];

        if (rows.length === 0) {
          setState({ status: 'empty' });
          return;
        }

        // What has been switched off, for everyone on the list at once. These
        // are the admin's own actions on the member, not facts about the
        // member — the affected person is shown their own version of this.
        const { data: controls } = await supabase
          .from('access_controls')
          .select('subject_id, feature')
          .eq('allowed', false)
          .in('subject_id', rows.map((r) => r.id));

        const offByMember = new Map<string, string[]>();
        for (const row of (controls ?? []) as { subject_id: string; feature: string }[]) {
          offByMember.set(row.subject_id, [...(offByMember.get(row.subject_id) ?? []), row.feature]);
        }

        // Points come from a function rather than a column, because the ledger
        // is append-only and the balance is its sum. One call per member is
        // fine at caseload size and wrong at city size; when it stops being
        // fine, it becomes one call that takes a list.
        const balances = await Promise.all(
          rows.map(async (row) => {
            const { data: points } = await supabase.rpc('member_points', { p_member_id: row.id });
            return typeof points === 'number' ? points : null;
          }),
        );

        /*
         * Which program each caseload member is actually enrolled in, for the
         * program badge (D-175). `enrollments` (RLS: `enrollments_select_admin`,
         * `admin_covers(member_id)` — the same function that already scoped
         * `rows` above) joined to `services`, which this admin can always read
         * (`services_select_admin`). Only a genuine, current connection counts
         * — `enrolled`/`active` — never `interested`, `requested` or `dropped`,
         * and never inferred from a region-only match. A member with more than
         * one live enrollment gets the most recently updated; one badge per row.
         */
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('member_id, updated_at, services(id, name)')
          .in('member_id', rows.map((r) => r.id))
          .in('status', ['enrolled', 'active'])
          .order('updated_at', { ascending: false });

        const programByMember = new Map<string, { name: string; serviceId: string }>();
        for (const row of (enrollments ?? []) as {
          member_id: string;
          services: { id: string; name: string }[] | { id: string; name: string } | null;
        }[]) {
          if (programByMember.has(row.member_id)) continue;
          const service = Array.isArray(row.services) ? row.services[0] : row.services;
          if (!service) continue;
          programByMember.set(row.member_id, { name: service.name, serviceId: service.id });
        }

        if (cancelled) return;
        setState({
          status: 'ready',
          members: rows.map((row, i) => ({
            id: row.id,
            firstName: row.first_name,
            accessStatus: row.access_status,
            featuresOff: offByMember.get(row.id) ?? [],
            lastActiveAt: row.last_active_at,
            points: balances[i] ?? null,
            program: programByMember.get(row.id) ?? null,
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

export interface CreatedInvite {
  code: string;
  expiresAt: string;
  role: 'member' | 'provider' | 'admin';
}

/**
 * Makes an invite code.
 *
 * The code is the product here, not a side effect: an admin reads it down the
 * phone or writes it on a card. That is why the alphabet has no 0/O, 1/I/L,
 * 2/Z, 5/S or 8/B in it — every character survives being said out loud.
 */
export async function createInvite(
  role: 'member' | 'provider' | 'admin',
  /** Which city, when the caller has none of their own — a super admin (0049). */
  regionId?: string,
): Promise<CreatedInvite | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('create_invite', {
      p_role: role,
      ...(regionId ? { p_region_id: regionId } : {}),
    });
    if (error || !data) return null;

    const invite = (Array.isArray(data) ? data[0] : data) as {
      code: string;
      expires_at: string;
      role: 'member' | 'provider' | 'admin';
    };
    return { code: invite.code, expiresAt: invite.expires_at, role: invite.role };
  } catch {
    return null;
  }
}

/** The cities PAM serves, with ids, for somebody allowed to see them. */
export async function listRegions(): Promise<{ id: string; name: string }[]> {
  try {
    const { createClient } = await import('./supabase');
    const { data } = await createClient().from('regions').select('id, name').order('name');
    return (data ?? []) as { id: string; name: string }[];
  } catch {
    return [];
  }
}
