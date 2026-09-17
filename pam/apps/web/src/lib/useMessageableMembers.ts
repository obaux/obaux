'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Who a case manager or a program admin may start a conversation with (A1,
 * D-152, correcting D-148/149/150's wrong member-to-member scope).
 *
 * A case manager's people and a program's enrolled members are two different
 * relationships, already modelled and already used elsewhere in the product
 * — this does not invent a third:
 *
 *   - A **case manager** reuses the exact "ask broadly, let RLS narrow"
 *     pattern `useCaseload` already established: `profiles where role =
 *     'member'`, unfiltered by this file, narrowed by
 *     `profiles_select_admin_caseload` (`admin_covers()`) — their assigned
 *     caseload, or anyone in their region, the same "caseload" `/admin/`
 *     already shows.
 *   - A **program admin** calls `provider_linked_members()` (0056) instead of
 *     reading `profiles` directly — members enrolled in a service under
 *     their `org_id`. This is a function, not a raw table read, because
 *     `profiles_select_provider_linked` (the row policy that used to answer
 *     this) handed back the whole row — `last_active_at`, `phone`, all of it
 *     — and Will confirmed program admins never see activity info anywhere
 *     in the app, not just through messaging (D-155). PAM has one program
 *     admin per org today (a later feature, not this one), so this is an
 *     org-wide query, not a per-staff-row one — simple on purpose.
 *
 * The two paths need different queries now, so this hook takes the caller's
 * role rather than inferring it from whichever RLS policy happens to answer
 * — the case manager path still relies on RLS narrowing, but the program
 * admin path no longer has a raw-table fallback to fall into by accident.
 *
 * A member's own role never reaches this hook at all — see `/messages/page.tsx`
 * — so there is no "member starts a conversation" path here to accidentally
 * enable.
 *
 * **This is a client-side eligibility list, not an RLS-enforced one.**
 * Reading it tells you who *should* be offered; it is not what stops a
 * modified client from calling `openConversation` with somebody else's id.
 * See D-152 for the RLS gap this still leaves open and what a follow-up
 * migration should check.
 */
export interface MessageableMember {
  readonly profileId: string;
  readonly firstName: string | null;
}

export type MessageableMembersState =
  | { status: 'loading' }
  | { status: 'ready'; people: readonly MessageableMember[] }
  | { status: 'error'; offline: boolean };

export function useMessageableMembers(
  enabled: boolean,
  role: 'admin' | 'provider' | null,
): {
  state: MessageableMembersState;
  refresh: () => void;
} {
  const [state, setState] = useState<MessageableMembersState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled || !role) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();

        const { data, error } =
          role === 'provider'
            ? await supabase.rpc('provider_linked_members')
            : await supabase
                .from('profiles')
                .select('id, first_name')
                .eq('role', 'member')
                .order('first_name', { ascending: true, nullsFirst: false });

        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        setState({
          status: 'ready',
          people: ((data ?? []) as { id: string; first_name: string | null }[]).map((row) => ({
            profileId: row.id,
            firstName: row.first_name,
          })),
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
  }, [enabled, role, nonce]);

  return { state, refresh };
}
