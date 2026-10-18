'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLiveTick } from './useLiveTick';
import type { Role } from '@pam/config';

/**
 * The conversations a member is actually part of (§4.1/A1).
 *
 * Messaging in Pam is staff-to-member: a case manager with a member on their
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
  /** The organisation's name when the other person is a program admin (0066, D-187). */
  readonly otherProgramName: string | null;
  readonly lastMessageAt: string | null;
  /**
   * The last thing said, for the row's one-line preview (D-179). Read from
   * the same `messages` select the recency scan already does — a
   * participant's own read, under `messages_select_conversation_member`;
   * no new policy, and nothing an admin who is not in the conversation can
   * reach through this hook either.
   */
  readonly lastMessageBody: string | null;
  /** What the last message carried (D-394, D-399); with no words, the row says "Photo" or "Document". */
  readonly lastMessageAttachment: 'photo' | 'file' | null;
  readonly lastMessageMine: boolean;
  /** Pam's side of a conversation (D-605): the other participant has no profile; the row says "Pam". */
  readonly isPam: boolean;
  /** The last message was written by no person (Pam's welcome or out-of-hours reply): which sentence to draw. */
  readonly lastMessageSystemKey: string | null;
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
  /** Null for Pam's side of a conversation: it has no profile behind it (20261018072339). */
  profile_id: string | null;
  first_name: string | null;
  role: Role | null;
  program_name: string | null;
}

interface LatestMessageRow {
  conversation_id: string;
  sender_id: string | null;
  system_key?: string | null;
  body: string | null;
  attachment_kind: string | null;
  created_at: string;
}

/** How many of the most recent messages, across every conversation, to scan for recency. */
const RECENCY_SCAN_LIMIT = 500;

const attachmentOf = (kind: string | null | undefined): 'photo' | 'file' | null =>
  kind === 'photo' || kind === 'file' ? kind : null;

/** The latest messages, with the key a system message carries; before that column is live, without it (D-605). */
async function readLatest(ids: readonly string[]) {
  const { createClient } = await import('./supabase');
  const supabase = createClient();
  const read = (columns: string) =>
    supabase.from('messages').select(columns).in('conversation_id', ids as string[]).order('created_at', { ascending: false }).limit(RECENCY_SCAN_LIMIT);
  const withKey = await read('conversation_id, sender_id, system_key, body, attachment_kind, created_at');
  return withKey.error ? read('conversation_id, sender_id, body, attachment_kind, created_at') : withKey;
}

export function useConversations(enabled: boolean): {
  state: ConversationsState;
  refresh: () => void;
} {
  const [state, setState] = useState<ConversationsState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  // Looks again every 20 seconds while the app is in front, and when it comes back (Iris S1): a reply that came in shows without a visit.
  const { tick, settle } = useLiveTick(enabled, 20_000);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let failed = false;
    // A failed look says nothing on screen when there is already a list (the next one catches up); the ticker backs off.
    const fail = () => {
      failed = true;
      setState((prev) => (prev.status === 'ready' ? prev : { status: 'error', offline: !navigator.onLine }));
    };

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
          fail();
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
            readLatest(ids),
          ]);

        if (cancelled) return;
        if (partnersError || latestError) {
          fail();
          return;
        }

        const otherByConversation = new Map<
          string,
          { id: string | null; name: string | null; role: Role | null; programName: string | null }
        >();
        for (const row of (partners ?? []) as PartnerRow[]) {
          otherByConversation.set(row.conversation_id, {
            id: row.profile_id,
            name: row.first_name,
            role: row.role,
            programName: row.program_name ?? null,
          });
        }

        // `latest` is sorted newest-first across every conversation, so the
        // first row seen for a given id is that conversation's latest message.
        const latestByConversation = new Map<string, LatestMessageRow>();
        for (const row of (latest ?? []) as unknown as LatestMessageRow[]) {
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
              isPam: other !== null && other.id === null,
              lastMessageSystemKey: latestMsg?.system_key ?? null,
              otherName: other?.name ?? null,
              otherRole: other?.role ?? null,
              otherProgramName: other?.programName ?? null,
              lastMessageAt: latestMsg?.created_at ?? null,
              lastMessageBody: latestMsg?.body ?? null,
              lastMessageAttachment: attachmentOf(latestMsg?.attachment_kind),
              lastMessageMine: latestMsg ? latestMsg.sender_id !== null && latestMsg.sender_id === me : false,
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
        if (!cancelled) fail();
      }
    };

    // Quietly when there is already a list on screen: no flash back to loading.
    setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }));
    void load().then(() => {
      if (!cancelled) settle(!failed);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, nonce, tick, settle]);

  return { state, refresh };
}
