import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_LOCALES, type Locale } from '../src/i18n.js';

export type Bundle = Record<string, string>;

/**
 * Every supported language's bundle, read from disk by the list in
 * `SUPPORTED_LOCALES` — so a language that is added to the list and has no
 * file fails here, and a test written over `BUNDLES` covers it with no edit.
 */
export const BUNDLES = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [
    locale,
    JSON.parse(readFileSync(fileURLToPath(new URL(`../src/locales/${locale}.json`, import.meta.url)), 'utf8')) as Bundle,
  ]),
) as Record<Locale, Bundle>;

export const EN = BUNDLES.en;
export const OTHER_LOCALES = SUPPORTED_LOCALES.filter((l): l is Exclude<Locale, 'en'> => l !== 'en');

/** `{count}` strings that need no plural forms: a symbol, a fixed 0.1, or a key already chosen for "one". */
export const NO_PLURAL_VARIANTS = new Set([
  'points.way.plus',
  'places.mile',
  'places.milesUnder',
  // English picks this one itself for a count of 1 ("{count} policy"); it keeps {count} so that Portuguese (which
  // uses "one" for 0 as well as 1) and Russian (21, 31...) can write the number instead of a fixed "1" (D-582).
  'program.policies.rowBody.one',
  // The same for the Pam inbox's waiting times and reply times (Ava, S1): English writes "1 minute" itself, and the other languages
  // carry the category as `.one` of the plural family, so the key is the family's own form and not a family of its own.
  'pam.inbox.waiting.minutes.one',
  'pam.inbox.waiting.hours.one',
  'pam.inbox.waiting.days.one',
  // And "Sent to 1 lead." (the team's start-a-message note): English picks the singular itself.
  'pam.inbox.sent.one',
  'pam.inbox.replyTime.minutes.one',
  'pam.inbox.replyTime.hours.one',
  'pam.inbox.replyTime.days.one',
  // And "{count} time" on the super admin's Problems list (Ava, D-616): English picks the singular itself.
  'problems.times.one',
]);
export const COUNT_KEYS = Object.keys(EN).filter((k) => EN[k]!.includes('{count}') && !NO_PLURAL_VARIANTS.has(k));

const CATEGORY = /\.(zero|one|two|few|many)$/;
/** The key a plural variant belongs to, or the key itself. */
export const baseKey = (key: string): string => {
  if (key in EN) return key;
  const base = key.replace(CATEGORY, '');
  return base !== key && COUNT_KEYS.includes(base) ? base : key;
};
export const isVariant = (key: string): boolean => !(key in EN) && baseKey(key) !== key;

export const placeholders = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
