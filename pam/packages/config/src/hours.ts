/**
 * When a place is open — and, for now, a stand-in for when PAM does not know.
 *
 * Six places out of 754 have real hours. Until `enrich-places` runs, an
 * open/closed line on a card would be a claim PAM cannot make, which is why
 * D-044 said PAM would show no open/closed state at all.
 *
 * Will asked on 16 September for placeholder hours so the screens can be
 * demonstrated. They are here, in one file, behind one flag, and they are
 * **never preferred over a real answer**: `hoursFor()` returns the place's own
 * hours whenever it has them and only falls back when it does not. The day
 * enrich-places writes real hours for a row, that row stops using this file
 * without anybody editing it, and the day every row has them, deleting this
 * file changes nothing on screen.
 *
 * ## Turning it off
 *
 * `USE_PLACEHOLDER_HOURS = false` and no place shows an open/closed state
 * unless its hours are real. That is the switch to flip before this is shown to
 * anybody who might mistake a demo for a promise — a partner organisation
 * reading its own opening times off a screen, for instance.
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
  /** False when these are a stand-in. Nothing may claim them as fact. */
  readonly isReal: boolean;
}

/** Will's switch (16 September). False hides open/closed wherever it is unknown. */
export const USE_PLACEHOLDER_HOURS = true;

const CLOSED: readonly OpeningPeriod[] = [];
const nine = (close: string): readonly OpeningPeriod[] => [{ open: '09:00', close }];

/**
 * Four shapes, chosen to look like the places they stand in for rather than
 * like a random number: a weekday office, a place open late, a place open six
 * days, and one open every day. A member seeing "Open now" at 8pm on a Sunday
 * for every place in the list would learn, correctly, not to trust the line.
 */
const SHAPES: readonly WeekHours[] = [
  // Weekdays, nine to five. The clinic.
  [CLOSED, nine('17:00'), nine('17:00'), nine('17:00'), nine('17:00'), nine('17:00'), CLOSED],
  // Weekdays late, Saturday morning. The training provider.
  [
    CLOSED,
    nine('20:00'),
    nine('20:00'),
    nine('20:00'),
    nine('20:00'),
    nine('17:00'),
    [{ open: '10:00', close: '14:00' }],
  ],
  // Six days, with a long Saturday. The library.
  [
    CLOSED,
    nine('19:00'),
    nine('19:00'),
    nine('19:00'),
    nine('19:00'),
    nine('17:00'),
    nine('17:00'),
  ],
  // Every day, dawn to dusk. The recreation center.
  [
    [{ open: '08:00', close: '18:00' }],
    [{ open: '08:00', close: '21:00' }],
    [{ open: '08:00', close: '21:00' }],
    [{ open: '08:00', close: '21:00' }],
    [{ open: '08:00', close: '21:00' }],
    [{ open: '08:00', close: '21:00' }],
    [{ open: '08:00', close: '18:00' }],
  ],
];

/**
 * The same place gets the same stand-in every time.
 *
 * Derived from the id rather than random: hours that change on every render
 * would have a place open and closed within a minute of each other, and
 * somebody would screenshot it.
 */
function shapeFor(id: string): WeekHours {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return SHAPES[Math.abs(hash) % SHAPES.length]!;
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
 * The hours to show for a place: the real ones, or a stand-in, or nothing.
 *
 * This is the only function a screen should call, and the only place that knows
 * placeholders exist.
 */
export function hoursFor(id: string, raw: unknown): PlaceHours | null {
  const real = parseHours(raw);
  if (real) return { week: real, isReal: true };
  if (!USE_PLACEHOLDER_HOURS) return null;
  return { week: shapeFor(id), isReal: false };
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
