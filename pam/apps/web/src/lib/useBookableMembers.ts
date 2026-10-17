'use client';

import { useEffect, useState } from 'react';

/** A member a program lead may book a visit for (D-595): first name only, which a program already sees. */
export interface BookableMember {
  readonly id: string;
  readonly firstName: string;
}

/**
 * The members this program may book for: wrote to it, signed up with it or planned a visit there. A lead reads no enrollment or
 * visit row, so the database answers (`my_program_bookable_members`). Empty while it loads or if it cannot be read: the list of
 * people who wrote is still there.
 */
export function useBookableMembers(enabled: boolean): readonly BookableMember[] {
  const [members, setMembers] = useState<readonly BookableMember[]>([]);
  useEffect(() => {
    if (!enabled) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('my_program_bookable_members');
        if (cancelled) return;
        setMembers(
          error ? [] : ((data ?? []) as { member_id: string; first_name: string | null }[]).map((r) => ({ id: r.member_id, firstName: r.first_name ?? '' })),
        );
      } catch {
        if (!cancelled) setMembers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return members;
}
