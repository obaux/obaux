'use client';

import { useEffect, useState } from 'react';

/**
 * A demo-only "sent message", for the compose action on `/person/` (D-173).
 *
 * **This never touches `messages` or `conversations`.** Everything a real
 * send does — `openConversation`, an insert under RLS, a row only the real
 * participants can read — is untouched by this file and never called from
 * it. D-171 ("a super admin cannot send or start any real message") is a
 * guarantee about the real system and stays exactly as recorded; this is a
 * separate, client-only simulation layered on top; see D-173 for why the two
 * do not conflict.
 *
 * A case manager or program admin previewing `/person/` for a dummy member
 * can compose a line of text there. It is kept in `sessionStorage` — the
 * same mechanism `useViewAs` already uses for "which role am I previewing",
 * for the same reason: it should survive a "Viewing as" switch within this
 * tab so switching to Member and opening `/messages/` shows it having
 * "arrived", and it should be gone the next time PAM is opened, because nothing
 * here is real content that should outlive the session it was typed in.
 *
 * Keyed by the *sending role* (`admin` or `provider`), not by which dummy
 * person's page it was typed on: `/messages/`'s own member-preview has no
 * notion of "which member you are" — `DUMMY_CONVERSATIONS.member` is one
 * fixed example set, the same for every member preview — so there is no
 * specific dummy identity for a per-person message to attach to on that
 * side. One message per staff role is the most this composition can
 * honestly promise to "arrive" anywhere.
 */

const KEY = 'pam.demo-messages';

export interface DemoMessage {
  readonly text: string;
  readonly sentAt: string;
}

export type DemoSender = 'admin' | 'provider';

type DemoMessages = Partial<Record<DemoSender, DemoMessage>>;

function read(): DemoMessages {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoMessages) : {};
  } catch {
    return {};
  }
}

function write(messages: DemoMessages): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(messages));
  } catch {
    // Private mode, or storage turned off — the demo message just will not
    // carry over to a "viewing as" switch. Nothing real is lost either way.
  }
}

/** Records a demo-only message. Never calls Supabase, never touches `messages`/`conversations`. */
export function sendDemoMessage(from: DemoSender, text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  const messages = read();
  messages[from] = { text: trimmed, sentAt: new Date().toISOString() };
  write(messages);
}

/** The demo messages composed so far this session, read once on mount. */
export function useDemoMessages(): DemoMessages {
  const [messages, setMessages] = useState<DemoMessages>({});
  useEffect(() => {
    setMessages(read());
  }, []);
  return messages;
}

// ---------------------------------------------------------------------------
// Demo threads (D-180): what a preview typed into an example conversation on
// `/messages/thread/?id=dummy-conv-…`. Same store, same rules — this tab,
// this session, never Supabase.

const THREADS_KEY = 'pam.demo-threads';

export interface DemoThreadMessage {
  readonly id: string;
  readonly body: string;
  readonly at: string;
}

type DemoThreads = Record<string, DemoThreadMessage[]>;

function readThreads(): DemoThreads {
  try {
    const raw = sessionStorage.getItem(THREADS_KEY);
    return raw ? (JSON.parse(raw) as DemoThreads) : {};
  } catch {
    return {};
  }
}

/** Appends a demo-only message to an example conversation. Never touches `messages`. */
export function sendDemoThreadMessage(conversationId: string, text: string): DemoThreadMessage | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const threads = readThreads();
  const message = { id: `demo-${Date.now()}`, body: trimmed, at: new Date().toISOString() };
  threads[conversationId] = [...(threads[conversationId] ?? []), message];
  try {
    sessionStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  } catch {
    // Not persisting is survivable; the message still shows until the screen changes.
  }
  return message;
}

/** The demo-only messages typed into one example conversation this session. */
export function useDemoThread(conversationId: string | null): readonly DemoThreadMessage[] {
  const [messages, setMessages] = useState<readonly DemoThreadMessage[]>([]);
  useEffect(() => {
    if (!conversationId) return;
    setMessages(readThreads()[conversationId] ?? []);
  }, [conversationId]);
  return messages;
}
