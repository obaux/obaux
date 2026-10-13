'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Moving an account to a new phone number (D-567). Everything goes through the database's functions
 * (migration 20261013192951): nobody signed in can read the requests table itself.
 *
 * The person who asks is signed in with the new number only (a "temporary sign-in": no profile, and
 * none is ever made for it). They send the old number and a few facts, and are told the same thing
 * whatever they typed. The super admin decides (for now: a case manager seeing these would widen
 * transparency.ts, which needs Will's signature first); on a yes, `move-number` moves the account's sign-in.
 */

export type NumberChangeStatus = 'waiting' | 'approved' | 'denied';

/** The request this sign-in made, if any: its status and nothing about the account. */
export async function myNumberChange(): Promise<NumberChangeStatus | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('my_number_change');
    if (error) return null;
    const row = (data as { status: NumberChangeStatus }[] | null)?.[0];
    return row?.status ?? null;
  } catch {
    return null;
  }
}

export interface NumberChangeAsk {
  readonly oldPhone: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly city: string;
  readonly whoKnows: string;
}

/** What can go wrong when asking. "received" is the one answer to every honest request. */
export type AskFailure = 'invalid' | 'waiting' | 'tooMany' | 'hasAccount' | 'other';

export async function submitNumberChange(ask: NumberChangeAsk): Promise<{ ok: true } | { ok: false; reason: AskFailure }> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('submit_number_change', {
      p_old_phone: ask.oldPhone,
      p_first_name: ask.firstName,
      p_last_name: ask.lastName,
      p_city: ask.city,
      p_who_knows: ask.whoKnows,
    });
    if (!error) return { ok: true };
    const message = error.message ?? '';
    if (message.includes('INVALID')) return { ok: false, reason: 'invalid' };
    if (message.includes('ALREADY_WAITING')) return { ok: false, reason: 'waiting' };
    if (message.includes('TOO_MANY')) return { ok: false, reason: 'tooMany' };
    if (message.includes('HAS_ACCOUNT')) return { ok: false, reason: 'hasAccount' };
    return { ok: false, reason: 'other' };
  } catch {
    return { ok: false, reason: 'other' };
  }
}

/** One row in the super admin's list. */
export interface NumberChangeRow {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly city: string;
  readonly createdAt: string;
  readonly isProtected: boolean;
}

export type NumberChangeList =
  | { status: 'loading' }
  | { status: 'ready'; rows: readonly NumberChangeRow[] }
  | { status: 'error' };

/** The requests the super admin decides, for Requests (the super admin decides every one for now). */
export function useNumberChangesToDecide(enabled: boolean): { state: NumberChangeList; refresh: () => void } {
  const [state, setState] = useState<NumberChangeList>({ status: 'loading' });
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('number_changes_to_decide');
        if (cancelled) return;
        if (error) {
          setState({ status: 'error' });
          return;
        }
        const rows = ((data ?? []) as {
          id: string;
          first_name: string;
          last_name: string;
          city: string;
          created_at: string;
          is_protected: boolean;
        }[]).map((r) => ({
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          city: r.city,
          createdAt: r.created_at,
          isProtected: r.is_protected,
        }));
        setState({ status: 'ready', rows });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  return { state, refresh };
}

/** One request beside the account it would move, for the person deciding. */
export interface NumberChangeDetail {
  readonly id: string;
  readonly status: NumberChangeStatus;
  readonly createdAt: string;
  readonly typed: { readonly firstName: string; readonly lastName: string; readonly city: string; readonly whoKnows: string };
  readonly newPhone: string;
  readonly oldPhoneLast4: string;
  readonly hasAccount: boolean;
  readonly isProtected: boolean;
  readonly isStaff: boolean;
  readonly account: {
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly city: string | null;
    readonly invitedBy: string | null;
    readonly lastActiveAt: string | null;
  };
  /** Approve needs the tick "I spoke to this person" (card a84). */
  readonly mustSpeak: boolean;
}

export async function numberChangeDetail(id: string): Promise<NumberChangeDetail | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('number_change_detail', { p_id: id });
    if (error) return null;
    const r = (data as Record<string, unknown>[] | null)?.[0];
    if (!r) return null;
    const s = (key: string) => (r[key] as string | null) ?? null;
    return {
      id: String(r['id']),
      status: r['status'] as NumberChangeStatus,
      createdAt: String(r['created_at']),
      typed: {
        firstName: s('first_name') ?? '',
        lastName: s('last_name') ?? '',
        city: s('city') ?? '',
        whoKnows: s('who_knows') ?? '',
      },
      newPhone: s('new_phone') ?? '',
      oldPhoneLast4: s('old_phone_last4') ?? '',
      hasAccount: Boolean(r['has_account']),
      isProtected: Boolean(r['is_protected']),
      isStaff: Boolean(r['is_staff']),
      account: {
        firstName: s('account_first'),
        lastName: s('account_last'),
        city: s('account_city'),
        invitedBy: s('invited_by_name'),
        lastActiveAt: s('last_active_at'),
      },
      mustSpeak: Boolean(r['must_speak']),
    };
  } catch {
    return null;
  }
}

export type DecideFailure = 'decided' | 'mustSpeak' | 'cannotMove' | 'noAccount' | 'numberInUse' | 'other';

export async function decideNumberChange(
  id: string,
  decision: 'approved' | 'denied',
  spoke: boolean,
): Promise<{ ok: true } | { ok: false; reason: DecideFailure }> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('decide_number_change', { p_id: id, p_decision: decision, p_spoke: spoke });
    if (!error) return { ok: true };
    const m = error.message ?? '';
    if (m.includes('REQUEST_ALREADY_DECIDED') || m.includes('REQUEST_NOT_FOUND')) return { ok: false, reason: 'decided' };
    if (m.includes('MUST_SPEAK')) return { ok: false, reason: 'mustSpeak' };
    if (m.includes('CANNOT_MOVE')) return { ok: false, reason: 'cannotMove' };
    if (m.includes('NO_ACCOUNT')) return { ok: false, reason: 'noAccount' };
    if (m.includes('NEW_NUMBER_IN_USE')) return { ok: false, reason: 'numberInUse' };
    return { ok: false, reason: 'other' };
  } catch {
    return { ok: false, reason: 'other' };
  }
}

/** After a yes: the sign-in moves (the `move-number` Edge Function). Safe to call again if it failed. */
export async function moveNumber(id: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().functions.invoke('move-number', { body: { requestId: id } });
    return !error;
  } catch {
    return false;
  }
}
