'use client';

import { useEffect, useState } from 'react';
import { hoursFor, openState, type PlaceHours } from '@pam/config/hours';

/**
 * Open or closed, worded, for a screen.
 *
 * The clock is the awkward part. This app is a static export: the HTML is built
 * once, months before somebody opens it, so anything derived from "now" during
 * render is either wrong or a hydration mismatch. So the first paint says
 * nothing about opening hours, and the answer appears once the browser has told
 * us the time — which is also when a member's own timezone is knowable.
 *
 * It re-reads the clock every minute. A place that closes at five should stop
 * saying "Open until 5:00pm" at five, not when somebody happens to navigate.
 */
export interface PlaceStatus {
  readonly isOpen: boolean;
  readonly label: string;
  /** False when the hours behind this are a stand-in (see @pam/config/hours). */
  readonly isReal: boolean;
  readonly hours: PlaceHours;
}

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** "17:00" → "5:00pm", in the member's own locale. */
export function formatTime(hhmm: string, locale: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  // A date whose only job is to carry an hour and a minute.
  const at = new Date(2026, 0, 1, (h ?? 0) % 24, m ?? 0);
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(at);
}

/**
 * The clock, once per screen.
 *
 * A list cannot call a hook per row, and twenty rows each running their own
 * interval would be twenty timers doing the same job. The screen holds the
 * time; `placeStatus` is a pure function of it.
 *
 * Null until the browser has run, which is what keeps a static export from
 * rendering one answer at build time and a different one on arrival.
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

export function placeStatus(
  id: string,
  rawHours: unknown,
  now: Date | null,
  t: Translate,
  locale: string,
): PlaceStatus | null {
  if (!now) return null;

  const hours = hoursFor(id, rawHours);
  if (!hours) return null;

  const state = openState(hours, now);
  if (state.state === 'unknown') return null;

  const label =
    state.state === 'open'
      ? t('place.openUntil', { time: formatTime(state.until, locale) })
      : state.opensAt
        ? t('place.closedUntil', { time: formatTime(state.opensAt, locale) })
        : t('place.closed');

  return { isOpen: state.state === 'open', label, isReal: hours.isReal, hours };
}

/** The same answer for a single place, for a screen showing exactly one. */
export function usePlaceStatus(
  id: string,
  rawHours: unknown,
  t: Translate,
  locale: string,
): PlaceStatus | null {
  return placeStatus(id, rawHours, useNow(), t, locale);
}

/** The week, in the member's own language, for the detail screen. */
export function weekLines(
  hours: PlaceHours,
  locale: string,
  closedLabel: string,
): { day: string; hours: string }[] {
  const names = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  return hours.week.map((periods, index) => ({
    // 4 January 2026 was a Sunday, so index 0 lands on Sunday — the same
    // indexing `Date.getDay()` uses, which is the one mistake here that would
    // shift every place by a day.
    day: names.format(new Date(2026, 0, 4 + index)),
    hours:
      periods.length === 0
        ? closedLabel
        : periods
            .map((p) => `${formatTime(p.open, locale)} – ${formatTime(p.close, locale)}`)
            .join(', '),
  }));
}
