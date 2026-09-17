'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Role } from '@pam/config';

/**
 * Every account, for the person operating PAM.
 *
 * A super admin had no screen at all until now: the case manager screen checks
 * for `role = 'admin'` exactly, so Will opening it was told it was not for him,
 * which was true. This is the read behind the screen that fixes that.
 *
 * It goes through one database function rather than a table query, and the
 * function decides whether the caller is a super admin — not this file. A check
 * in the browser is a suggestion; the same call from a console would answer
 * anybody. `directory_people` returns zero rows to everybody else (0043).
 *
 * Five facts per person: name, role, region, status, last active. No phone, no
 * goals, no messages. The transparency screen tells a member what the person
 * who invited them can see, and none of that is widened by a list of accounts.
 */

export interface DirectoryPerson {
  readonly id: string;
  readonly firstName: string | null;
  readonly role: Role;
  readonly regionName: string | null;
  readonly accessStatus: 'active' | 'limited' | 'suspended';
  readonly lastActiveAt: string | null;
  /** Granted by a super admin (0057). See `useDemoView`. */
  readonly isDemo: boolean;
}

export type DirectoryState =
  | { status: 'loading' }
  | { status: 'ready'; people: readonly DirectoryPerson[] }
  | { status: 'empty' }
  | { status: 'error'; offline: boolean };

export function useDirectory(
  enabled: boolean,
  role: Role | 'all',
): { state: DirectoryState; refresh: () => void } {
  const [state, setState] = useState<DirectoryState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('directory_people', {
          p_role: role === 'all' ? null : role,
        });

        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }

        const rows = (data ?? []) as {
          id: string;
          first_name: string | null;
          role: Role;
          region_name: string | null;
          access_status: DirectoryPerson['accessStatus'];
          last_active_at: string | null;
          is_demo: boolean;
        }[];

        if (rows.length === 0) {
          setState({ status: 'empty' });
          return;
        }

        setState({
          status: 'ready',
          people: rows.map((row) => ({
            id: row.id,
            firstName: row.first_name,
            role: row.role,
            regionName: row.region_name,
            accessStatus: row.access_status,
            lastActiveAt: row.last_active_at,
            isDemo: Boolean(row.is_demo),
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

/** Grants or revokes the demo view on one account (0057). Super admin only. */
export async function setDemoView(userId: string, enabled: boolean): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('set_demo_view', {
      p_user_id: userId,
      p_enabled: enabled,
    });
    return !error;
  } catch {
    return false;
  }
}
