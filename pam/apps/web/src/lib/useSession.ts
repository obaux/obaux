'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Role } from '@pam/config';

/**
 * Who is signed in, and what they are allowed to be shown.
 *
 * Role comes from `profiles`, never from the token or a query string: the
 * access rules in the database read the same column, so a screen that trusts
 * anything else can show a person something the database would refuse them.
 * The screen is a convenience; the database is the boundary.
 *
 * Sessions persist for 90 days and never time out on idle (§12). Somebody who
 * put the phone down mid-enrolment comes back to where they were.
 */
export interface Session {
  userId: string;
  role: Role;
  firstName: string | null;
  regionId: string | null;
  regionName: string | null;
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; session: Session }
  /** Signed in, but no profile row — an account half-made. Never a blank screen. */
  | { status: 'no-profile' }
  | { status: 'error'; offline: boolean };

export function useSession(): { state: SessionState; refresh: () => void } {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();

        const { data: auth } = await supabase.auth.getUser();
        if (cancelled) return;

        if (!auth.user) {
          setState({ status: 'signed-out' });
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, role, first_name, region_id, regions(name)')
          .eq('id', auth.user.id)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        if (!profile) {
          setState({ status: 'no-profile' });
          return;
        }

        const region = profile.regions as { name: string } | { name: string }[] | null;
        setState({
          status: 'signed-in',
          session: {
            userId: profile.id as string,
            role: profile.role as Role,
            firstName: (profile.first_name as string | null) ?? null,
            regionId: (profile.region_id as string | null) ?? null,
            regionName: Array.isArray(region) ? (region[0]?.name ?? null) : (region?.name ?? null),
          },
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
  }, [nonce]);

  return { state, refresh };
}

export async function signOut(): Promise<void> {
  const { createClient } = await import('./supabase');
  await createClient().auth.signOut();
}
