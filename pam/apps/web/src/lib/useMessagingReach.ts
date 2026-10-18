'use client';

import { useEffect, useState } from 'react';

/**
 * Whether the signed-in person has anyone to message or any conversation at all: the Messages tab is
 * shown only when they do (Will, 11 October 2026: "if no connections exist no need to show the tab").
 *
 * Two small reads: `messageable_people()` (the rule `open_direct_conversation` will actually honour,
 * 0063) and whether they are a member of any conversation. `null` while it is not known, which the
 * tab bar treats as "show it" so the bar does not jump for the people who have someone (most).
 *
 * One answer is shared by everything that asks (the tab bar, and Home's bell when the tab is hidden), so
 * the two reads happen once. It looks again whenever `recheck` changes (the bar passes the path), but only
 * while the answer is "nobody": a guide assigned or a program connection appears on the next screen, no
 * reload; once there is someone the answer stays until the page is reloaded and costs nothing more.
 */
let answer: boolean | null = null;
let inFlight = false;
const listeners = new Set<(value: boolean | null) => void>();

function publish(next: boolean | null): void {
  answer = next;
  for (const listener of listeners) listener(next);
}

async function ask(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const [people, mine] = await Promise.all([
      supabase.rpc('messageable_people'),
      supabase.from('conversation_members').select('conversation_id').eq('profile_id', auth.user.id).limit(1),
    ]);
    // A failed read says nothing: leave the tab as it is rather than hide it on a bad connection.
    if (people.error || mine.error) return;
    publish(((people.data ?? []) as unknown[]).length > 0 || ((mine.data ?? []) as unknown[]).length > 0);
  } catch {
    /* no answer: keep what we had */
  } finally {
    inFlight = false;
  }
}

export function useMessagingReach(enabled: boolean, recheck: string): boolean | null {
  const [reach, setReach] = useState<boolean | null>(answer);

  useEffect(() => {
    listeners.add(setReach);
    setReach(answer);
    return () => {
      listeners.delete(setReach);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Signed out (or another account next): forget the last person's answer.
      if (answer !== null) publish(null);
      return;
    }
    if (answer !== true) void ask();
  }, [enabled, recheck]);

  return reach;
}

/** Somebody now has a conversation (Pam's, made with its welcome): the Messages tab is shown (D-605). */
export function markHasConversation(): void {
  if (answer !== true) publish(true);
}
