'use client';

import { useEffect, useState } from 'react';

/**
 * Demo-only messages typed into an example conversation (D-180, D-183).
 *
 * **This never touches `messages` or `conversations`.** Everything a real
 * send does — `open_direct_conversation()`, an insert under RLS — is
 * untouched by this file and never called from it. D-171 ("a super admin
 * cannot send or start any real message") is a guarantee about the real
 * system and stays exactly as recorded; this is a client-only simulation
 * layered on top, the same category of thing `DUMMY_MEMBERS` is.
 *
 * Kept in `sessionStorage`, the same mechanism `useViewAs` uses for "which
 * role am I previewing", for the same reason: it should survive a "Viewing
 * as" switch within this tab and be gone the next time PAM is opened —
 * nothing here is real content that should outlive the session it was typed
 * in. Keyed by example conversation id (`dummy-conv-<member>-<staff>`), so
 * what a case manager preview types to Jordan is what a member preview of
 * Jordan then reads — the two sides of one example, not two stores.
 *
 * D-173's earlier shape — one message per sending role, composed on
 * `/person/` — is gone: the compose box moved into the example thread
 * itself (D-183), so there is one place to demo-send and it is the chat.
 */

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
