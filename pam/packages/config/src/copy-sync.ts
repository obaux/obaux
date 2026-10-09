/**
 * Keeping seven languages in step with the English (A24, D-424).
 *
 * The locale tests already fail when a language is *missing* a key. They cannot
 * tell when English has been **reworded** and a translation still says the old
 * thing: the key is there, so every check passes, and a promise on the privacy
 * page quietly stops matching its translation. This is the missing half.
 *
 * ## The ledger
 *
 * `locales/ledger.json` records, for every key in every other language, two
 * short hashes: of the English the translation was made *from*, and of the
 * translation itself. Comparing them with what is on disk now says which of
 * four things happened since:
 *
 *   in step      English and translation are what they were.
 *   stale        English changed, the translation did not. **A failure.** The
 *                translation says what the English used to say.
 *   changed      English changed and so did the translation: somebody
 *                answered the change. Accepted by `ack`.
 *   unrecorded   A new key. Accepted by `ack` once it has a translation.
 *   edited       The translation changed with the English unchanged (a better
 *                word, a typo). Accepted by `ack`.
 *
 * Everything but "in step" must be acknowledged — `pnpm --filter @pam/config
 * copy:ack` — and **only stale keys cannot be acknowledged by accident**: a
 * stale key stays a failure until it is re-translated or kept on purpose
 * (`--keep key`, for an English typo fix that changes no meaning). That one
 * deliberate step is the whole mechanism.
 *
 * Plural variants (`key.few`, `key.many`…) are not in English; they follow
 * their base key, so rewording `{count} people` makes every language's plural
 * forms of it stale together.
 *
 * ## Drafting
 *
 * `draftPrompt` / `parseDrafts` build the request to a model and check what
 * comes back (every key, the same placeholders, nothing absurd in length). The
 * network call lives in the CLI; this file takes a `provider`, so tests run
 * against a fake. A drafted translation is a *draft*: it goes through the same
 * tests (dignity terms, placeholders, key-for-key), and the privacy page,
 * terms and notices still need a native reader (docs/before-launch.md).
 *
 * Imports only Node's own modules, so the CLI can run it without a build.
 */
import { createHash } from 'node:crypto';

export type Bundle = Readonly<Record<string, string>>;

export const PLURAL_FORMS = ['zero', 'one', 'two', 'few', 'many'] as const;
const PLURAL_SUFFIX = new RegExp(`\\.(${PLURAL_FORMS.join('|')})$`);

/** Six hex characters: enough to notice a change, short enough to read in a diff. */
export function shortHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 6);
}

/** What the ledger keeps for one translation: `<hash of the English>.<hash of the translation>`. */
export function ledgerValue(english: string, translation: string): string {
  return `${shortHash(english)}.${shortHash(translation)}`;
}

/** The English key a translated key answers: itself, or the base of a plural variant. Null if none. */
export function sourceKeyOf(key: string, english: Bundle): string | null {
  if (key in english) return key;
  const base = key.replace(PLURAL_SUFFIX, '');
  return base !== key && base in english ? base : null;
}

