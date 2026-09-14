'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
 *
 * Five states, and two of them exist because the audit of the way in (14
 * September) found people falling through the gaps between the other three:
 *
 * - `no-profile` — the phone is verified and PAM has no record. Somebody
 *   halfway through signing up. Every screen used to treat this as signed out
 *   and offer the door they had just walked through.
 * - `suspended` — an account a case manager paused. The database refuses their
 *   rows, and a screen that does not know why shows them a wall of "something
 *   went wrong" notices, each offering to call for help about a thing that is
 *   not broken.
 *
 * The hook also listens to the sign-in system, so signing out in one tab, or
 * a code arriving in another, changes every screen without a reload.
 */
export interface Session {
  userId: string;
  role: Role;
  firstName: string | null;
  regionId: string | null;
  regionName: string | null;
  /** Finished the sign-up steps. False sends somebody back into the flow. */
  isOnboarded: boolean;
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; session: Session }
  /** Signed in, but no profile row — an account half-made. Never a blank screen. */
  | { status: 'no-profile' }
  /** A paused account. Told plainly, with a way to reach a person. */
  | { status: 'suspended' }
  | { status: 'error'; offline: boolean };

export function useSession(): { state: SessionState; refresh: () => void } {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  /** Whose screen this is, so a SIGNED_IN for the same person is not news. */
  const knownUser = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();

        const { data: auth } = await supabase.auth.getUser();
        if (cancelled) return;

        if (!auth.user) {
          knownUser.current = null;
          setState({ status: 'signed-out' });
          return;
        }
        knownUser.current = auth.user.id;

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, role, first_name, region_id, access_status, onboarded_at, regions(name)')
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
        if (profile.access_status === 'suspended') {
          setState({ status: 'suspended' });
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
            isOnboarded: profile.onboarded_at !== null && profile.onboarded_at !== undefined,
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

  // The sign-in system says when the answer changed: a sign-out, or a code
  // that worked for a different person than the one this screen was drawn
  // for. Re-ask then, and only then — supabase-js announces SIGNED_IN every
  // time a client wakes up with a stored session, and re-asking on each of
  // those is a screen that never stops loading.
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    void (async () => {
      const { createClient } = await import('./supabase');
      if (cancelled) return;
      const { data } = createClient().auth.onAuthStateChange((event, next) => {
        if (event === 'SIGNED_OUT') {
          refresh();
          return;
        }
        if (event === 'SIGNED_IN' && next?.user.id && next.user.id !== knownUser.current) {
          knownUser.current = next.user.id;
          refresh();
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [refresh]);

  return { state, refresh };
}

/**
 * Signs out, and forgets what this browser knew about the person.
 *
 * The view-as choice (D-108) goes with them: it is a super admin's setting, and
 * the next person to sign in on this phone is not one.
 */
export async function signOut(): Promise<void> {
  const { createClient } = await import('./supabase');
  try {
    sessionStorage.removeItem('pam.view-as');
  } catch {
    // Storage off, or private mode. Nothing to forget.
  }
  await createClient().auth.signOut();
}
