'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Role } from '@pam/config';
import { requestLinkPreviews, wantsPreview } from './linkPreview';
import { loadPhotos, removeUnsentPhoto, shrinkPhoto, uploadMessagePhoto } from './messagePhoto';
import {
  displayFileName,
  removeUnsentFile,
  uploadMessageFile,
  type MessageFile,
  type OutgoingAttachment,
} from './messageFile';

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
 *
 * A message may carry a photo (D-394, 0079): stored privately, it is
 * downloaded with the messages and shown from the phone's memory. Sending one shrinks it on
 * the phone, stores it, then inserts the message that points at it; if the
 * message does not go in, the stored photo is taken back.
 *
 * Or a document (D-399, 0080): stored the same way in its own bucket, and the
 * message carries its name and size. It is not downloaded with the messages —
 * the conversation shows its name and size, and it is fetched when tapped.
 */
export interface ThreadMessage {
  readonly id: string;
  readonly senderId: string;
  readonly body: string | null;
  /** The message's photo, as an on-phone link (D-394), or null. */
  readonly photoUrl: string | null;
  /** The message's document (D-399), not yet downloaded, or null. */
  readonly file: MessageFile | null;
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
  attachment_url: string | null;
  attachment_kind: string | null;
  attachment_name: string | null;
  attachment_bytes: number | null;
  created_at: string;
}

const MESSAGE_COLUMNS =
  'id, sender_id, body, attachment_url, attachment_kind, attachment_name, attachment_bytes, created_at';
// Until 0080 is on the live project (D-399), the two document columns do not
// exist and asking for them fails the whole read — every conversation would
// fail to open if this reached production first. The columns every
// conversation has had since 0005 still read it.
const MESSAGE_COLUMNS_BEFORE_0080 = 'id, sender_id, body, attachment_url, attachment_kind, created_at';

const photoPathOf = (row: MessageRow) => (row.attachment_kind === 'photo' ? row.attachment_url : null);

const fileOf = (row: MessageRow): MessageFile | null =>
  row.attachment_kind === 'file' && row.attachment_url
    ? { path: row.attachment_url, name: displayFileName(row.attachment_name ?? ''), bytes: row.attachment_bytes ?? 0 }
    : null;

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function useThread(conversationId: string | null): {
  state: ThreadState;
  send: (body: string, attachment?: OutgoingAttachment | null) => Promise<boolean>;
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

        const read = (columns: string) =>
          supabase
            .from('messages')
            .select(columns)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(200);
        let { data: rows, error: messagesError } = await read(MESSAGE_COLUMNS);
        if (messagesError) ({ data: rows, error: messagesError } = await read(MESSAGE_COLUMNS_BEFORE_0080));

        if (cancelled) return;
        if (messagesError) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        const loaded = (rows ?? []) as unknown as MessageRow[];
        const links = await loadPhotos(loaded.map(photoPathOf).filter((p): p is string => p !== null));
        if (cancelled) return;

        setState({
          status: 'ready',
          meId: me,
          otherName: partner?.first_name ?? null,
          otherRole: partner?.role ?? null,
          otherProgramName: partner?.program_name ?? null,
          kind: conv?.kind ?? 'direct',
          messages: loaded.map((row) => ({
            id: row.id,
            senderId: row.sender_id,
            body: row.body,
            photoUrl: links[photoPathOf(row) ?? ''] ?? null,
            file: fileOf(row),
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
    async (body: string, attachment: OutgoingAttachment | null = null): Promise<boolean> => {
      const trimmed = body.trim();
      if ((!trimmed && !attachment) || !conversationId || state.status !== 'ready') return false;

      setSending(true);
      setSendFailed(false);
      let stored: { path: string; kind: 'photo' | 'file' } | null = null;
      try {
        let shrunk: Blob | null = null;
        let named: { name: string; bytes: number } | null = null;
        if (attachment?.kind === 'photo') {
          shrunk = attachment.isReady ? attachment.file : await shrinkPhoto(attachment.file);
          if (!shrunk) throw new Error('could not read the photo');
          const path = await uploadMessagePhoto(conversationId, shrunk);
          if (!path) throw new Error('upload failed');
          stored = { path, kind: 'photo' };
        } else if (attachment?.kind === 'file') {
          const path = await uploadMessageFile(conversationId, attachment.file);
          if (!path) throw new Error('upload failed');
          stored = { path, kind: 'file' };
          named = { name: displayFileName(attachment.file.name), bytes: attachment.file.size };
        }
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: state.meId,
            body: trimmed || null,
            ...(stored ? { attachment_url: stored.path, attachment_kind: stored.kind } : {}),
            ...(named ? { attachment_name: named.name, attachment_bytes: named.bytes } : {}),
          })
          .select(MESSAGE_COLUMNS)
          .single();
        if (error || !data) throw error ?? new Error('insert failed');
        stored = null;

        const row = data as MessageRow;
        // A link starts its preview now, so Stuff shared has it ready (D-407).
        if (wantsPreview(row.body)) void requestLinkPreviews([row.id]);
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
                    // What was just picked, shown from the phone; the stored
                    // copy is what the other person's link reads.
                    photoUrl: shrunk ? URL.createObjectURL(shrunk) : null,
                    file: fileOf(row),
                    createdAt: row.created_at,
                    mine: true,
                  },
                ],
              }
            : prev,
        );
        return true;
      } catch {
        if (stored?.kind === 'photo') void removeUnsentPhoto(stored.path);
        if (stored?.kind === 'file') void removeUnsentFile(stored.path);
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
