'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Blocking, from inside a conversation (0076, D-206; the control is D-463).
 *
 * `conversation_block_state()` says, for a conversation the caller is in,
 * whether they blocked the other person and whether the other person blocked
 * them — and the blocker's row itself is never shown to the other side. A block
 * made here is undone by the same person from the same place (0076): the other
 * person is somebody's case manager or program, and a mistaken tap should not
 * cut a member off for good. What a block does is the database's (0076): neither
 * side can send in any shared conversation or open a new one; everything said
 * before stays readable and reportable.
 */
export interface BlockState {
  /** I blocked them: I can undo it. */
  readonly iBlocked: boolean;
  /** They blocked me: I can still read and report, and cannot send. */
  readonly blockedMe: boolean;
}

export const NOT_BLOCKED: BlockState = { iBlocked: false, blockedMe: false };

export async function getBlockState(conversationId: string): Promise<BlockState | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('conversation_block_state', { p_conversation: conversationId });
    if (error) return null;
    const row = (Array.isArray(data) ? data[0] : data) as { i_blocked?: boolean; blocked_me?: boolean } | undefined;
    // No row at all means "not a conversation of yours": nothing is blocked here.
    return row ? { iBlocked: Boolean(row.i_blocked), blockedMe: Boolean(row.blocked_me) } : NOT_BLOCKED;
  } catch {
    return null;
  }
}

async function call(name: 'block_in_conversation' | 'unblock_in_conversation', conversationId: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc(name, { p_conversation: conversationId });
    return !error;
  } catch {
    return false;
  }
}

/** Blocks the other person in this conversation. False when refused or offline: the screen says so, never silently. */
export const blockInConversation = (conversationId: string) => call('block_in_conversation', conversationId);

/** Lifts the caller's own block, and nobody else's. */
export const unblockInConversation = (conversationId: string) => call('unblock_in_conversation', conversationId);

/**
 * Where a real conversation stands on blocking. `null` while it is loading or
 * could not be read (the screen then behaves as if nothing is blocked: the
 * database refuses the send either way, and the composer says so if it does).
 */
export function useBlockState(conversationId: string | null): {
  readonly state: BlockState | null;
  readonly reload: () => Promise<void>;
} {
  const [state, setState] = useState<BlockState | null>(null);
  const reload = useCallback(async () => {
    if (!conversationId) {
      setState(null);
      return;
    }
    setState(await getBlockState(conversationId));
  }, [conversationId]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!conversationId) return;
      const next = await getBlockState(conversationId);
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);
  return { state, reload };
}
