'use client';

import { useEffect, useState } from 'react';

/** A member a program lead may book a visit for (D-595): first name only, which a program already sees. */
export interface BookableMember {
  readonly id: string;
  readonly firstName: string;
}

export interface BookableMembers {
  readonly members: readonly BookableMember[];
  /** Still asking. */
  readonly isLoading: boolean;
  /** The database could not be read: an empty list then does not mean nobody can be booked for. */
  readonly hasFailed: boolean;
}

/**
 * The members this program may book for: wrote to it, signed up with it or planned a visit there, and nobody blocked either way. A lead
 * reads no enrollment or visit row, so the database answers (`my_program_bookable_members`). This is the whole list: a conversation
 * partner who is not in it is not offered, because booking for them would be refused (D-595).
 */
export function useBookableMembers(enabled: boolean): BookableMembers {
  const [state, setState] = useState<BookableMembers>({ members: [], isLoading: enabled, hasFailed: false });
  useEffect(() => {
    if (!enabled) {
      setState({ members: [], isLoading: false, hasFailed: false });
      return;
    }
    let cancelled = false;
    setState((was) => ({ ...was, isLoading: true, hasFailed: false }));
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('my_program_bookable_members');
        if (cancelled) return;
        if (error) {
          setState({ members: [], isLoading: false, hasFailed: true });
          return;
        }
        const rows = (data ?? []) as { member_id: string; first_name: string | null }[];
        setState({ members: rows.map((r) => ({ id: r.member_id, firstName: r.first_name ?? '' })), isLoading: false, hasFailed: false });
      } catch {
        if (!cancelled) setState({ members: [], isLoading: false, hasFailed: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return state;
}