export interface Ledger {
  readonly version: 1;
  /** language → key → `<english hash>.<translation hash>` */
  readonly locales: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

export type DriftKind = 'stale' | 'changed' | 'edited' | 'unrecorded';

export interface Drift {
  readonly locale: string;
  readonly key: string;
  readonly kind: DriftKind;
}

export interface DriftReport {
  /** Keys English has that a language does not, by language. */
  readonly missing: readonly { locale: string; key: string }[];
  readonly drift: readonly Drift[];
  /** Ledger entries for keys that no longer exist. */
  readonly orphaned: readonly { locale: string; key: string }[];
  /** Anything to do before a push. */
  readonly clean: boolean;
}

export function driftOf(english: Bundle, bundles: Readonly<Record<string, Bundle>>, ledger: Ledger): DriftReport {
  const missing: { locale: string; key: string }[] = [];
  const drift: Drift[] = [];
  const orphaned: { locale: string; key: string }[] = [];

  for (const [locale, bundle] of Object.entries(bundles)) {
    if (locale === 'en') continue;
    const recorded = ledger.locales[locale] ?? {};

    for (const key of Object.keys(english)) {
      // A plural variant of this key being present is not "missing": a language
      // that needs `.one` and `.few` has them in addition to the base.
      if (!(key in bundle)) missing.push({ locale, key });
    }

    for (const [key, translation] of Object.entries(bundle)) {
      const source = sourceKeyOf(key, english);
      if (source === null) continue; // not an English key at all: the parity tests report it
      const [recEn, recTr] = (recorded[key] ?? '').split('.');
      if (!recEn || !recTr) {
        drift.push({ locale, key, kind: 'unrecorded' });
        continue;
      }
      const englishChanged = recEn !== shortHash(english[source]!);
      const translationChanged = recTr !== shortHash(translation);
      if (englishChanged && !translationChanged) drift.push({ locale, key, kind: 'stale' });
      else if (englishChanged) drift.push({ locale, key, kind: 'changed' });
      else if (translationChanged) drift.push({ locale, key, kind: 'edited' });
    }

    for (const key of Object.keys(recorded)) {
      if (!(key in bundle)) orphaned.push({ locale, key });
    }
  }

  return { missing, drift, orphaned, clean: missing.length + drift.length + orphaned.length === 0 };
}

export interface AckOptions {
  /** Keys whose translation is kept as it is though the English changed. */
  readonly keep?: readonly string[];
  /** Only these languages. */
  readonly locales?: readonly string[];
  /** Acknowledge everything including stale keys — for the very first ledger only. */
  readonly everything?: boolean;
}

/**
 * The ledger after acknowledging what has been answered. Stale keys are left as
 * they were unless named in `keep` (or `everything`), so they stay failures.
 */
export function acknowledge(english: Bundle, bundles: Readonly<Record<string, Bundle>>, ledger: Ledger, options: AckOptions = {}): Ledger {
  const keep = new Set(options.keep ?? []);
  const only = options.locales ? new Set(options.locales) : null;
  const locales: Record<string, Record<string, string>> = {};

  for (const [locale, bundle] of Object.entries(bundles)) {
    if (locale === 'en') continue;
    const next: Record<string, string> = {};
    const before = ledger.locales[locale] ?? {};
    const skipped = only !== null && !only.has(locale);
    for (const [key, translation] of Object.entries(bundle)) {
      const source = sourceKeyOf(key, english);
      if (source === null) continue;
      const current = ledgerValue(english[source]!, translation);
      const [recEn, recTr] = (before[key] ?? '').split('.');
      const isStale = Boolean(recEn && recTr) && recEn !== shortHash(english[source]!) && recTr === shortHash(translation);
      if (skipped || (isStale && !options.everything && !keep.has(key) && !keep.has(source))) {
        if (before[key]) next[key] = before[key]!;
      } else {
        next[key] = current;
      }
    }
    locales[locale] = next;
  }
  return { version: 1, locales };
}

/** One line per entry, keys sorted, so two sessions' changes merge instead of conflicting. */
export function serializeLedger(ledger: Ledger): string {
  const lines: string[] = ['{', '  "version": 1,', '  "locales": {'];
  const names = Object.keys(ledger.locales).sort();
  names.forEach((locale, i) => {
    lines.push(`    ${JSON.stringify(locale)}: {`);
    const entries = Object.entries(ledger.locales[locale]!).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    entries.forEach(([key, value], j) => {
      lines.push(`      ${JSON.stringify(key)}: ${JSON.stringify(value)}${j < entries.length - 1 ? ',' : ''}`);
    });
    lines.push(`    }${i < names.length - 1 ? ',' : ''}`);
  });
  lines.push('  }', '}', '');
  return lines.join('\n');
}

export const placeholdersOf = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();

// ---------------------------------------------------------------------------
// Drafting

export interface LocaleBrief {
  readonly name: string;
  /** How this language addresses the reader, spells, and sounds — the things a model must be told. */
  readonly style: string;
}

export const LOCALE_BRIEFS: Readonly<Record<string, LocaleBrief>> = {
  es: { name: 'Spanish', style: 'Formal "usted". Full accents, ñ, and opening ¿ and ¡. Plain words an adult reader with little schooling follows.' },
  'pt-BR': { name: 'Brazilian Portuguese', style: 'Address the reader as "você". Brazilian spelling and vocabulary. Full accents.' },
  'zh-CN': { name: 'Simplified Chinese (for Mandarin readers)', style: 'Address the reader as "您". Simplified characters. No space between Chinese and the word "Pam" unless the neighbouring examples use one.' },
  'zh-HK': { name: 'Traditional Chinese in Hong Kong\'s written standard (for Cantonese readers)', style: 'Address the reader as "您". Traditional characters and Hong Kong wording (訊息, 電話號碼, 電郵), standard written Chinese, not colloquial Cantonese spelling.' },
  ru: { name: 'Russian', style: 'Formal "вы". Avoid verb forms that mark the speaker\'s or the reader\'s gender where a neutral phrasing exists.' },
  ar: { name: 'Modern Standard Arabic', style: 'Modern Standard Arabic, right to left. Latin names such as "Pam" stay Latin. Match the neighbouring examples\' way of addressing the reader.' },
};

export interface DraftRequest {
  readonly locale: string;
  /** The keys to translate, with the English now and, if it changed, the English before. */
  readonly items: readonly { key: string; english: string; was?: string; current?: string }[];
  /** Already-translated neighbours (same screen), for terminology and tone. */
  readonly examples: readonly { key: string; english: string; translation: string }[];
}

export function draftPrompt(request: DraftRequest): { system: string; user: string } {
  const brief = LOCALE_BRIEFS[request.locale];
  if (!brief) throw new Error(`No brief for "${request.locale}"`);
  const system = [
    `You translate the interface text of Pam into ${brief.name}. Pam connects people returning to their community with services, mentors and case managers. The words on screen are plain, warm and respectful, written so that someone who has not used a phone in years can follow them (about a fifth-grade reading level).`,
    brief.style,
    'Rules: keep every {placeholder} exactly as written, in a place that reads naturally in the language. Keep the name "Pam" as it is. Never use a word that labels a person by their past or names the justice system: the English avoids them, and so must you. Do not add or remove sentences. Do not translate placeholders or markup. Keep a similar length to the English; if the language needs more room, use fewer words rather than more.',
    'Answer with one JSON object and nothing else: {"<key>": "<translation>", …} with exactly the keys you are given.',
  ].join('\n\n');

  const lines: string[] = [];
  if (request.examples.length) {
    lines.push('Existing translations from the same screens (match their terminology and tone):');
    for (const e of request.examples) lines.push(`${e.key}\n  EN: ${e.english}\n  ${request.locale}: ${e.translation}`);
    lines.push('');
  }
  lines.push('Translate these:');
  for (const item of request.items) {
    lines.push(`${item.key}\n  EN: ${item.english}`);
    if (item.was !== undefined) lines.push(`  (the English used to be: ${item.was})`);
    if (item.current !== undefined) lines.push(`  (the current ${request.locale} says: ${item.current} — update it to match the new English)`);
  }
  return { system, user: lines.join('\n') };
}

export interface DraftResult {
  readonly accepted: Readonly<Record<string, string>>;
  readonly rejected: readonly { key: string; reason: string }[];
}

/** Checks what a model sent back against what was asked. Nothing unchecked reaches a file. */
export function parseDrafts(expected: readonly { key: string; english: string }[], response: string): DraftResult {
  const start = response.indexOf('{');
  const end = response.lastIndexOf('}');
  let parsed: Record<string, unknown> = {};
  if (start >= 0 && end > start) {
    try {
      parsed = JSON.parse(response.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  }
  const accepted: Record<string, string> = {};
  const rejected: { key: string; reason: string }[] = [];
  for (const { key, english } of expected) {
    const value = parsed[key];
    if (typeof value !== 'string' || value.trim() === '') {
      rejected.push({ key, reason: 'missing from the answer' });
      continue;
    }
    if (placeholdersOf(value).join() !== placeholdersOf(english).join()) {
      rejected.push({ key, reason: `placeholders differ: wanted {${placeholdersOf(english).join('}, {')}}` });
      continue;
    }
    if (value.length > english.length * 3 + 20) {
      rejected.push({ key, reason: 'far longer than the English' });
      continue;
    }
    if (/<\/?[a-z][^>]*>/i.test(value) && !/<\/?[a-z][^>]*>/i.test(english)) {
      rejected.push({ key, reason: 'adds markup' });
      continue;
    }
    accepted[key] = value.trim();
  }
  return { accepted, rejected };
}

export interface DraftProvider {
  (system: string, user: string): Promise<string>;
}

/** Asks for drafts, in batches, and keeps only what passes the checks. */
export async function draftLocale(
  provider: DraftProvider,
  request: DraftRequest,
  batchSize = 30,
): Promise<DraftResult> {
  const accepted: Record<string, string> = {};
  const rejected: { key: string; reason: string }[] = [];
  for (let i = 0; i < request.items.length; i += batchSize) {
    const items = request.items.slice(i, i + batchSize);
    const { system, user } = draftPrompt({ ...request, items });
    const answer = await provider(system, user);
    const result = parseDrafts(items, answer);
    Object.assign(accepted, result.accepted);
    rejected.push(...result.rejected);
  }
  return { accepted, rejected };
}
