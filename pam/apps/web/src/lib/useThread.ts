'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Role } from '@pam/config';
import { requestLinkPreviews, wantsPreview } from './linkPreview';
import { useLiveTick } from './useLiveTick';
import { PAM_MARK } from './pam';
import { loadPhotos, removeUnsentPhoto, shrinkPhoto, uploadMessagePhoto } from './messagePhoto';
import {
  displayFileName,
  removeUnsentFile,
  uploadMessageFile,
  type MessageFile,
  type OutgoingAttachment,
} from './messageFile';
import { readAccountLimited } from './accountLimited';
import { codeFromError, reportAppError } from './reportAppError';

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
export type MessageStatus = 'sent' | 'sending' | 'failed';

export interface ThreadMessage {
  readonly id: string;
  /** Null for a message written by no person (Pam's welcome and out-of-hours reply: D-605). */
  readonly senderId: string | null;
  readonly body: string | null;
  /**
   * Where the message is: `sending` while it goes, `failed` if it did not (it stays in the conversation with a Try again, so
   * nothing is lost), `sent` once it is stored. Everything read from the database is `sent` (D-605, Will 18 October:
   * messaging "works better than any other part of the app").
   */
  readonly status: MessageStatus;
  /** Which sentence to draw for a message written by no person (`pam.welcome`, `pam.away`), or null. */
  readonly systemKey: string | null;
  /** What that sentence needs (when Pam is next here), or null. */
  readonly systemVars: Readonly<Record<string, unknown>> | null;
  /** The message's photo, as an on-phone link (D-394), or null. */
  readonly photoUrl: string | null;
  /** How much of its photo has gone (0 to 1) while it is uploading, or null. */
  readonly progress: number | null;
  /** The message's document (D-399), not yet downloaded, or null. */
  readonly file: MessageFile | null;
  /** Who wrote it when that is Pam herself for a message written by no person, as the Pam team reads it; else absent. */
  readonly author?: { readonly name: string; readonly photoUrl: string };
  readonly createdAt: string;
  readonly mine: boolean;
}

export type ThreadKind = 'direct' | 'mentor' | 'support';

export type ThreadState =
  | { status: 'loading' }
  | {
      status: 'ready';
      meId: string;
      otherName: string | null;
      otherRole: Role | null;
      /** The organisation's name when the other person is a program admin (0066, D-187). */
      otherProgramName: string | null;
      kind: ThreadKind;
      /** A person's conversation with Pam (D-605): the other side is Pam, with no profile behind it. */
      isPam: boolean;
      /** The Pam team reading a person's Pam conversation (D-605): not a member; every message not from the person is Pam's. */
      teamView: boolean;
      /** In a team view, the person who wrote to Pam. */
      askerId: string | null;
      messages: readonly ThreadMessage[];
    }
  | { status: 'not_found' }
  | { status: 'error'; offline: boolean };

interface MessageRow {
  id: string;
  sender_id: string | null;
  system_key?: string | null;
  system_vars?: Record<string, unknown> | null;
  body: string | null;
  attachment_url: string | null;
  attachment_kind: string | null;
  attachment_name: string | null;
  attachment_bytes: number | null;
  created_at: string;
}

// With the two columns a message written by no person needs (20261018071643, D-605). Until that is on the live project asking
// for them fails the read, so the read falls back to the columns before them, then before 0080.
const MESSAGE_COLUMNS_WITH_SYSTEM =
  'id, sender_id, system_key, system_vars, body, attachment_url, attachment_kind, attachment_name, attachment_bytes, created_at';
const MESSAGE_COLUMNS =
  'id, sender_id, body, attachment_url, attachment_kind, attachment_name, attachment_bytes, created_at';
// Until 0080 is on the live project (D-399), the two document columns do not
// exist and asking for them fails the whole read — every conversation would
// fail to open if this reached production first. The columns every
// conversation has had since 0005 still read it.
const MESSAGE_COLUMNS_BEFORE_0080 = 'id, sender_id, body, attachment_url, attachment_kind, created_at';

/** How long a message may go unanswered before it is "Not sent" (Iris P2). */
const SEND_DEADLINE_MS = 30_000;

const photoPathOf = (row: MessageRow) => (row.attachment_kind === 'photo' ? row.attachment_url : null);

