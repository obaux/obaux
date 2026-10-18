'use client';

import { useEffect, useState } from 'react';
import type { PamAskerRole, PamInboxRow } from './pamInbox';

/**
 * The Pam team's inbox (card a100): `pam_inbox()` and `pam_reply_times(30)`, both Pam team only (Nico's functions,
 * `is_pam_team()` inside). Nothing is read while the switch (`app_settings.pam_messaging_live`, through
 * `pam_status()`) is off: the screen and Home's row then behave as if Pam had no inbox.
 */
export type PamInboxState =
  | { readonly status: 'loading' }
  | { readonly status: 'off' }
  | {
      readonly status: 'ready';
      readonly rows: readonly PamInboxRow[];
      /** The median first reply over the last 30 days, in seconds; null with nothing measured yet. */
      readonly replyMedianSeconds: number | null;
    }
  | { readonly status: 'error'; readonly offline: boolean };

interface InboxRecord {
  conversation_id: string;
  first_name: string | null;
  role: PamAskerRole;
  region: string | null;
  program_name: string | null;
  last_message_at: string;
  last_from_team: boolean;
  waiting_since: string | null;
  status: 'open' | 'closed';
  last_line: string | null;
}

const toRow = (r: InboxRecord): PamInboxRow => ({
  conversationId: r.conversation_id,
  firstName: r.first_name ?? '',
  role: r.role,
  region: r.region,
  programName: r.program_name,
  lastMessageAt: r.last_message_at,
  lastFromTeam: r.last_from_team,
  waitingSince: r.waiting_since,
  status: r.status,
  lastLine: r.last_line ?? '',
});

export function usePamInbox(enabled: boolean): PamInboxState {
  const [state, setState] = useState<PamInboxState>({ status: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      const failed = () => {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      };
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const status = await supabase.rpc('pam_status');
        if (cancelled) return;
        const live = Array.isArray(status.data) && (status.data[0] as { live?: boolean } | undefined)?.live === true;
        if (status.error) return failed();
        if (!live) {
          setState({ status: 'off' });
          return;
        }
        const [inbox, times] = await Promise.all([supabase.rpc('pam_inbox'), supabase.rpc('pam_reply_times', { p_days: 30 })]);
        if (cancelled) return;
        if (inbox.error || !Array.isArray(inbox.data)) return failed();
        const measured = Array.isArray(times.data) ? (times.data[0] as { median_seconds: number | null; conversations: number } | undefined) : undefined;
        setState({
          status: 'ready',
          rows: (inbox.data as InboxRecord[]).map(toRow),
          replyMedianSeconds: measured && measured.conversations > 0 ? measured.median_seconds : null,
        });
      } catch {
        failed();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return state;
}
