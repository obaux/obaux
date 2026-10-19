'use client';

import { useCallback, useEffect, useState } from 'react';
import { SUPABASE_URL } from './project';
import { settleWithin, useMalfunction } from './malfunction';

/**
 * A member's calendar link (D-538, D-604): a secret address that a calendar app follows to show their Pam visits, each one the place's name,
 * its address and the time. Pam keeps only the link's version, which calendar the member said they use and the day they linked it: the address
 * itself is worked out by the database for the member who asks, so it can be shown again whenever the page is open. It is held here in memory
 * and never written anywhere on the phone. A member whose link was made before D-604 (hash-only) has a `legacy` one: Pam has no address to
 * show, and it keeps saying "Pam visit" and the time until they make a new one.
 */
export type CalendarKind = 'apple' | 'google' | 'outlook' | 'other';

export type CalendarLinkState =
  | { readonly status: 'loading' }
  | { readonly status: 'off' }
  | {
      readonly status: 'on';
      readonly isLegacy: boolean;
      /** The calendar the member said they use; null for a legacy link. */
      readonly calendar: CalendarKind | null;
      /** The day it was linked, `YYYY-MM-DD`. */
      readonly linkedOn: string | null;
      /** The address, for a link made the new way; null for a legacy one. */
      readonly token: string | null;
    }
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

interface StateRow {
  readonly is_on: boolean;
  readonly is_legacy: boolean;
  readonly calendar: CalendarKind | null;
  readonly linked_on: string | null;
  readonly token: string | null;
}

/** The member's own time zone, so "since 12 October" is their day. */
function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

export function useCalendarLink(enabled: boolean) {
  const [state, setState] = useState<CalendarLinkState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const malfunction = useMalfunction();

  const client = useCallback(async () => (await import('./supabase')).createClient(), []);

  const read = useCallback(async (): Promise<CalendarLinkState> => {
    const { data, error } = await (await client()).rpc('calendar_link_state');
    const row = (Array.isArray(data) ? data[0] : data) as StateRow | undefined;
    if (error || !row) return { status: 'error' };
    return row.is_on
      ? { status: 'on', isLegacy: row.is_legacy, calendar: row.calendar, linkedOn: row.linked_on, token: row.token }
      : { status: 'off' };
  }, [client]);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    void (async () => {
      try {
        const next = await read();
        if (live) setState(next);
      } catch {
        if (live) setState({ status: 'error' });
      }
    })();
    return () => {
      live = false;
    };
  }, [enabled, read]);

  /**
   * Makes a link, or a new one (the old address stops at once). Say which calendar for a first link; leave it out on a new one to keep
   * the calendar already chosen.
   */
  const make = useCallback(
    async (calendar?: CalendarKind) => {
      setBusy(true);
      const from = typeof document === 'undefined' ? null : document.activeElement;
      // The screen changes only once the link is made and read back, and a link with no answer in 15 seconds counts as failed (D-616).
      const settled = await settleWithin(
        (async () => {
          const { error } = await (await client()).rpc('calendar_link_issue', { p_calendar: calendar ?? null, p_timezone: localTimeZone() });
          if (error) throw error;
          const next = await read();
          if (next.status !== 'on') throw new Error('make');
          return next;
        })(),
      );
      setBusy(false);
      if (settled.status === 'ok') {
        setState(settled.value);
        return;
      }
      malfunction.show('calendar.link', settled.status === 'failed' ? settled.error : 'timeout', from);
      // No answer in time: it may still have been made, so read it again once it answers.
      if (settled.status === 'timeout') void settled.late.then(() => read().then(setState, () => undefined));
    },
    [client, read, malfunction],
  );

  /** Disconnect: Pam forgets the link, the calendar chosen and the day. */
  const turnOff = useCallback(async () => {
    setBusy(true);
    const from = typeof document === 'undefined' ? null : document.activeElement;
    const settled = await settleWithin(
      (async () => {
        const { error } = await (await client()).rpc('calendar_link_off');
        if (error) throw error;
      })(),
    );
    setBusy(false);
    if (settled.status === 'ok') {
      setState({ status: 'off' });
      return;
    }
    malfunction.show('calendar.link.off', settled.status === 'failed' ? settled.error : 'timeout', from);
    if (settled.status === 'timeout') void settled.late.then(() => read().then(setState, () => undefined));
  }, [client, read, malfunction]);

  return { state, busy, make, turnOff };
}
