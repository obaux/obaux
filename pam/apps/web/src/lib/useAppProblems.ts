'use client';

import { useEffect, useState } from 'react';

/**
 * What broke in the app, grouped (D-616; Will, 18 October: "if something breaks, please create an error log so the team can be
 * notified and fix the issue"). `app_errors_grouped(p_days)` returns, for each screen, action and code, how often it happened and
 * when it first and last did, newest last first. It refuses anyone who is not a super admin, and the log it reads keeps no person
 * and no free text: a route pattern, an action key from a closed list, a code.
 */
export interface AppProblem {
  /** The screen, as a route pattern: `/person/[id]/`. */
  readonly area: string;
  /** What the person was doing, a key from `APP_ERROR_ACTIONS`: `alerts.switch.closed`. */
  readonly action: string;
  /** An HTTP status, a SQLSTATE, or offline / timeout / unknown. */
  readonly code: string;
  readonly count: number;
  readonly firstSeen: string;
  readonly lastSeen: string;
}

export type AppProblemsState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly problems: readonly AppProblem[] }
  | { readonly status: 'error'; readonly offline: boolean };

/** How far back the list looks (the screen says "Last 7 days"). The log itself keeps 30 days at most. */
export const PROBLEM_DAYS = 7;

export function useAppProblems(enabled: boolean, refreshKey = 0): AppProblemsState {
  const [state, setState] = useState<AppProblemsState>({ status: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('app_errors_grouped', { p_days: PROBLEM_DAYS });
        if (cancelled) return;
        if (error || !Array.isArray(data)) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        const problems = (
          data as { area: string; action: string; code: string; n: number | string; first_seen: string; last_seen: string }[]
        ).map((row) => ({
          area: row.area,
          action: row.action,
          code: row.code,
          count: Number(row.n),
          firstSeen: row.first_seen,
          lastSeen: row.last_seen,
        }));
        // Newest first, whatever order the rows came in.
        problems.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
        setState({ status: 'ready', problems });
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, refreshKey]);
  return state;
}
