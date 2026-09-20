'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Role } from '@pam/config';

/**
 * Reported messages, for the people allowed to review them (D-178).
 *
 * `reports_for_review()` (0065) returns exactly what `/reports/` shows and
 * exactly to whom `report_visible_to_me()` allows: every super admin, and a
 * case manager with an active assignment for the sender or the reporter of
 * a message report. The excerpt on the row is the one piece of message text
 * that ever reaches a case manager (0034, D-074) — this hook never reads
 * `messages`, and could not: there is still no admin policy on that table.
 *
 * First names and roles come back on the row itself, not from a `profiles`
 * read: a program admin who sent a reported message is not on any case
 * manager's caseload, so a raw join here would have shown "somebody" for
 * exactly the rows this screen exists for.
 */
export interface ReportRow {
  readonly id: string;
  readonly targetType: string;
  readonly reason: string | null;
  readonly excerpt: string | null;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly resolution: string | null;
  readonly reporterName: string | null;
  readonly reporterRole: Role;
  readonly aboutName: string | null;
  readonly aboutRole: Role | null;
}

export type ReportsState =
  | { status: 'loading' }
  | { status: 'ready'; reports: readonly ReportRow[] }
  | { status: 'error'; offline: boolean };

interface Row {
  id: string;
  target_type: string;
  reason: string | null;
  target_excerpt: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution: string | null;
  reporter_name: string | null;
  reporter_role: Role;
  about_name: string | null;
  about_role: Role | null;
}

export function useReports(enabled: boolean): { state: ReportsState; refresh: () => void } {
  const [state, setState] = useState<ReportsState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('reports_for_review');
        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        setState({
          status: 'ready',
          reports: ((data ?? []) as Row[]).map((row) => ({
            id: row.id,
            targetType: row.target_type,
            reason: row.reason,
            excerpt: row.target_excerpt,
            createdAt: row.created_at,
            resolvedAt: row.resolved_at,
            resolution: row.resolution,
            reporterName: row.reporter_name,
            reporterRole: row.reporter_role,
            aboutName: row.about_name,
            aboutRole: row.about_role,
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
  }, [enabled, nonce]);

  return { state, refresh };
}
