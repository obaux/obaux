// Turning a queued row into the words that go out.
//
// Kept apart from index.ts, and taking its copy as an argument rather than
// importing it, so the same code that renders a real message is what the tests
// render against — no Deno, no network, no second implementation to drift.

export type Locale = 'en' | 'es' | 'pt-BR' | 'zh-CN' | 'zh-HK' | 'ru' | 'ar';

/** The languages Pam is in. A profile holds one of these (0083). */
export const LOCALES: readonly Locale[] = ['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'];

/** A wording in one of the later languages, signed (or not) on its own. */
export interface Draft {
  body: string;
  reviewedBy: string;
  maxVarLengths?: Record<string, number>;
}

export interface Template {
  key: string;
  en: string;
  es: string;
  vars: string[];
  reviewedBy: string;
  isFirstContact?: boolean;
  maxVarLengths?: Record<string, number>;
  more?: Partial<Record<Locale, Draft>>;
}

/**
 * Everything the dispatcher says comes from here, generated from
 * packages/config (zz-generate-dispatcher-bundle.test.ts). The tables below —
 * the way out, the forbidden words, the cheap encoding — live in the config
 * package too, so the dispatcher and the tests cannot disagree about them.
 */
export interface Bundle {
  templates: Record<string, Template>;
  reasons: Record<string, Partial<Record<Locale, string>>>;
  /** The STOP sentence in each language. */
  stop: Record<Locale, string>;
  /** Forbidden words per language, already folded (lower case, no accents). */
  forbidden: Record<Locale, string[]>;
  /** The characters one cheap (GSM-7) segment can carry. */
  gsm7: string;
}

export const SMS_MAX_LENGTH = 160;
/** One segment of a script GSM-7 cannot carry (Chinese, Russian, Arabic). */
export const SMS_MAX_LENGTH_UCS2 = 70;

// §9, in English. The same list the config package tests against; repeated here
// because this is the last point before the words leave Pam, and a last check
// is only worth having if it holds on its own. The other languages' lists come
// in the bundle.
const FORBIDDEN = [
  /\bparole\b/i,
  /\bprobation\b/i,
  /\bprison\b/i,
  /\binmate\b/i,
  /\boffender\b/i,
  /\bconviction\b/i,
  /\breentry\b/i,
  /\bcase manager\b/i,
  /\bcaseworker\b/i,
];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

/** A message that must not be sent, and why. Never quotes the offending words. */
export class UnsendableError extends Error {}

/**
 * The language a row asks for. An unknown value means English, as it always
 * has; `render` then decides whether there is signed-off wording in it.
 */
export function localeOf(value: string | null | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : 'en';
}

/** Lower case, no accents, no combining marks: what the word lists are folded to. */
export function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

function wordingOf(template: Template, locale: Locale): Draft | undefined {
  if (locale === 'en') return { body: template.en, reviewedBy: template.reviewedBy };
  if (locale === 'es') return { body: template.es, reviewedBy: template.reviewedBy };
  return template.more?.[locale];
}

function isGsm7(bundle: Bundle, text: string): boolean {
  const alphabet = new Set(bundle.gsm7);
  return [...text].every((c) => alphabet.has(c));
}

/** §9, applied to the finished words rather than to the template. */
export function assertSafe(
  body: string,
  locale: Locale = 'en',
  forbidden: Record<string, string[]> = {},
  limit: number = SMS_MAX_LENGTH,
): void {
  if (!body.startsWith('Pam: ')) throw new UnsendableError('message does not identify Pam');
  if (body.length > limit) {
    throw new UnsendableError(`message is ${body.length} characters, over the ${limit} limit`);
  }
  if (EMOJI.test(body)) throw new UnsendableError('message contains emoji');
  // The word itself is never named: a log line quoting it is the same
  // disclosure in a different place.
  for (const pattern of FORBIDDEN) {
    if (pattern.test(body)) throw new UnsendableError('message would reveal justice involvement');
  }
  if (locale !== 'en') {
    const text = fold(body);
    for (const term of forbidden[locale] ?? []) {
      if (term && text.includes(term)) {
        throw new UnsendableError('message would reveal justice involvement');
      }
    }
  }
}

/**
 * Shortens a value at a word boundary, as the config package does, so a long
 * address clips instead of making a reminder too long to send.
 */
export function shortenToFit(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/**
 * The language a message is written in: the one asked for when someone has
 * signed wording for it, English when not. A draft is never sent — a text is
 * the one place Pam cannot show somebody a draft first.
 */
export function usableLocale(bundle: Bundle, key: string, wanted: Locale): Locale {
  const template = bundle.templates[key];
  const wording = template ? wordingOf(template, wanted) : undefined;
  if (!wording || !wording.reviewedBy) return 'en';
  return wanted;
}

/** Renders a queued message, or explains why it must not be sent. */
export function render(
  bundle: Bundle,
  key: string,
  wanted: Locale,
  vars: Record<string, string>,
): string {
  const template = bundle.templates[key];
  if (!template) throw new UnsendableError(`unknown template "${key}"`);

  // The gate. An unreviewed template is not a missing feature — it is copy
  // nobody has read yet, and Pam stays quiet until somebody has.
  if (!template.reviewedBy) {
    throw new UnsendableError(`template "${key}" has no reviewedBy — copy is not signed off`);
  }

  // The language: theirs if somebody has signed it, English if not. A reason
  // phrase belongs to the same decision, so a language with no phrase for this
  // reason is English for the whole message rather than half of each.
  let locale = usableLocale(bundle, key, wanted);
  const reasonKey = typeof vars.reason_key === 'string' ? vars.reason_key : undefined;
  if (reasonKey !== undefined) {
    const reason = bundle.reasons[reasonKey];
    if (!reason) throw new UnsendableError(`unknown reason "${reasonKey}"`);
    if (!reason[locale]) locale = 'en';
  }

  const wording = wordingOf(template, locale)!;

  // The queue carries a reason KEY, never a phrase, so the wording can still
  // change after a message is waiting (0037).
  const filled: Record<string, string> = { ...vars };
  if (reasonKey !== undefined) {
    filled.reason = bundle.reasons[reasonKey]![locale]!;
    delete filled.reason_key;
  }

  let body = wording.body;
  for (const name of template.vars) {
    const value = filled[name];
    if (value === undefined) throw new UnsendableError(`missing variable "${name}" for "${key}"`);
    const budget = wording.maxVarLengths?.[name] ?? template.maxVarLengths?.[name];
    body = body.replaceAll(`{${name}}`, budget === undefined ? value : shortenToFit(value, budget));
  }

  const leftover = body.match(/\{([a-zA-Z0-9_]+)\}/);
  if (leftover) throw new UnsendableError(`unfilled placeholder "${leftover[1]}" in "${key}"`);

  // Twilio compliance: the way out travels with the first message somebody gets
  // from a number they do not recognise.
  const stop = template.isFirstContact ? bundle.stop[locale] : '';
  const limit = isGsm7(bundle, wording.body.replace(/\{[a-zA-Z0-9_]+\}/g, '') + stop)
    ? SMS_MAX_LENGTH
    : SMS_MAX_LENGTH_UCS2;
  body += stop;

  assertSafe(body, locale, bundle.forbidden, limit);
  return body;
}
