'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Role } from '@pam/config';

/**
 * One conversation: who is in it, and what has been said.
 *
 * Membership is confirmed with its own query rather than assumed from the URL
 * — `id=` is a plain query string a member could type or a stale link could
 * carry, and `in_conversation()` is what actually decides whether the rows
 * behind it are readable at all. A conversation that does not exist and one
 * this account is not a member of look identical under RLS (zero rows either
 * way), so both land on `not_found` rather than one of them silently reading
 * as "no messages yet".
 *
 * Opening a thread marks it read — `conversation_members.last_read_at` — the
 * same "the screen itself is the acknowledgement" pattern `useNotifications`
 * uses, not a per-message action.
 *
 * The other participant's name comes from `conversation_partners()` (0055), a
 * function returning only `first_name` and `role` — never a raw `profiles`
 * select. See `useConversations` for why: a row policy that hands back a
 * whole `profiles` row hands back `last_active_at` and `phone` along with the
 * name, and D-154 closed exactly that hole.
 */
export interface ThreadMessage {
  readonly id: string;
  readonly senderId: string;
  readonly body: string | null;
  readonly createdAt: string;
  readonly mine: boolean;
}

export type ThreadState =
  | { status: 'loading' }
  | {
      status: 'ready';
      meId: string;
      otherName: string | null;
      otherRole: Role | null;
      /** The organisation's name when the other person is a program admin (0066, D-187). */
      otherProgramName: string | null;
      kind: 'direct' | 'mentor';
      messages: readonly ThreadMessage[];
    }
  | { status: 'not_found' }
  | { status: 'error'; offline: boolean };

interface MessageRow {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
}

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function useThread(conversationId: string | null): {
  state: ThreadState;
  send: (body: string) => Promise<boolean>;
  sending: boolean;
  sendFailed: boolean;
  refresh: () => void;
} {
  const [state, setState] = useState<ThreadState>({ status: 'loading' });
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!conversationId) {
      setState({ status: 'not_found' });
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!auth.user) {
          setState({ status: 'not_found' });
          return;
        }
        const me = auth.user.id;

        const [{ data: members, error: membersError }, { data: partners, error: partnersError }] =
          await Promise.all([
            supabase
              .from('conversation_members')
              .select('profile_id, conversations(kind)')
              .eq('conversation_id', conversationId),
            supabase.rpc('conversation_partners'),
          ]);

        if (cancelled) return;
        if (membersError || partnersError) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        const memberRows = (members ?? []) as {
          profile_id: string;
          conversations: { kind: 'direct' | 'mentor' } | { kind: 'direct' | 'mentor' }[] | null;
        }[];

        // RLS answers "am I a member" and "does this conversation exist" the
        // same way: zero rows. A genuine member always sees at least their own row.
        const mine = memberRows.find((row) => row.profile_id === me);
        if (!mine) {
          setState({ status: 'not_found' });
          return;
        }

        const partner =
          (
            (partners ?? []) as {
              conversation_id: string;
              first_name: string | null;
              role: Role;
              program_name: string | null;
            }[]
          ).find((row) => row.conversation_id === conversationId) ?? null;
        const conv = one(mine.conversations);

        const { data: rows, error: messagesError } = await supabase
          .from('messages')
          .select('id, sender_id, body, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(200);

        if (cancelled) return;
        if (messagesError) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        setState({
          status: 'ready',
          meId: me,
          otherName: partner?.first_name ?? null,
          otherRole: partner?.role ?? null,
          otherProgramName: partner?.program_name ?? null,
          kind: conv?.kind ?? 'direct',
          messages: ((rows ?? []) as MessageRow[]).map((row) => ({
            id: row.id,
            senderId: row.sender_id,
            body: row.body,
            createdAt: row.created_at,
            mine: row.sender_id === me,
          })),
        });

        // Fire-and-forget: this is housekeeping for the bell and the list's
        // "unread" flag on the *next* visit, not something this render waits on.
        void supabase
          .from('conversation_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('profile_id', me);
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    };

    setState({ status: 'loading' });
    void load();
    return () => {
      cancelled = true;
    };
  }, [conversationId, nonce]);

  const send = useCallback(
    async (body: string): Promise<boolean> => {
      const trimmed = body.trim();
      if (!trimmed || !conversationId || state.status !== 'ready') return false;

      setSending(true);
      setSendFailed(false);
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('messages')
          .insert({ conversation_id: conversationId, sender_id: state.meId, body: trimmed })
          .select('id, sender_id, body, created_at')
          .single();
        if (error || !data) throw error ?? new Error('insert failed');

        const row = data as MessageRow;
        setState((prev) =>
          prev.status === 'ready'
            ? {
                ...prev,
                messages: [
                  ...prev.messages,
                  {
                    id: row.id,
                    senderId: row.sender_id,
                    body: row.body,
                    createdAt: row.created_at,
                    mine: true,
                  },
                ],
              }
            : prev,
        );
        return true;
      } catch {
        setSendFailed(true);
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId, state],
  );

  return { state, send, sending, sendFailed, refresh };
}