const fileOf = (row: MessageRow): MessageFile | null =>
  row.attachment_kind === 'file' && row.attachment_url
    ? { path: row.attachment_url, name: displayFileName(row.attachment_name ?? ''), bytes: row.attachment_bytes ?? 0 }
    : null;

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** A message that has been written but is not yet stored: on its way, or failed and kept so it can be sent again. */
interface OutboxItem {
  readonly id: string;
  readonly body: string;
  readonly attachment: OutgoingAttachment | null;
  readonly createdAt: string;
  readonly startedAt: number;
  readonly status: 'sending' | 'failed';
  /** A photo being sent, shown from the phone while it goes. */
  readonly photoUrl: string | null;
  /** How much of a photo has gone (0 to 1) while it is uploading, or null. */
  readonly progress?: number | null;
}

const toMessage = (
  row: MessageRow,
  me: string,
  links: Record<string, string>,
  photoUrl?: string | null,
  askerId: string | null = null,
): ThreadMessage => ({
  id: row.id,
  senderId: row.sender_id,
  body: row.body,
  status: 'sent',
  systemKey: row.system_key ?? null,
  systemVars: row.system_vars ?? null,
  photoUrl: photoUrl !== undefined ? photoUrl : (links[photoPathOf(row) ?? ''] ?? null),
  progress: null,
  file: fileOf(row),
  // The team reading a Pam conversation sees the welcome and the out-of-hours reply as Pam's, with her mark and name, never as the person's
  // (Iris R1: the avatar showed the person's initial and a screen reader said their name).
  ...(askerId !== null && row.sender_id === null ? { author: { name: 'Pam', photoUrl: PAM_MARK } } : {}),
  createdAt: row.created_at,
  // Read by the Pam team, everything that is not the person's is Pam's (including the system's); otherwise mine is what I wrote.
  // A message written by no person (Pam's welcome, the out-of-hours reply) is Pam's, never "mine" for the team reading it either.
  mine: askerId !== null ? row.sender_id !== null && row.sender_id !== askerId : row.sender_id !== null && row.sender_id === me,
});

