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
  lastActiveAt: string | null;
  points: number | null;
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

        if (cancelled) return;
        setState({
          status: 'ready',
          members: rows.map((row, i) => ({
            id: row.id,
            firstName: row.first_name,
            accessStatus: row.access_status,
            lastActiveAt: row.last_active_at,
            points: balances[i] ?? null,
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
  role: 'member' | 'provider';
}

/**
 * Makes an invite code.
 *
 * The code is the product here, not a side effect: an admin reads it down the
 * phone or writes it on a card. That is why the alphabet has no 0/O, 1/I/L,
 * 2/Z, 5/S or 8/B in it — every character survives being said out loud.
 */
export async function createInvite(role: 'member' | 'provider'): Promise<CreatedInvite | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('create_invite', { p_role: role });
    if (error || !data) return null;

    const invite = (Array.isArray(data) ? data[0] : data) as {
      code: string;
      expires_at: string;
      role: 'member' | 'provider';
    };
    return { code: invite.code, expiresAt: invite.expires_at, role: invite.role };
  } catch {
    return null;
  }
}
