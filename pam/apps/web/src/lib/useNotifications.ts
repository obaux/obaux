'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * What has happened that this person has to act on.
 *
 * The query asks for everything and the database returns only this person's
 * own rows — the access rules on `notifications` are `recipient_id = auth.uid()`
 * and nothing else, so one admin cannot read another's list even by accident.
 * The routing that decides who gets a row at all lives in the triggers (A7 /
 * D-080), not here.
 *
 * A row carries a locale key and its variables, never a sentence and never
 * anybody's words. The key is translated at render time, which means a reworded
 * notice reaches rows that were written before the rewording.
 *
 * `read_at` used to be a per-row task — a "Mark as read" button on every line.
 * It is now purely "has this person opened the list since this arrived"
 * (Will, 16 September): nobody marks anything, the notifications screen marks
 * everything the moment it opens (`markAllSeen`), and `isRead` survives only as
 * the bell's dot and the list's own "New" label — both read-only.
 */
export interface NotificationRow {
  id: string;
  kind:
    | 'service_flagged'
    | 'service_removed'
    | 'message_reported'
    | 'staff_request_pending'
    | 'message_received';
  bodyKey: string;
  bodyVars: Record<string, string>;
  subjectType: string | null;
  subjectId: string | null;
  createdAt: string;
  isRead: boolean;
}

export type NotificationsState =
  | { status: 'loading' }
  | { status: 'ready'; items: NotificationRow[] }
  | { status: 'error' };

/** Newest first, and capped: a list nobody can reach the bottom of is a list. */
const LIMIT = 30;

export function unreadCount(state: NotificationsState): number {
  return state.status === 'ready' ? state.items.filter((item) => !item.isRead).length : 0;
}

export function useNotifications(enabled: boolean): {
  state: NotificationsState;
  /**
   * Everything currently unread, in one write. Called once, by the
   * notifications screen itself, the moment its list is on screen — never by
   * a tap, because reading a log is not a task somebody completes one line at
   * a time (see the file comment). Does not touch `state`: the list stays
   * exactly as it looked when it opened, "New" labels and all, and only the
   * *next* visit — and the bell before it — sees the cleared count.
   */
  markAllSeen: () => Promise<void>;
  refresh: () => void;
} {
  const [state, setState] = useState<NotificationsState>({ status: 'loading' });
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
          .from('notifications')
          .select('id, kind, body_key, body_vars, subject_type, subject_id, created_at, read_at')
          .order('created_at', { ascending: false })
          .limit(LIMIT);

        if (cancelled) return;
        if (error) {
          setState({ status: 'error' });
          return;
        }

        const rows = (data ?? []) as {
          id: string;
          kind: NotificationRow['kind'];
          body_key: string;
          body_vars: Record<string, string> | null;
          subject_type: string | null;
          subject_id: string | null;
          created_at: string;
          read_at: string | null;
        }[];

        setState({
          status: 'ready',
          items: rows.map((row) => ({
            id: row.id,
            kind: row.kind,
            bodyKey: row.body_key,
            bodyVars: row.body_vars ?? {},
            subjectType: row.subject_type,
            subjectId: row.subject_id,
            createdAt: row.created_at,
            isRead: row.read_at !== null,
          })),
        });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    };

    setState({ status: 'loading' });
    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, nonce]);

  const markAllSeen = useCallback(async () => {
    try {
      const { createClient } = await import('./supabase');
      const supabase = createClient();
      // RLS restricts this to the signed-in person's own rows regardless
      // (`recipient_id = auth.uid()`), so the `is` filter is what keeps the
      // write cheap, not what keeps it safe.
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);
      if (error) throw error;
    } catch {
      // Silent on purpose: this is housekeeping for the *next* visit, not
      // something this one is waiting on. Worst case, the bell stays lit one
      // visit longer than it needed to.
    }
  }, []);

  return { state, markAllSeen, refresh };
}
