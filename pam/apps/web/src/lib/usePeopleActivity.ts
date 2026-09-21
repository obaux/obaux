'use client';

import { useEffect, useState } from 'react';

/**
 * When each person on the caller's list last saved a place — `people_activity()`
 * (0067, D-199). A map of profile id to an ISO time, and nothing else: the
 * function's two columns are the whole privacy boundary, the same way
 * `conversation_partners()`'s are. Never widen this to a `saved_places` read;
 * the table's only policy is the member's own, and that stays.
 *
 * Fails quiet: a ring is a hint, not a screen. If this cannot load, the
 * strip shows with no save rings rather than an error in the middle of Home.
 */
export type PeopleActivityState =
  | { status: 'loading' }
  | { status: 'ready'; lastSavedAt: ReadonlyMap<string, string> };

export function usePeopleActivity(enabled: boolean): PeopleActivityState {
  const [state, setState] = useState<PeopleActivityState>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      const map = new Map<string, string>();
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('people_activity');
        if (cancelled) return;
        if (!error) {
          for (const row of (data ?? []) as { profile_id: string; last_saved_at: string | null }[]) {
            if (row.last_saved_at) map.set(row.profile_id, row.last_saved_at);
          }
        }
      } catch {
        // Quiet by design — see the file comment.
      }
      if (!cancelled) setState({ status: 'ready', lastSavedAt: map });
    };

    setState({ status: 'loading' });
    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
