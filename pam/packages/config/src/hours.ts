/**
 * When a place is open, when Pam knows it.
 *
 * Six places out of 754 have real hours. For every other place Pam says nothing about when it is open: no stand-in, no guess, no sample
 * (Will, 31 October 2026: "It's not acceptable to have fake hours on the real app", D-624). That replaces the stand-in week Will asked for
 * on 16 September (D-044's "show no open/closed state at all" is back for everything but the places that have real hours). A screen that
 * has no hours shows no hours row, no week and no "Open until…/Closed" line; where a member might want them it can link to the place on
 * Google ("Check hours on Google"). Real hours come only from the research project (Iris), once Will says yes.
 *
 * `hoursFor()` returns the place's own hours when it has them and nothing otherwise, so the day `enrich-places` writes real hours for a
 * row, that row starts showing them without anybody editing this file.
 */

/** A day's opening, in 24-hour local time. `0000`–`2400`, minutes included. */
export interface OpeningPeriod {
  /** "09:00" */
  readonly open: string;
  /** "17:00". "24:00" means midnight at the end of this day. */
  readonly close: string;
}

/**
 * A week. Index 0 is Sunday, matching `Date.getDay()` — the one indexing
 * mistake that silently shifts every place by a day.
 */
export type WeekHours = readonly (readonly OpeningPeriod[])[];

export interface PlaceHours {
  readonly week: WeekHours;
  /** Always true: Pam shows only hours it has (D-624). Kept so a caller that asks does not change. */
  readonly isReal: boolean;
}

/**
 * Parses what the database has into a week, or null when it is not usable.
 *
 * The column is `jsonb` and nothing has written to it yet beyond six rows, so
 * this is deliberately forgiving: anything it cannot read becomes null and the
 * caller falls back, rather than a member seeing a crash because a provider
 * typed their hours into a field by hand.
 */
export function parseHours(raw: unknown): WeekHours | null {
  if (!raw || typeof raw !== 'object') return null;
  const week = (raw as { week?: unknown }).week ?? raw;
  if (!Array.isArray(week) || week.length !== 7) return null;

  const parsed: (readonly OpeningPeriod[])[] = [];
  for (const day of week) {
    if (!Array.isArray(day)) return null;
    const periods: OpeningPeriod[] = [];
    for (const period of day) {
      const open = (period as OpeningPeriod)?.open;
      const close = (period as OpeningPeriod)?.close;
      if (typeof open !== 'string' || typeof close !== 'string') return null;
      if (!/^\d{2}:\d{2}$/.test(open) || !/^\d{2}:\d{2}$/.test(close)) return null;
      periods.push({ open, close });
    }
    parsed.push(periods);
  }
  return parsed;
}

/**
 * What `services.hours` holds for a place that has no opening times to give, on purpose (Will, 31 October: Parks & Rec need no phone,
 * website or times open). It is not "unknown": an unknown place (`hours` null) may get a stand-in or, one day, real hours; this one never
 * does. The marker is a value in the column the place reads already return, so no read changes, and `enrich-places` (not built yet; it must fill
 * only rows whose `hours` is null) leaves it alone. See D-622 "Parks & Rec show no hours".
 */
export const NO_HOURS = { none: true } as const;

/** Whether `services.hours` says this place has no opening times to show, at all (see `NO_HOURS`). */
export function declaresNoHours(raw: unknown): boolean {
  return !!raw && typeof raw === 'object' && !Array.isArray(raw) && (raw as { none?: unknown }).none === true;
}

/**
 * The hours to show for a place: the real ones, or nothing.
 *
 * This is the only function a screen should call. A place that declares it has no hours (`NO_HOURS`) gets nothing, and so does any place
 * whose hours Pam does not hold: no stand-in, no open or closed line, no week (D-622, D-624).
 */
export function hoursFor(_id: string, raw: unknown): PlaceHours | null {
  if (declaresNoHours(raw)) return null;
  const real = parseHours(raw);
  return real ? { week: real, isReal: true } : null;
}

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
};

export type OpenState =
  | { readonly state: 'open'; readonly until: string }
  | { readonly state: 'closed'; readonly opensAt: string | null }
  | { readonly state: 'unknown' };

/**
 * Open or closed, right now.
 *
 * `now` is a parameter rather than read from the clock so this is testable and
 * so a screen renders the same thing on the server and in the browser — the
 * second one matters in a static export, where a mismatch is a hydration error
 * rather than a wrong answer.
 *
 * A period whose close is at or before its open runs past midnight, and the
 * check wraps rather than deciding the place is shut for a negative number of
 * minutes.
 */
export function openState(hours: PlaceHours | null, now: Date): OpenState {
  if (!hours) return { state: 'unknown' };

  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  for (const period of hours.week[day] ?? []) {
    const open = toMinutes(period.open);
    const close = toMinutes(period.close);
    const wraps = close <= open;
    const isOpen = wraps ? minutes >= open || minutes < close : minutes >= open && minutes < close;
    if (isOpen) return { state: 'open', until: period.close };
  }

  // Yesterday's late session may still be running — 7pm to 2am is a real
  // shape in this catalogue, not a hypothetical.
  const yesterday = (day + 6) % 7;
  for (const period of hours.week[yesterday] ?? []) {
    const open = toMinutes(period.open);
    const close = toMinutes(period.close);
    if (close <= open && minutes < close) return { state: 'open', until: period.close };
  }

  // The next time it opens, looking forward a week. Null when it never does.
  for (let ahead = 0; ahead < 7; ahead += 1) {
    const candidate = (day + ahead) % 7;
    for (const period of hours.week[candidate] ?? []) {
      if (ahead === 0 && toMinutes(period.open) <= minutes) continue;
      return { state: 'closed', opensAt: period.open };
    }
  }
  return { state: 'closed', opensAt: null };
}
