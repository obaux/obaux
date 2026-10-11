'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Pam's calendar in the member's Google account (D-539). Everything goes through Pam's one function,
 * `google-calendar`, which asks for a single permission (only the calendar Pam makes), keeps the token sealed, and does
 * nothing until it is switched on; until then the section does not show at all.
 */
export type GoogleState =
  | { readonly status: 'loading' }
  /** Not switched on, or not signed in: nothing to offer. */
  | { readonly status: 'hidden' }
  | { readonly status: 'off' }
  | { readonly status: 'connected' }
  /** Google refused Pam's access: connect again. */
  | { readonly status: 'broken' };

export type GoogleReturn = 'connected' | 'failed' | 'off' | null;

/** What Google's sign-in left in the address when it sent the member back. */
export function googleReturnOf(search: string): GoogleReturn {
  const value = new URLSearchParams(search).get('google');
  return value === 'connected' || value === 'failed' || value === 'off' ? value : null;
}

interface StatusAnswer {
  readonly live?: boolean;
  readonly connected?: boolean;
  readonly state?: string | null;
}

export function stateOf(answer: StatusAnswer | null): GoogleState {
  if (!answer?.live) return { status: 'hidden' };
  if (!answer.connected) return { status: 'off' };
  return answer.state === 'broken' ? { status: 'broken' } : { status: 'connected' };
}

export function useGoogleCalendar(enabled: boolean) {
  const [state, setState] = useState<GoogleState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  /** After Disconnect: Google could not be asked to delete the calendar, so the member is told they can. */
  const [leftover, setLeftover] = useState(false);
  const [returned, setReturned] = useState<GoogleReturn>(null);

  const client = useCallback(async () => (await import('./supabase')).createClient(), []);

  useEffect(() => {
    setReturned(googleReturnOf(window.location.search));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    void (async () => {
      try {
        const { data, error } = await (await client()).functions.invoke('google-calendar/status', { method: 'POST' });
        if (live) setState(error ? { status: 'hidden' } : stateOf(data as StatusAnswer));
      } catch {
        if (live) setState({ status: 'hidden' });
      }
    })();
    return () => {
      live = false;
    };
  }, [enabled, client]);

  /** Sends the member to Google to say yes; Google sends them back to the Calendar page. */
  const connect = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      const { data, error } = await (await client()).functions.invoke('google-calendar/connect', { method: 'POST' });
      const url = (data as { url?: string } | null)?.url;
      if (error || !url) throw new Error('connect');
      window.location.assign(url);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }, [client]);

  const disconnect = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    setLeftover(false);
    try {
      const { data, error } = await (await client()).functions.invoke('google-calendar/disconnect', { method: 'POST' });
      if (error) throw new Error('disconnect');
      const answer = data as { calendarRemoved?: boolean } | null;
      setLeftover(answer?.calendarRemoved === false);
      setState({ status: 'off' });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [client]);

  return { state, busy, failed, leftover, returned, connect, disconnect };
}
