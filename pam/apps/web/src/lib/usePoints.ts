'use client';

import { useEffect, useState } from 'react';

/**
 * A member's points balance.
 *
 * One call to `member_points`, which is the ledger's sum and guards itself: it
 * answers for the caller and for a case manager's own caseload, and returns
 * null to anybody else (0010). Nothing here decides who may see a balance.
 *
 * `null` while it is unknown, and `null` if the call fails — deliberately the
 * same. A points badge is the least important thing on the home screen, and a
 * failure notice about one would be the most alarming thing on it. If we cannot
 * say the number, we say nothing.
 */
export function usePoints(memberId: string | null): number | null {
  return usePointsState(memberId).points;
}

/**
 * The same, and whether the answer is still on its way. A screen that draws a pulse in the number's place
 * (Profile's hero card, D-518's skeletons) needs to tell "not here yet" from "could not be had": a pulse that
 * never ends on a failed call is worse than the 0 it replaced, so `loading` ends either way.
 */
export function usePointsState(memberId: string | null): { points: number | null; loading: boolean } {
  const [points, setPoints] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;

    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('member_points', {
          p_member_id: memberId,
        });
        if (cancelled) return;
        if (!error) setPoints(typeof data === 'number' ? data : null);
      } catch {
        // Stays null. See above.
      }
      if (!cancelled) setDone(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return { points, loading: memberId !== null && !done };
}
