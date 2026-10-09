'use client';

import { useCallback, useEffect, useState } from 'react';
import type { InviteRole } from './appUrl';
import { rpcWithLanguage } from './rpcLanguage';

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

/**
 * The invite waiting for the number just verified (0077, D-373): somebody who
 * signs in without the link still finds what they were invited to. Only ever
 * the caller's own number. `hasAccount` — the number already has an account,
 * so a staff invite needs another number for now (D-373).
 */
export interface PendingInvite {
  readonly code: string;
  readonly role: InviteRole;
  readonly firstName: string | null;
  readonly inviterFirstName: string | null;
  readonly hasAccount: boolean;
  /** This account can add the invite's role: a member, a program invite, the same city (0078). */
  readonly canAdd: boolean;
}

export async function pendingInviteForMe(): Promise<PendingInvite | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('pending_invite_for_me');
    if (error || !data) return null;
    const row = (Array.isArray(data) ? data[0] : data) as
      | {
          code: string;
          invited_role: string;
          first_name: string | null;
          inviter_first_name: string | null;
          has_account: boolean;
          can_add?: boolean;
        }
      | undefined;
    if (!row?.code) return null;
    const role: InviteRole = row.invited_role === 'admin' || row.invited_role === 'provider' ? row.invited_role : 'member';
    return {
      code: row.code,
      role,
      firstName: row.first_name,
      inviterFirstName: row.inviter_first_name,
      hasAccount: row.has_account === true,
      canAdd: row.can_add === true,
    };
  } catch {
    return null;
  }
}

/** Looks like an email address — the database checks the same shape. */
export function isEmailAddress(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

/**
 * Asks for a fresh link by email. `language` is the one the person is reading
 * this page in (0085): the email is written in it, since there is no account to
 * read a language from.
 */
export async function requestInviteLink(code: string, email: string, language = 'en'): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await rpcWithLanguage(
      createClient(),
      'request_invite_link',
      { p_code: code, p_email: email.trim() },
      language,
    );
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
