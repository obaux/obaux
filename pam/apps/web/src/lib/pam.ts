'use client';

import { useEffect, useState } from 'react';

/**
 * Message Pam: the hooks and calls the screens use (D-605, D-606). The database is `20261018071550` to `20261018073016`;
 * the plan is `docs/design/plans/2026-10-18-message-pam-slices.md`. Everything here is behind the switch
 * (`app_settings.pam_messaging_live`, read through `pam_status()`): off, nothing is created and nothing is shown.
 *
 * Two sides. Anyone signed in can ask `usePamStatus()` whether Pam messaging is on and when Pam is here, and
 * `openPamConversation()` for their own one Pam conversation (made with Pam's welcome the first time; null when it is off, and
 * for the Pam team, who are Pam). The Pam team (a super admin) also has the inbox, close and reopen, starting a conversation,
 * the hours, and how long people wait. Each of those refuses anyone else in the database (`ONLY_A_SUPER_ADMIN`); a screen
 * gates on the role as well, so the call is not made at all.
 */

export interface PamStatus {
  /** Whether messaging Pam is switched on. Off or unreadable: show nothing. */
  readonly live: boolean;
  readonly hoursTz: string;
  /** ISO weekdays, 1 is Monday. */
  readonly hoursDays: readonly number[];
  /** 24-hour local times, 'HH:MM:SS'. */
  readonly hoursOpen: string;
  readonly hoursClose: string;
  readonly openNow: boolean;
  /** When Pam next opens (null while it is open). */
  readonly nextOpen: string | null;
}

export type PamStatusState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly pam: PamStatus }
  | { readonly status: 'off' };

/** A missing, unreadable or failed answer is "off", never an error: a conversation with Pam that cannot be shown is not shown. */
export function usePamStatus(enabled: boolean): PamStatusState {
  const [state, setState] = useState<PamStatusState>({ status: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('pam_status');
        if (cancelled) return;
        const row = (Array.isArray(data) ? data[0] : data) as
          | { live: boolean; hours_tz: string; hours_days: number[]; hours_open: string; hours_close: string; open_now: boolean; next_open: string | null }
          | undefined;
        if (error || !row || !row.live) {
          setState({ status: 'off' });
          return;
        }
        setState({
          status: 'ready',
          pam: {
            live: true,
            hoursTz: row.hours_tz,
            hoursDays: row.hours_days,
            hoursOpen: row.hours_open,
            hoursClose: row.hours_close,
            openNow: row.open_now,
            nextOpen: row.next_open,
          },
        });
      } catch {
        if (!cancelled) setState({ status: 'off' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return state;
}

/** The caller's one Pam conversation id, made with Pam's welcome the first time; null when it is off or for the Pam team. */
export async function openPamConversation(): Promise<string | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('open_pam_conversation');
    return error || typeof data !== 'string' ? null : data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The Pam team.

export interface PamInboxRow {
  readonly conversationId: string;
  readonly askerId: string;
  readonly firstName: string | null;
  readonly role: 'member' | 'admin' | 'provider' | 'super_admin';
  readonly regionName: string | null;
  /** For a program lead, the program's name. */
  readonly programName: string | null;
  readonly status: 'open' | 'closed';
  readonly lastMessageAt: string | null;
  /** Who wrote last; null when only Pam's welcome is there. */
  readonly lastFrom: 'asker' | 'team' | 'system' | null;
  /** When the person's oldest message since the team last wrote was sent; null when nobody is waiting. */
  readonly waitingSince: string | null;
  /** The first line of the last message the person or the team wrote (never a system message). */
  readonly preview: string | null;
}

export type PamInboxState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly rows: readonly PamInboxRow[] }
  | { readonly status: 'error'; readonly offline: boolean };

interface InboxWire {
  conversation_id: string;
  asker_id: string;
  first_name: string | null;
  role: PamInboxRow['role'];
  region_name: string | null;
  program_name: string | null;
  status: 'open' | 'closed';
  last_message_at: string | null;
  last_from: PamInboxRow['lastFrom'];
  waiting_since: string | null;
  preview: string | null;
}

/** The Pam team's inbox. `refreshKey` changes to read it again (after a reply, a close or a start). */
export function usePamInbox(enabled: boolean, refreshKey = 0): PamInboxState {
  const [state, setState] = useState<PamInboxState>({ status: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('pam_inbox');
        if (cancelled) return;
        if (error || !Array.isArray(data)) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        setState({
          status: 'ready',
          rows: (data as InboxWire[]).map((r) => ({
            conversationId: r.conversation_id,
            askerId: r.asker_id,
            firstName: r.first_name,
            role: r.role,
            regionName: r.region_name,
            programName: r.program_name,
            status: r.status,
            lastMessageAt: r.last_message_at,
            lastFrom: r.last_from,
            waitingSince: r.waiting_since,
            preview: r.preview,
          })),
        });
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, refreshKey]);
  return state;
}

/** The three groups the inbox shows (Ava): waiting for Pam longest first, then answered, then closed. */
export function groupInbox(rows: readonly PamInboxRow[]): {
  readonly waiting: readonly PamInboxRow[];
  readonly answered: readonly PamInboxRow[];
  readonly closed: readonly PamInboxRow[];
} {
  const open = rows.filter((r) => r.status === 'open');
  return {
    waiting: open
      .filter((r) => r.waitingSince !== null)
      .sort((a, b) => Date.parse(a.waitingSince as string) - Date.parse(b.waitingSince as string)),
    answered: open
      .filter((r) => r.waitingSince === null)
      .sort((a, b) => Date.parse(b.lastMessageAt ?? '') - Date.parse(a.lastMessageAt ?? '')),
    closed: rows
      .filter((r) => r.status === 'closed')
      .sort((a, b) => Date.parse(b.lastMessageAt ?? '') - Date.parse(a.lastMessageAt ?? '')),
  };
}

/** The error codes the Pam functions raise, so a screen can say the right plain thing. */
export type PamError =
  | 'ONLY_A_SUPER_ADMIN'
  | 'PAM_OFF'
  | 'INVALID_MESSAGE'
  | 'NOT_FOUND'
  | 'NOT_ALLOWED'
  | 'PAM_NO_ACTIVE_LEAD'
  | 'INVALID_STATUS'
  | 'INVALID_TIME_ZONE'
  | 'INVALID_DAYS'
  | 'INVALID_HOURS'
  | 'PAM_RATE_LIMITED'
  | 'OTHER';

const CODES: readonly PamError[] = [
  'ONLY_A_SUPER_ADMIN', 'PAM_OFF', 'INVALID_MESSAGE', 'NOT_FOUND', 'NOT_ALLOWED', 'PAM_NO_ACTIVE_LEAD',
  'INVALID_STATUS', 'INVALID_TIME_ZONE', 'INVALID_DAYS', 'INVALID_HOURS', 'PAM_RATE_LIMITED',
];

export function pamErrorFrom(message: string | undefined): PamError {
  return CODES.find((code) => message?.includes(code)) ?? 'OTHER';
}

export type PamResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: PamError };

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<PamResult<T>> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc(fn, args);
    if (error) return { ok: false, error: pamErrorFrom(error.message) };
    return { ok: true, value: data as T };
  } catch {
    return { ok: false, error: 'OTHER' };
  }
}

