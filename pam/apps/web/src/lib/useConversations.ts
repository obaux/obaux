'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Role } from '@pam/config';

/**
 * The conversations a member is actually part of (§4.1/A1).
 *
 * Messaging in PAM is staff-to-member: a case manager with a member on their
 * caseload, or a program admin with a member enrolled in their program — never
 * member-to-member. This hook itself does not know or care which side of that
 * a signed-in account is on; it just reads every conversation the caller is a
 * `conversation_members` row in, member or staff alike, and RLS
 * (`conversations_select_member`, `messages_select_conversation_member`) never
 * lets it see one it is not part of. Who is *allowed to start* a new one lives
 * in `useMessageableMembers`, not here.
 *
 * **`conversations.last_message_at` is never written by anything** — no
 * trigger in `packages/db/migrations` sets it, so every row reads `null`.
 * Recency and the unread flag are derived here from `messages` directly
 * instead (D-149). This costs one extra query and does not scale to a
 * conversation with thousands of messages, which is the right trade for a
 * product with none yet; a maintenance trigger that keeps the column current
 * is the honest fix and is flagged, not silently worked around forever.
 *
 * The other participant's name and role come from `conversation_partners()`
 * (0055), a function, not a table read — it returns exactly two columns,
 * `first_name` and `role`, for whoever shares a conversation with the caller.
 * Earlier this queried `profiles` directly through a row policy that handed
 * back the *whole* row (D-154): `last_active_at`, `phone`, everything. Never
 * widen this back to a raw `profiles` select for convenience — the column
 * list is the privacy boundary, not the query shape.
 */
export interface ConversationRow {
  readonly id: string;
  readonly otherProfileId: string | null;
  readonly otherName: string | null;
  readonly otherRole: Role | null;
  readonly lastMessageAt: string | null;
  /**
   * The last thing said, for the row's one-line preview (D-179). Read from
   * the same `messages` select the recency scan already does — a
   * participant's own read, under `messages_select_conversation_member`;
   * no new policy, and nothing an admin who is not in the conversation can
   * reach through this hook either.
   */
  readonly lastMessageBody: string | null;
  readonly lastMessageMine: boolean;
  /** A message from the other person arrived since this was last opened. */
  readonly unread: boolean;
}

export type ConversationsState =
  | { status: 'loading' }
  | { status: 'ready'; conversations: readonly ConversationRow[] }
  | { status: 'empty' }
  | { status: 'error'; offline: boolean };

interface MemberRow {
  conversation_id: string;
  last_read_at: string | null;
}

interface PartnerRow {
  conversation_id: string;
  profile_id: string;
  first_name: string | null;
  role: Role;
}

interface LatestMessageRow {
  conversation_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
}

/** How many of the most recent messages, across every conversation, to scan for recency. */
const RECENCY_SCAN_LIMIT = 500;

export function useConversations(enabled: boolean): {
  state: ConversationsState;
  refresh: () => void;
} {
  const [state, setState] = useState<ConversationsState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!auth.user) {
          setState({ status: 'empty' });
          return;
        }
        const me = auth.user.id;

        const { data: mine, error } = await supabase
          .from('conversation_members')
          .select('conversation_id, last_read_at')
          .eq('profile_id', me);

        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        const rows = (mine ?? []) as MemberRow[];
        if (rows.length === 0) {
          setState({ status: 'empty' });
          return;
        }

        const ids = rows.map((r) => r.conversation_id);

        const [{ data: partners, error: partnersError }, { data: latest, error: latestError }] =
          await Promise.all([
            supabase.rpc('conversation_partners'),
            supabase
              .from('messages')
              .select('conversation_id, sender_id, body, created_at')
              .in('conversation_id', ids)
              .order('created_at', { ascending: false })
              .limit(RECENCY_SCAN_LIMIT),
          ]);

        if (cancelled) return;
        if (partnersError || latestError) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        const otherByConversation = new Map<
          string,
          { id: string; name: string | null; role: Role | null }
        >();
        for (const row of (partners ?? []) as PartnerRow[]) {
          otherByConversation.set(row.conversation_id, {
            id: row.profile_id,
            name: row.first_name,
            role: row.role,
          });
        }

        // `latest` is sorted newest-first across every conversation, so the
        // first row seen for a given id is that conversation's latest message.
        const latestByConversation = new Map<string, LatestMessageRow>();
        for (const row of (latest ?? []) as LatestMessageRow[]) {
          if (!latestByConversation.has(row.conversation_id)) {
            latestByConversation.set(row.conversation_id, row);
          }
        }

        const conversations: ConversationRow[] = rows
          .map((row) => {
            const other = otherByConversation.get(row.conversation_id) ?? null;
            const latestMsg = latestByConversation.get(row.conversation_id) ?? null;
            const unread = Boolean(
              latestMsg &&
                latestMsg.sender_id !== me &&
                (!row.last_read_at || latestMsg.created_at > row.last_read_at),
            );

            return {
              id: row.conversation_id,
              otherProfileId: other?.id ?? null,
              otherName: other?.name ?? null,
              otherRole: other?.role ?? null,
              lastMessageAt: latestMsg?.created_at ?? null,
              lastMessageBody: latestMsg?.body ?? null,
              lastMessageMine: latestMsg ? latestMsg.sender_id === me : false,
              unread,
            };
          })
          .sort((a, b) => {
            if (!a.lastMessageAt && !b.lastMessageAt) return 0;
            if (!a.lastMessageAt) return 1;
            if (!b.lastMessageAt) return -1;
            return b.lastMessageAt.localeCompare(a.lastMessageAt);
          });

        setState({ status: 'ready', conversations });
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
