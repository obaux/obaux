'use client';

import { useCallback, useEffect, useState } from 'react';
import type { InviteRole } from './appUrl';

/**
 * Invite links after they are made (0071; D-258, reworked by D-263).
 *
 * Signed out: `previewInvite` says who sent a link, what for, and whether it
 * still works; `requestInviteLink` asks for a fresh one by email — no
 * approval, and the new code goes only to the inbox. Super admin:
 * `useInvitesLog`, every invite and where it stands.
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

/** Looks like an email address — the database checks the same shape. */
export function isEmailAddress(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

export async function requestInviteLink(code: string, email: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('request_invite_link', { p_code: code, p_email: email.trim() });
    return !error;
  } catch {
    return false;
  }
}

/** Where an invite stands: somebody joined with it, it is still open, or it ran out. */
export type InviteLogState = 'joined' | 'open' | 'expired';

export interface InviteLogRow {
  readonly id: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly role: InviteRole;
  readonly inviterFirst: string | null;
  readonly inviterLast: string | null;
  readonly inviterRole: string;
  readonly state: InviteLogState;
  readonly joinedFirst: string | null;
  /** A fresh link sent after an expired one, and the address it went to. */
  readonly emailedTo: string | null;
  readonly reissued: boolean;
}

export type InvitesLogState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; invites: readonly InviteLogRow[] };

export function useInvitesLog(enabled: boolean): { state: InvitesLogState; refresh: () => void } {
  const [state, setState] = useState<InvitesLogState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('invites_log');
        if (cancelled) return;
        if (error) {
          setState({ status: 'error' });
          return;
        }
        const rows = (data ?? []) as {
          id: string;
          created_at: string;
          expires_at: string;
          invited_role: InviteRole;
          inviter_first: string | null;
          inviter_last: string | null;
          inviter_role: string;
          state: InviteLogState;
          joined_first: string | null;
          emailed_to: string | null;
          reissued: boolean;
        }[];
        setState({
          status: 'ready',
          invites: rows.map((r) => ({
            id: r.id,
            createdAt: r.created_at,
            expiresAt: r.expires_at,
            role: r.invited_role,
            inviterFirst: r.inviter_first,
            inviterLast: r.inviter_last,
            inviterRole: r.inviter_role,
            state: r.state,
            joinedFirst: r.joined_first,
            emailedTo: r.emailed_to,
            reissued: r.reissued,
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
