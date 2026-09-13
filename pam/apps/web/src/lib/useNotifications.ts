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
 */
export interface NotificationRow {
  id: string;
  kind: 'service_flagged' | 'service_removed' | 'message_reported';
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

export function useNotifications(enabled: boolean): {
  state: NotificationsState;
  markRead: (id: string) => Promise<void>;
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

  /**
   * Marking one read. Applied locally first so the list responds immediately on
   * a slow connection, then written; a failed write puts it back rather than
   * leaving somebody looking at a list that quietly disagrees with the database.
   */
  const markRead = useCallback(async (id: string) => {
    setState((current) =>
      current.status === 'ready'
        ? {
            status: 'ready',
            items: current.items.map((item) =>
              item.id === id ? { ...item, isRead: true } : item,
            ),
          }
        : current,
    );

    try {
      const { createClient } = await import('./supabase');
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch {
      setState((current) =>
        current.status === 'ready'
          ? {
              status: 'ready',
              items: current.items.map((item) =>
                item.id === id ? { ...item, isRead: false } : item,
              ),
            }
          : current,
      );
    }
  }, []);

  return { state, markRead, refresh };
}
