/**
 * Languages (§2.3): English and Spanish at launch; Brazilian Portuguese,
 * Simplified and Traditional Chinese, Russian and Arabic added 9 October 2026
 * at Will's ask (sop-amendments A24, D-422). [ASK WILL] before any further one.
 *
 * The codes are BCP 47 tags on purpose. `Intl.DateTimeFormat(tag)` and friends
 * take them as they are, and `lang` on the page wants exactly this, so a date,
 * a number or a file size comes out the way that language writes it with no
 * per-language code. Every language picker is built from `SUPPORTED_LOCALES`
 * and labels each one `language.<code>`, written in itself — adding a language
 * is a bundle, a label key, a row in `LOCALE_INFO` and a line here.
 *
 *   zh-CN  Simplified Chinese, for Mandarin readers.
 *   zh-HK  Traditional Chinese in Hong Kong's written standard, for Cantonese
 *          readers: Cantonese is spoken far more than it is written, and what
 *          its speakers read is standard written Chinese in Traditional
 *          characters. (Not colloquial Cantonese spelling.)
 */
export const SUPPORTED_LOCALES = ['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * The supported language a person's own device asks for, from its ordered list
 * of preferred languages (`navigator.languages`) — or null when none of them is
 * one Pam speaks. A phone set to Arabic should open Pam in Arabic: the first
 * screen in a language someone cannot read is a dead end. This is the person's
 * own setting, not their location; it is only a starting point, and it is never
 * saved as if they had chosen it.
 *
 * The first preference Pam can honour wins, so someone whose device says
 * "Vietnamese, then Spanish" gets Spanish and someone whose first language is
 * English stays on English. We write one Portuguese (Brazilian, which a reader
 * from Portugal follows), and two Chinese: Traditional characters for Hong Kong,
 * Macau, Taiwan and anything marked Traditional, Simplified for the rest.
 */
export function matchLocale(preferences: readonly string[]): Locale | null {
  for (const raw of preferences) {
    const tag = raw.trim().toLowerCase().replace(/_/g, '-');
    const [language = ''] = tag.split('-');
    switch (language) {
      case 'en':
        return 'en';
      case 'es':
        return 'es';
      case 'pt':
        return 'pt-BR';
      case 'ru':
        return 'ru';
      case 'ar':
        return 'ar';
      case 'yue':
        return 'zh-HK';
      case 'cmn':
        return 'zh-CN';
      case 'zh':
        return /(^|-)(hk|mo|tw|hant)(-|$)/.test(tag) ? 'zh-HK' : 'zh-CN';
      default:
        break; // a language Pam does not speak: look at their next preference
    }
  }
  return null;
}

/**
 * What the screen says while a language is being fetched: "Switching to X…",
 * in X (Will, 9 October, D-422: "state what the system is doing in their
 * selected language"). It cannot live in the language's own bundle, which is
 * exactly what has not arrived yet, so these seven short lines travel with the
 * code instead — written in the language they announce, and naming it so it
 * reads as an answer to the choice just made. Each needs a person who reads
 * the language to confirm it before launch.
 */
export const SWITCHING_LANGUAGE: Readonly<Record<Locale, string>> = {
  en: 'Switching to English…',
  es: 'Cambiando a español…',
  'pt-BR': 'Mudando para português…',
  'zh-CN': '正在切换到简体中文…',
  'zh-HK': '正在切換至繁體中文…',
  ru: 'Переключение на русский язык…',
  ar: 'جارٍ التبديل إلى العربية…',
};

export type TextDirection = 'ltr' | 'rtl';

interface LocaleInfo {
  /** Which way the page reads. Arabic is the only right-to-left language so far. */
  readonly dir: TextDirection;
  /**
   * What `Intl` is given. Same as the code, except Arabic: `ar` alone formats
   * numbers and dates in Eastern Arabic digits (٣٠), while every number Pam
   * writes into a sentence is a Western digit (30), so a screen would mix the
   * two. `-u-nu-latn` keeps one kind of digit everywhere.
   */
  readonly intl: string;
  /** The language a phone's speech recogniser is asked to listen for. */
  readonly speech: string;
}

const LOCALE_INFO: Readonly<Record<Locale, LocaleInfo>> = {
  en: { dir: 'ltr', intl: 'en', speech: 'en-US' },
  // A recogniser needs one regional variety of each language; these are the
  // ones for people living in the US. Which language a person gets is their
  // own choice, never worked out from where they are.
  es: { dir: 'ltr', intl: 'es', speech: 'es-US' },
  'pt-BR': { dir: 'ltr', intl: 'pt-BR', speech: 'pt-BR' },
  'zh-CN': { dir: 'ltr', intl: 'zh-CN', speech: 'zh-CN' },
  // Phones take 'zh-HK' as Cantonese (Chrome also calls it 'yue-Hant-HK').
  'zh-HK': { dir: 'ltr', intl: 'zh-HK', speech: 'zh-HK' },
  ru: { dir: 'ltr', intl: 'ru', speech: 'ru-RU' },
  ar: { dir: 'rtl', intl: 'ar-u-nu-latn', speech: 'ar-SA' },
};

export const directionOf = (locale: Locale): TextDirection => LOCALE_INFO[locale].dir;
/** Takes any string: helpers that were handed the active locale as plain text pass it on unchanged. */
export const intlLocale = (locale: string): string =>
  (LOCALE_INFO as Readonly<Record<string, LocaleInfo | undefined>>)[locale]?.intl ?? locale;
export const speechLanguageFor = (locale: Locale): string => LOCALE_INFO[locale].speech;

/**
 * Languages whose bundles say a `{count}` string once per plural category
 * (`points.subtitle`, then `points.subtitle.one`, `.few`, …; the bare key is
 * "other"). English, Spanish and Portuguese write one fixed form, which is
 * wrong for "1 people" and is a known limit of those three; Russian and Arabic
 * cannot be written that way at all, so they must list every category.
 */
export const PLURAL_CATEGORIES_REQUIRED: Readonly<Partial<Record<Locale, readonly string[]>>> = {
  ru: ['one', 'few', 'many'],
  ar: ['zero', 'one', 'two', 'few', 'many'],
};

export type TextBundle = Readonly<Record<string, string>>;
export type TextVars = Readonly<Record<string, string | number>>;

const pluralRules = new Map<string, Intl.PluralRules>();
function pluralCategory(locale: Locale, n: number): string {
  const tag = intlLocale(locale);
  let rules = pluralRules.get(tag);
  if (!rules) {
    rules = new Intl.PluralRules(tag);
    pluralRules.set(tag, rules);
  }
  return rules.select(n);
}

/**
 * Picks the template for `key`: the plural variant for this language when the
 * caller passed a number, otherwise the plain key, otherwise English, otherwise
 * the key itself (a visible `onboarding.name.title` is a bug report; a blank is
 * a dead end).
 *
 * The number is `vars.count`, or `vars.plural` when `count` is already a
 * formatted string ("1,5") that cannot be read back — `distanceLabel` does
 * that.
 */
export function pickTemplate(
  locale: Locale,
  bundle: TextBundle,
  fallback: TextBundle,
  key: string,
  vars?: TextVars,
): string {
  const n = typeof vars?.['count'] === 'number' ? vars['count'] : vars?.['plural'];
  if (typeof n === 'number' && Number.isFinite(n)) {
    const variant = bundle[`${key}.${pluralCategory(locale, n)}`];
    if (variant !== undefined) return variant;
  }
  return bundle[key] ?? fallback[key] ?? key;
}

/** FIRST STRONG ISOLATE and POP DIRECTIONAL ISOLATE (UAX #9): the pair that makes a run of text its own. */
const FSI = '⁨';
const PDI = '⁩';
const ISOLATE_OPENERS: ReadonlySet<string> = new Set(['⁦', '⁧', FSI]);

/**
 * Lays `value` out as a run of its own inside whatever sentence it is written
 * into (D-435). The browser reads a line of mixed text as one stream and
 * reorders it by each character's direction, so an English address inside an
 * Arabic sentence is pulled apart: "Near 1231 N Broad St" came out as
 * "N Broad St 1231 near", with the number beside the Arabic words. An isolate
 * lays the value out first, on its own, in whichever direction its own first
 * letter reads, and then places it in the sentence as one piece. "1231" is
 * not a letter, so the address reads left to right from "N", and an Arabic
 * name reads right to left, with no one deciding which is which.
 *
 * Nothing shows: both characters are zero width. They are in the string,
 * though, which is why this is done only for text that is drawn on a screen
 * (see `fillTemplate`) and never for text that is read by something else.
 *
 * A value that opens an isolate of its own and does not close it, or closes one
 * it never opened, would pair with ours instead and let the rest of the
 * sentence be pulled apart after all; those are balanced first. An empty value
 * stays empty, so an optional piece that is not there leaves no trace.
 */
export function isolate(value: string): string {
  if (value === '') return value;
  let open = 0;
  let inside = '';
  for (const char of value) {
    if (char === PDI) {
      if (open === 0) continue;
      open--;
    } else if (ISOLATE_OPENERS.has(char)) {
      open++;
    }
    inside += char;
  }
  return FSI + inside + PDI.repeat(open + 1);
}

/**
 * `text` cut where `isolate` wrapped values in it: the words the sentence was
 * written in, and the values written into it, in order. For a component that
 * has to treat a value as a thing of its own — the area chip gives a long
 * address a box of its own, so that if something is cut it is the end of the
 * address, not whatever is at the edge of the line. Only the outermost pieces
 * are returned: an isolate inside a value stays in the value's text. A text
 * with no isolates comes back as one piece of words.
 */
export function splitIsolated(text: string): { readonly text: string; readonly isValue: boolean }[] {
  const pieces: { text: string; isValue: boolean }[] = [];
  let depth = 0;
  let current = '';
  const flush = (isValue: boolean) => {
    if (current !== '') pieces.push({ text: current, isValue });
    current = '';
  };
  for (const char of text) {
    if (char === FSI && depth === 0) {
      flush(false);
      depth = 1;
    } else if (char === PDI && depth > 0) {
      depth--;
      if (depth === 0) flush(true);
      else current += char;
    } else if (char === PDI) {
      // A close that closes nothing: not text, as in `isolate`.
    } else {
      if (depth > 0 && ISOLATE_OPENERS.has(char)) depth++;
      current += char;
    }
  }
  flush(depth > 0);
  return pieces;
}

/** `text` without the isolates `isolate` adds, for anything that leaves the screen. */
export function stripIsolates(text: string): string {
  return text.replace(/[⁨⁩]/g, '');
}

/**
 * Fills `{named}` placeholders. A placeholder with no value stays visible.
 *
 * `dir` is which way the language being written in reads. In a left-to-right
 * language nothing changes, byte for byte. In a right-to-left one each text
 * value is isolated (`isolate`), because a name, an address or a file name in
 * another script is exactly what the sentence around it would otherwise
 * reorder. A number is left alone: it has no direction of its own to
 * disagree with the sentence, and wrapping it would only change how the
 * punctuation beside it resolves.
 *
 * Only for text that is drawn. A label a screen reader speaks, the text of a
 * share sheet, a message, an email, a comparison in code: leave `dir` out, so
 * no invisible character goes with it.
 */
export function fillTemplate(template: string, vars?: TextVars, dir: TextDirection = 'ltr'): string {
  if (!vars) return template;
  return Object.entries(vars).reduce((out, [name, v]) => {
    const text = dir === 'rtl' && typeof v === 'string' ? isolate(v) : String(v);
    return out.split(`{${name}}`).join(text);
  }, template);
}
