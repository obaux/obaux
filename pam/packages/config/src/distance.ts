import { intlLocale, type Locale } from './i18n.js';

/**
 * How far away a place is, said the way a person would say it.
 *
 * Raw arithmetic leaks: `3 * 0.6` is `1.7999999999999998` in IEEE 754, and a
 * member who sees "1.7999999999999998 miles" on a card learns that the app is
 * careless with the things it tells them. Distance is also never precise — it
 * is a straight line from a phone's GPS fix, not a walk — so Pam rounds to one
 * decimal and refuses to pretend below a tenth of a mile.
 *
 * This returns a key and its variables rather than a finished string so the
 * copy stays in the locale bundles (§2.3) and each language keeps its own
 * decimal mark and its own plural rule.
 *
 * `count` is the figure as shown ("1,5"), which cannot be read back as a
 * number, so `plural` carries the number itself for the languages that say
 * "1 mile / 2 miles / 5 miles" three different ways (`pickTemplate`).
 */
export type DistanceKey = 'places.mile' | 'places.miles' | 'places.milesUnder';

export interface DistanceLabel {
  key: DistanceKey;
  vars: { count: string; plural: number };
}

/** Below this, a GPS fix cannot tell one storefront from the next. */
const MIN_REPORTABLE_MILES = 0.1;

/**
 * `null` means "say nothing": no distance is better than a wrong one. Callers
 * omit the chip rather than substituting a zero or a dash, which a member would
 * read as a real measurement.
 */
export function distanceLabel(miles: number, locale: Locale = 'en'): DistanceLabel | null {
  if (!Number.isFinite(miles) || miles < 0) return null;

  const tag = intlLocale(locale);
  const format = (value: number): string =>
    new Intl.NumberFormat(tag, { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(value);

  if (miles < MIN_REPORTABLE_MILES) {
    return {
      key: 'places.milesUnder',
      vars: { count: format(MIN_REPORTABLE_MILES), plural: MIN_REPORTABLE_MILES },
    };
  }

  // Round first, then pluralise on what is actually shown: 1.04 displays as "1"
  // and has to read "1 mile", not "1 miles".
  const rounded = Math.round(miles * 10) / 10;
  const category = new Intl.PluralRules(tag).select(rounded);

  return {
    key: category === 'one' ? 'places.mile' : 'places.miles',
    vars: { count: format(rounded), plural: rounded },
  };
}
