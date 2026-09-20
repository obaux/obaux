'use client';

import { useEffect } from 'react';
import { useConversations } from '@/lib/useConversations';

/**
 * How many conversations hold something unread — reported upward, drawn by
 * nobody here (D-182).
 *
 * A headless component rather than a hook called from Home, for §12's sake:
 * `useConversations` is the conversation list's own machinery (two queries,
 * a recency scan), and a hook cannot be lazy-loaded — but a component can.
 * Home renders the Messages tile immediately with no count, this loads
 * behind it through `UnreadMessagesLazy`, and the count arrives when it
 * arrives. Same reasoning as `HeaderBell`'s dynamic import of the example
 * notifications: Home is what the budget is measured on.
 *
 * Real data, real role: the caller gates `enabled` on `trueRole`, never on
 * a preview (D-172), so a super admin previewing "Member" sees the tile and
 * never a number — their account has nothing to count (D-171).
 */
export function UnreadMessages({
  enabled,
  onCount,
}: {
  readonly enabled: boolean;
  readonly onCount: (count: number) => void;
}) {
  const { state } = useConversations(enabled);
  const count = state.status === 'ready' ? state.conversations.filter((c) => c.unread).length : 0;
  useEffect(() => {
    onCount(count);
  }, [count, onCount]);
  return null;
}
