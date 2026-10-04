'use client';

import { useCallback, useEffect, useState } from 'react';
import type { InviteRole } from './appUrl';

/**
 * Expired invite links (0071, D-258).
 *
 * Signed out: `previewInvite` says who sent a link, what for, and whether it
 * still works; `requestInviteRenewal` asks for it to be renewed. Super admin:
 * the open requests, and Renew or Deny. Renewing gives the same link 14 more
 * days, so nothing new has to be sent.
 */
export type InviteState = 'valid' | 'expired' | 'used' | 'not_found';

export interface InvitePreview {
  readonly inviterFirstName: string | null;
  readonly role: InviteRole | null;
  readonly state: InviteState;
}

export async function previewInvite(code: string): Promise<InvitePreview | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('invite_preview', { p_code: code });
    if (error || !data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as {
      inviter_first_name: string | null;
      invited_role: string | null;
      state: InviteState;
    };
    const role = row.invited_role === 'admin' || row.invited_role === 'provider' || row.invited_role === 'member'
      ? row.invited_role
      : null;
    return { inviterFirstName: row.inviter_first_name, role, state: row.state };
  } catch {
    return null;
  }
}

export async function requestInviteRenewal(code: string, firstName: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('request_invite_renewal', {
      p_code: code,
      ...(firstName.trim() ? { p_first_name: firstName.trim() } : {}),
    });
    return !error;
  } catch {
    return false;
  }
}

export interface InviteRenewal {
  readonly id: string;
  readonly role: InviteRole;
  readonly phone: string | null;
  readonly name: string | null;
  readonly inviterFirst: string | null;
  readonly inviterLast: string | null;
  readonly inviterRole: string;
  readonly expiredAt: string;
  readonly requestedAt: string;
}

export type InviteRenewalsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; renewals: readonly InviteRenewal[] };

export function useInviteRenewals(enabled: boolean): { state: InviteRenewalsState; refresh: () => void } {
  const [state, setState] = useState<InviteRenewalsState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('invite_renewals_pending');
        if (cancelled) return;
        if (error) {
          setState({ status: 'error' });
          return;
        }
        const rows = (data ?? []) as {
          id: string;
          invited_role: InviteRole;
          invited_phone: string | null;
          invited_name: string | null;
          inviter_first: string | null;
          inviter_last: string | null;
          inviter_role: string;
          expired_at: string;
          requested_at: string;
        }[];
        setState({
          status: 'ready',
          renewals: rows.map((r) => ({
            id: r.id,
            role: r.invited_role,
            phone: r.invited_phone,
            name: r.invited_name,
            inviterFirst: r.inviter_first,
            inviterLast: r.inviter_last,
            inviterRole: r.inviter_role,
            expiredAt: r.expired_at,
            requestedAt: r.requested_at,
          })),
        });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, nonce]);

  return { state, refresh };
}

export async function decideInviteRenewal(id: string, decision: 'approved' | 'denied'): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('decide_invite_renewal', { p_id: id, p_decision: decision });
    return !error;
  } catch {
    return false;
  }
}
