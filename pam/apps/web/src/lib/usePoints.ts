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
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;

    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('member_points', {
          p_member_id: memberId,
        });
        if (cancelled || error) return;
        setPoints(typeof data === 'number' ? data : null);
      } catch {
        // Stays null. See above.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return points;
}