export function useThread(conversationId: string | null): {
  state: ThreadState;
  /**
   * Sends the words or an attachment. The message appears at once, `sending`; it becomes `sent`, or stays as `failed` with
   * its words or picture kept, to be sent again with `retry`. True once it has gone.
   */
  send: (body: string, attachment?: OutgoingAttachment | null) => Promise<boolean>;
  /** Sends a failed message again, once: if the first try had in fact gone through, that is the message, not a second one. */
  retry: (id: string) => Promise<boolean>;
  /** A message is on its way. */
  sending: boolean;
  /**
   * The last send was refused because this account is limited, not because
   * the connection dropped. The screen then says what is off and who to call
   * (terms.s.limits.p3, D-427) instead of leaving a message marked as not sent.
   */
  limited: boolean;
  /** The last send was refused for sending too many too fast; its words and attachment are given back. `n` counts them. */
  tooFast: { readonly n: number; readonly body: string; readonly attachment: OutgoingAttachment | null } | null;
  refresh: () => void;
} {
  const [loaded, setLoaded] = useState<ThreadState>({ status: 'loading' });
  const [outbox, setOutbox] = useState<readonly OutboxItem[]>([]);
  const [limited, setLimited] = useState(false);
  /** The last send was refused for sending too many too fast (Pam's limit): its words and picture, given back to the box. */
  const [tooFast, setTooFast] = useState<{ readonly n: number; readonly body: string; readonly attachment: OutgoingAttachment | null } | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  const seq = useRef(0);
  const sendingNow = useRef(new Set<string>());

  useEffect(() => {
    if (!conversationId) {
      setLoaded({ status: 'not_found' });
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
          setLoaded({ status: 'not_found' });
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
          setLoaded({ status: 'error', offline: !navigator.onLine });
          return;
        }

        const memberRows = (members ?? []) as {
          profile_id: string;
          conversations: { kind: ThreadKind } | { kind: ThreadKind }[] | null;
        }[];

        // RLS answers "am I a member" and "does this conversation exist" the
        // same way: zero rows. A genuine member always sees at least their own row.
        let mine = memberRows.find((row) => row.profile_id === me);
        let teamPartner: { askerId: string; name: string | null; role: Role | null; programName: string | null } | null = null;
        if (!mine) {
          // Not a member. The Pam team may read a person's Pam conversation (20261018072101): the one member it sees is the
          // person, and `pam_inbox()` says who. Anyone else sees no rows at all and lands on not_found below.
          const only = memberRows.length === 1 ? memberRows[0] : undefined;
          if (only && one(only.conversations)?.kind === 'support') {
            const { data: inbox } = await supabase.rpc('pam_inbox');
            const row = ((inbox ?? []) as { conversation_id: string; asker_id: string; first_name: string | null; role: Role; program_name: string | null }[]).find(
              (r) => r.conversation_id === conversationId,
            );
            if (row) {
              teamPartner = { askerId: row.asker_id, name: row.first_name, role: row.role, programName: row.program_name };
              mine = only;
            }
          }
          if (!teamPartner) {
            setLoaded({ status: 'not_found' });
            return;
          }
        }

        const partner =
          (
            (partners ?? []) as {
              conversation_id: string;
              first_name: string | null;
              role: Role | null;
              program_name: string | null;
            }[]
          ).find((row) => row.conversation_id === conversationId) ?? null;
        const conv = one(mine?.conversations ?? null);

        const read = (columns: string) =>
          supabase
            .from('messages')
            .select(columns)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(200);
        let { data: rows, error: messagesError } = await read(MESSAGE_COLUMNS_WITH_SYSTEM);
        if (messagesError) ({ data: rows, error: messagesError } = await read(MESSAGE_COLUMNS));
        if (messagesError) ({ data: rows, error: messagesError } = await read(MESSAGE_COLUMNS_BEFORE_0080));

        if (cancelled) return;
        if (messagesError) {
          setLoaded({ status: 'error', offline: !navigator.onLine });
          return;
        }
        const read200 = (rows ?? []) as unknown as MessageRow[];
        const links = await loadPhotos(read200.map(photoPathOf).filter((p): p is string => p !== null));
        if (cancelled) return;

        setLoaded({
          status: 'ready',
          meId: me,
          otherName: teamPartner ? teamPartner.name : (partner?.first_name ?? null),
          otherRole: teamPartner ? teamPartner.role : (partner?.role ?? null),
          otherProgramName: teamPartner ? teamPartner.programName : (partner?.program_name ?? null),
          kind: conv?.kind ?? 'direct',
          // A support conversation's other side is Pam: a partner row with no profile (20261018072339).
          isPam: conv?.kind === 'support',
          teamView: teamPartner !== null,
          askerId: teamPartner?.askerId ?? null,
          messages: read200.map((row) => toMessage(row, me, links, undefined, teamPartner?.askerId ?? null)),
        });

        // Fire-and-forget: this is housekeeping for the bell and the list's
        // "unread" flag on the *next* visit, not something this render waits on.
        if (!teamPartner) {
          void supabase
            .from('conversation_members')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('profile_id', me);
        }
      } catch {
        if (!cancelled) setLoaded({ status: 'error', offline: !navigator.onLine });
      }
    };

    setLoaded({ status: 'loading' });
    void load();
    return () => {
      cancelled = true;
    };
  }, [conversationId, nonce]);

  // What came in while it is open (Iris S1): ask for anything newer than the last message, every few seconds while the app is in front,
  // and at once when it comes back or the network does. By conversation and time only, never by words. Merged by id, so a message
  // that was just sent here, or that this very ask already brought, is never shown twice; nothing flashes back to loading.
  const { tick, settle } = useLiveTick(loaded.status === 'ready', 8_000);
  const loadedNow = useRef(loaded);
  loadedNow.current = loaded;
  useEffect(() => {
    const here = loadedNow.current;
    if (tick === 0 || !conversationId || here.status !== 'ready') return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const last = here.messages[here.messages.length - 1]?.createdAt;
        const ask = (columns: string) => {
          let query = supabase.from('messages').select(columns).eq('conversation_id', conversationId);
          if (last) query = query.gte('created_at', last);
          return query.order('created_at', { ascending: true }).limit(200);
        };
        let { data, error } = await ask(MESSAGE_COLUMNS_WITH_SYSTEM);
        if (error) ({ data, error } = await ask(MESSAGE_COLUMNS));
        if (error) {
          settle(false);
          return;
        }
        if (cancelled) return;
        const rows = (data ?? []) as unknown as MessageRow[];
        const now = loadedNow.current;
        if (now.status !== 'ready') {
          settle(true);
          return;
        }
        const known = new Set(now.messages.map((m) => m.id));
        const fresh = rows.filter((row) => !known.has(row.id));
        if (fresh.length === 0) {
          settle(true);
          return;
        }
        const links = await loadPhotos(fresh.map(photoPathOf).filter((p): p is string => p !== null));
        if (cancelled) return;
        const added = fresh.map((row) => toMessage(row, now.meId, links, undefined, now.askerId));
        setLoaded((prev) =>
          prev.status === 'ready'
            ? { ...prev, messages: [...prev.messages, ...added.filter((m) => !prev.messages.some((x) => x.id === m.id))] }
            : prev,
        );
        settle(true);
        // Read as it arrives, as when the conversation was opened (the Pam team's reading is not a member's).
        if (!now.teamView && added.some((m) => !m.mine)) {
          void supabase
            .from('conversation_members')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('profile_id', now.meId);
        }
      } catch {
        // Nothing on screen for a missed ask: the next one catches up, after a longer wait.
        settle(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick, conversationId, settle]);

  /** One try at storing a message. True once it is in; false (and kept, or dropped when the account is limited) if not. */
  const attempt = useCallback(
    async (item: OutboxItem): Promise<boolean> => {
      if (!conversationId || loaded.status !== 'ready') return false;
      const meId = loaded.meId;
      let stored: { path: string; kind: 'photo' | 'file' } | null = null;
      try {
        let shrunk: Blob | null = null;
        let named: { name: string; bytes: number } | null = null;
        const attachment = item.attachment;
        if (attachment?.kind === 'photo') {
          shrunk = attachment.isReady ? attachment.file : await shrinkPhoto(attachment.file);
          if (!shrunk) throw new Error('could not read the photo');
          const setProgress = (fraction: number) =>
            setOutbox((prev) => prev.map((o) => (o.id === item.id ? { ...o, progress: fraction } : o)));
          setProgress(0);
          const uploaded = await uploadMessagePhoto(conversationId, shrunk, setProgress);
          // The storage code stays with the failure (a 403 is not-allowed, a 401 signed-out), not just the words "upload failed".
          if (uploaded.path === null) throw Object.assign(new Error('upload failed'), { code: uploaded.code });
          stored = { path: uploaded.path, kind: 'photo' };
        } else if (attachment?.kind === 'file') {
          const uploaded = await uploadMessageFile(conversationId, attachment.file);
          if (uploaded.path === null) throw Object.assign(new Error('upload failed'), { code: uploaded.code });
          stored = { path: uploaded.path, kind: 'file' };
          named = { name: displayFileName(attachment.file.name), bytes: attachment.file.size };
        }
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        // No answer is not "Sending…" for ever (Iris P2): after 30 seconds it is given up on and shows "Not sent" with Try again. The
        // request may still have reached the database, which is what Try again's look before sending is for.
        const giveUp = new AbortController();
        const deadline = setTimeout(() => giveUp.abort(), SEND_DEADLINE_MS);
        const { data, error, status } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: meId,
            body: item.body || null,
            ...(stored ? { attachment_url: stored.path, attachment_kind: stored.kind } : {}),
            ...(named ? { attachment_name: named.name, attachment_bytes: named.bytes } : {}),
          })
          .select(MESSAGE_COLUMNS)
          .abortSignal(giveUp.signal)
          .single();
        clearTimeout(deadline);
        // The answer's HTTP status goes with the error, so a failure with no SQLSTATE is still named (Iris D2).
        if (error || !data) throw error ? Object.assign(error, { status }) : new Error('insert failed');
        stored = null;

        const row = data as MessageRow;
        // A link starts its preview now, so Stuff shared has it ready (D-407).
        if (wantsPreview(row.body)) void requestLinkPreviews([row.id]);
        // What was just picked is shown from the phone; the stored copy is what the other person's link reads.
        const message = toMessage(row, meId, {}, shrunk ? URL.createObjectURL(shrunk) : null, loaded.askerId);
        setLoaded((prev) => (prev.status === 'ready' ? { ...prev, messages: [...prev.messages, message] } : prev));
        setOutbox((prev) => prev.filter((o) => o.id !== item.id));
        return true;
      } catch (caught) {
        if (stored?.kind === 'photo') void removeUnsentPhoto(stored.path);
        if (stored?.kind === 'file') void removeUnsentFile(stored.path);
        // Sending too many, too fast (Pam's limit): not a message that failed, so no "Not sent" and no Try again that would be
        // refused again. It goes back to the box, and the screen says to wait a little.
        if (String((caught as { message?: unknown } | null)?.message ?? '').includes('PAM_RATE_LIMITED')) {
          setOutbox((prev) => prev.filter((o) => o.id !== item.id));
          setTooFast((prev) => ({ n: (prev?.n ?? 0) + 1, body: item.body, attachment: item.attachment }));
          return false;
        }
        // A refusal and a dropped connection look alike from here; only one
        // of them is the account's doing, and it deserves its own words.
        // (Not in a Pam conversation: a limited account can write to Pam, so a failed send there is only ever not sent.)
        if (!loaded.isPam && (await readAccountLimited())) {
          setLimited(true);
          setOutbox((prev) => prev.filter((o) => o.id !== item.id));
        } else {
          setOutbox((prev) => prev.map((o) => (o.id === item.id ? { ...o, status: 'failed' } : o)));
          // The team hears of a send that did not go (D-616): which kind and what code, never the message or the words.
          const uploading = /^(upload failed|could not read the photo)$/.test(String((caught as { message?: unknown } | null)?.message ?? ''));
          reportAppError({ action: uploading ? 'messages.photo' : 'messages.send', code: codeFromError(caught) });
        }
        return false;
      }
    },
    [conversationId, loaded],
  );

  const send = useCallback(
    async (body: string, attachment: OutgoingAttachment | null = null): Promise<boolean> => {
      const trimmed = body.trim();
      if ((!trimmed && !attachment) || !conversationId || loaded.status !== 'ready') return false;
      setLimited(false);
      const item: OutboxItem = {
        id: `pending-${++seq.current}`,
        body: trimmed,
        attachment,
        createdAt: new Date().toISOString(),
        startedAt: Date.now(),
        status: 'sending',
        photoUrl: attachment?.kind === 'photo' ? URL.createObjectURL(attachment.file) : null,
      };
      setOutbox((prev) => [...prev, item]);
      sendingNow.current.add(item.id);
      try {
        return await attempt(item);
      } finally {
        sendingNow.current.delete(item.id);
      }
    },
    [conversationId, loaded.status, attempt],
  );

  const retry = useCallback(
    async (id: string): Promise<boolean> => {
      const item = outbox.find((o) => o.id === id);
      if (!item || item.status !== 'failed' || sendingNow.current.has(id) || !conversationId || loaded.status !== 'ready') return false;
      sendingNow.current.add(id);
      setOutbox((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'sending' } : o)));
      try {
        // The first try may have gone through and only its answer been lost: look before sending a second one, so a tap on
        // Try again never makes a duplicate.
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        // Asked by who and when only: what a person typed never goes in a URL the logs keep (a66), so the words are compared here.
        const { data: recent, error: lookError, status: lookStatus } = await supabase
          .from('messages')
          .select(MESSAGE_COLUMNS)
          .eq('conversation_id', conversationId)
          .eq('sender_id', loaded.meId)
          .gte('created_at', new Date(item.startedAt - 5000).toISOString())
          .order('created_at', { ascending: false })
          .limit(20);
        // If the look itself failed, nobody knows whether the first try went through: sending again could make a second copy, so it stays Not sent.
        if (lookError) throw Object.assign(lookError, { status: lookStatus });
        const found = ((recent ?? []) as unknown as MessageRow[]).find(
          (row) =>
            (row.body ?? '') === item.body &&
            (item.attachment ? row.attachment_kind === item.attachment.kind : (row.attachment_kind ?? null) === null),
        );
        if (found) {
          const message = toMessage(found, loaded.meId, {}, item.photoUrl, loaded.askerId);
          setLoaded((prev) =>
            prev.status === 'ready' && !prev.messages.some((m) => m.id === message.id)
              ? { ...prev, messages: [...prev.messages, message] }
              : prev,
          );
          setOutbox((prev) => prev.filter((o) => o.id !== id));
          return true;
        }
        return await attempt(item);
      } catch (caught) {
        setOutbox((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'failed' } : o)));
        reportAppError({ action: 'messages.retry', code: codeFromError(caught) });
        return false;
      } finally {
        sendingNow.current.delete(id);
      }
    },
    [outbox, conversationId, loaded, attempt],
  );

  // What the screen reads: what is stored, then what is still on its way or did not go.
  const state = useMemo<ThreadState>(() => {
    if (loaded.status !== 'ready' || outbox.length === 0) return loaded;
    const waiting: ThreadMessage[] = outbox.map((o) => ({
      id: o.id,
      senderId: loaded.meId,
      body: o.body || null,
      status: o.status,
      systemKey: null,
      systemVars: null,
      photoUrl: o.photoUrl,
      progress: o.status === 'sending' && o.attachment?.kind === 'photo' ? (o.progress ?? null) : null,
      file: o.attachment?.kind === 'file'
        ? { path: '', name: displayFileName(o.attachment.file.name), bytes: o.attachment.file.size }
        : null,
      createdAt: o.createdAt,
      mine: true,
    }));
    return { ...loaded, messages: [...loaded.messages, ...waiting] };
  }, [loaded, outbox]);

  const sending = outbox.some((o) => o.status === 'sending');
  return { state, send, retry, sending, limited, tooFast, refresh };
}