/** Close or reopen a Pam conversation. */
export const setPamThreadStatus = (conversationId: string, status: 'open' | 'closed') =>
  call<null>('pam_set_thread_status', { p_conversation: conversationId, p_status: status });

/** Pam writes first to one person (a member, a case manager or a program lead). Returns the conversation id. */
export const startPamConversation = (profileId: string, body: string) =>
  call<string>('pam_start_conversation', { p_profile: profileId, p_body: body });

/** Pam writes the same text to each active lead of a program, each in their own conversation. Returns how many. PAM_NO_ACTIVE_LEAD if none. */
export const startPamProgramConversation = (serviceId: string, body: string) =>
  call<number>('pam_start_program_conversation', { p_service: serviceId, p_body: body });

/** Save when Pam is here: a time zone, ISO weekdays, an opening and a closing time ('HH:MM'). */
export const setPamHours = (tz: string, days: readonly number[], open: string, close: string) =>
  call<null>('pam_set_hours', { p_tz: tz, p_days: [...days], p_open: open, p_close: close });

export interface PamReplyTimes {
  readonly medianSeconds: number;
  readonly meanSeconds: number;
  readonly answered: number;
}

/** How long people wait for a first reply, over the stretches that began in the last N days (null: none answered yet). */
export async function pamReplyTimes(days = 30): Promise<PamResult<PamReplyTimes | null>> {
  const result = await call<{ median_seconds: number | null; mean_seconds: number | null; answered: number }[]>('pam_reply_times', { p_days: days });
  if (!result.ok) return result;
  const row = result.value?.[0];
  if (!row || !row.answered || row.median_seconds === null || row.mean_seconds === null) return { ok: true, value: null };
  return { ok: true, value: { medianSeconds: Number(row.median_seconds), meanSeconds: Number(row.mean_seconds), answered: row.answered } };
}
