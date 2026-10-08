/**
 * When something happened, said the way a person would say it.
 *
 * Today and yesterday are named rather than dated, because that is the
 * difference that decides whether somebody acts now — "13 Sept" makes a reader
 * do arithmetic to answer "is this new?".
 */
export function whenHappened(
  iso: string,
  locale: string,
  t: (key: string) => string,
): string {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return t('when.today');
  if (days === 1) return t('when.yesterday');
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(then);
}

/**
 * How many calendar days until `when`, from `now` (D-336): 0 today, 1
 * tomorrow. Counted between local midnights, not in 24-hour blocks, so a
 * visit tomorrow morning booked tonight is "Tomorrow", not "Today", and a
 * clock change does not shift it.
 */
export function daysUntil(when: Date, now: Date = new Date()): number {
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((day(when) - day(now)) / 86_400_000);
}

/** "Today", "Tomorrow", "In 5 days" — or null for a day already past. */
export function countdown(when: Date, t: (key: string, vars?: Record<string, string | number>) => string, now: Date = new Date()): string | null {
  const days = daysUntil(when, now);
  if (days < 0) return null;
  if (days === 0) return t('when.countdown.today');
  if (days === 1) return t('when.countdown.tomorrow');
  return t('when.countdown.days', { count: days });
}

/**
 * The label over a day's messages in a conversation (Will, 8 October,
 * D-389): "Today", "Yesterday", the weekday within the last week, then the
 * date — with the year only when it is not this year. Calendar days, as
 * `daysUntil` counts them, so a message sent at 11 PM is "Yesterday" by
 * breakfast.
 */
export function dayLabel(
  iso: string,
  locale: string,
  t: (key: string) => string,
  now: Date = new Date(),
): string {
  const then = new Date(iso);
  const days = -daysUntil(then, now);
  if (days <= 0) return t('when.today');
  if (days === 1) return t('when.yesterday');
  if (days < 7) return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(then);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(then.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(then);
}

/** The local calendar day of `iso`, as a key to group a conversation by. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
