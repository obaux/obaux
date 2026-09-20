'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Role } from '@pam/config';

/**
 * Who the signed-in person may start a conversation with.
 *
 * One function, `messageable_people()` (0063, D-176), for all three roles
 * that can message: a case manager gets the members on their active
 * caseload, a program admin the members enrolled in their org's services,
 * and a member — new with D-176, superseding D-163's "a member starts
 * nothing" — their own case manager and program admin(s). Id, first name
 * and role, nothing else, following `conversation_partners()` (0061).
 *
 * The list and the rule are the same function on the database side
 * (`can_message()`), which is what makes this honest: before 0063 the case
 * manager path asked `profiles` through `admin_covers()`, whose region arm
 * offered people the messenger's own rule never meant to include. Now a
 * name on this list is a conversation `open_direct_conversation()` will
 * actually open, and a name not on it is one it will refuse — the screen
 * cannot disagree with the database about who is reachable.
 */
export interface MessageableMember {
  readonly profileId: string;
  readonly firstName: string | null;
  readonly role: Role;
}

export type MessageableMembersState =
  | { status: 'loading' }
  | { status: 'ready'; people: readonly MessageableMember[] }
  | { status: 'error'; offline: boolean };

export function useMessageableMembers(enabled: boolean): {
  state: MessageableMembersState;
  refresh: () => void;
} {
  const [state, setState] = useState<MessageableMembersState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('messageable_people');

        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        setState({
          status: 'ready',
          people: ((data ?? []) as { profile_id: string; first_name: string | null; role: Role }[]).map(
            (row) => ({ profileId: row.profile_id, firstName: row.first_name, role: row.role }),
          ),
        });
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    };

    setState({ status: 'loading' });
    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, nonce]);

  return { state, refresh };
}
