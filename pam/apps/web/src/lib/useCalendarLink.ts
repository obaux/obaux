'use client';

import { useCallback, useEffect, useState } from 'react';
import { SUPABASE_URL } from './project';

/**
 * A member's calendar link (D-538): a secret address that a calendar app follows to show their Pam
 * visits. Pam keeps only a hash of it, so the address is shown once, when it is made; it is held here
 * in memory for as long as the page is open and never written anywhere on the phone.
 */
export type CalendarLinkState =
  | { readonly status: 'loading' }
  | { readonly status: 'off'; readonly showDetails: boolean }
  | { readonly status: 'on'; readonly showDetails: boolean; readonly token: string | null }
  | { readonly status: 'error' };

export const feedUrl = (token: string): string => `${SUPABASE_URL}/functions/v1/calendar-feed/${token}.ics`;
/** Apple Calendar follows a webcal:// address. */
export const appleUrl = (token: string): string => feedUrl(token).replace(/^https?:/, 'webcal:');

/**
 * Whether the device can open a webcal:// address (D-538): iPhone, iPad and Mac, which hand it to Apple Calendar.
 * On Android or Windows the address opens nothing and a dead button is worse than none. If the device cannot be
 * told, the button is shown.
 */
export function isAppleDevice(userAgent: string, platform = ''): boolean {
  const text = `${userAgent} ${platform}`;
  if (/iPhone|iPad|iPod|Macintosh|Mac OS X|MacIntel/i.test(text)) return true;
  if (/Android|Windows|Win32|Linux|CrOS|X11/i.test(text)) return false;
  return true;
}

interface StatusRow {
  readonly is_on: boolean;
  readonly show_details: boolean;
}

export function useCalendarLink(enabled: boolean) {
  const [state, setState] = useState<CalendarLinkState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const client = useCallback(async () => (await import('./supabase')).createClient(), []);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    void (async () => {
      try {
        const { data, error } = await (await client()).rpc('calendar_link_status');
        if (!live) return;
        const row = (Array.isArray(data) ? data[0] : data) as StatusRow | undefined;
        if (error || !row) return setState({ status: 'error' });
        setState(row.is_on ? { status: 'on', showDetails: row.show_details, token: null } : { status: 'off', showDetails: row.show_details });
      } catch {
        if (live) setState({ status: 'error' });
      }
    })();
    return () => {
      live = false;
    };
  }, [enabled, client]);

  /** Makes a link, or a new one (the old stops at once). Keeps the member's choice about details. */
  const make = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      const { data, error } = await (await client()).rpc('calendar_link_make');
      if (error || typeof data !== 'string') throw new Error('make');
      setState((s) => ({ status: 'on', showDetails: s.status === 'on' || s.status === 'off' ? s.showDetails : false, token: data }));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [client]);

  const setShowDetails = useCallback(
    async (show: boolean) => {
      setFailed(false);
      try {
        const { error } = await (await client()).rpc('calendar_link_set_details', { p_show: show });
        if (error) throw new Error('details');
        setState((s) => (s.status === 'on' || s.status === 'off' ? { ...s, showDetails: show } : s));
      } catch {
        setFailed(true);
      }
    },
    [client],
  );

  const turnOff = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      const { error } = await (await client()).rpc('calendar_link_off');
      if (error) throw new Error('off');
      setState((s) => ({ status: 'off', showDetails: s.status === 'on' ? s.showDetails : false }));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [client]);

  const showDetails = state.status === 'on' || state.status === 'off' ? state.showDetails : false;
  return { state, busy, failed, make, setShowDetails, turnOff, showDetails };
}
