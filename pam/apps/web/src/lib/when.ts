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
