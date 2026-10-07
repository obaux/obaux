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
