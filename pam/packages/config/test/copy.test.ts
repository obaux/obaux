import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  findDignityViolations,
  assertCopyIsDignified,
  DignityViolationError,
  fleschKincaidGrade,
  READABILITY_TARGET_GRADE,
} from '../src/language.js';
import { PLURAL_CATEGORIES_REQUIRED, SUPPORTED_LOCALES } from '../src/i18n.js';
import { TRANSPARENCY_GROUPS, TRANSPARENCY_I18N_KEYS, TRANSPARENCY_SCREEN } from '../src/transparency.js';
import { CATEGORY_LIST, CATEGORIES } from '../src/categories.js';
import { LEVELS, BADGES } from '../src/points.js';
import { BUNDLES, COUNT_KEYS, EN, OTHER_LOCALES, baseKey, isVariant, placeholders } from './_bundles.js';

const en = BUNDLES.en;
const es = BUNDLES.es;
const bundles = BUNDLES;

describe('locale bundles', () => {
  it('exist for every supported language, and for nothing else', () => {
    const dir = fileURLToPath(new URL('../src/locales/', import.meta.url));
    // `ledger.json` is the translation ledger (copy-sync.ts), not a language.
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.json') && f !== 'ledger.json')
      .map((f) => f.replace(/\.json$/, ''));
    expect(files.sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it.each(Object.entries(bundles))('%s has the same keys as English, so no screen falls back mid-flow', (_l, bundle) => {
    const own = Object.keys(bundle).filter((k) => !isVariant(k));
    expect(own.sort()).toEqual(Object.keys(en).sort());
  });

  it.each(Object.entries(bundles))('%s has no empty strings', (_locale, bundle) => {
    const empty = Object.entries(bundle).filter(([, v]) => !v.trim());
    expect(empty).toEqual([]);
  });

  it.each(Object.entries(bundles))('%s never shows justice involvement to a user', (_l, bundle) => {
    expect(findDignityViolations(bundle)).toEqual([]);
  });

  it.each(Object.entries(bundles))('%s keeps placeholders matched with English', (_l, bundle) => {
    for (const [key, value] of Object.entries(bundle)) {
      const source = en[baseKey(key)];
      expect(source, `"${key}" has no English source`).toBeDefined();
      expect(placeholders(value), `placeholders drifted on "${key}"`).toEqual(placeholders(source!));
    }
  });

  it.each(Object.entries(bundles))('%s has no straight double quotes inside a string', (_l, bundle) => {
    expect(Object.entries(bundle).filter(([, v]) => v.includes('"')).map(([k]) => k)).toEqual([]);
  });
});

describe('plural forms', () => {
  it.each(OTHER_LOCALES)('%s writes every plural category for every {count} string, or none', (locale) => {
    const required = PLURAL_CATEGORIES_REQUIRED[locale] ?? [];
    const bundle = BUNDLES[locale];
    for (const key of COUNT_KEYS) {
      for (const category of required) {
        expect(bundle, `${locale} is missing ${key}.${category}`).toHaveProperty(`${key}.${category}`);
      }
    }
    // A language that does not need forms must not carry dead ones.
    if (required.length === 0) expect(Object.keys(bundle).filter(isVariant)).toEqual([]);
  });

  it('knows which languages need forms (the CLDR categories, minus "other")', () => {
    for (const [locale, categories] of Object.entries(PLURAL_CATEGORIES_REQUIRED)) {
      const cldr = new Intl.PluralRules(locale === 'ar' ? 'ar' : locale).resolvedOptions().pluralCategories;
      expect([...categories!].sort()).toEqual(cldr.filter((c) => c !== 'other').sort());
    }
  });
});

describe('every other language is actually translated', () => {
  // Names, brands and badge names Spanish also leaves alone, plus the role label
  // kept short in Portuguese (like English "Super admin" is already a coinage).
  const MAY_MATCH_ENGLISH = new Set(
    Object.keys(EN).filter((k) => EN[k] === es[k] || k.startsWith('badge.') || k.startsWith('language.')),
  );
  MAY_MATCH_ENGLISH.add('directory.filter.super_admin');
  MAY_MATCH_ENGLISH.add('role.super_admin');
  // "Link" is the Brazilian word for a link (the bundle says "Link aberto" too).
  MAY_MATCH_ENGLISH.add('messages.files.link');

  it.each(OTHER_LOCALES)('%s differs from English except where a name or a symbol should not change', (locale) => {
    const same = Object.keys(EN).filter((k) => BUNDLES[locale][k] === EN[k] && /[A-Za-z]{3}/.test(EN[k]!));
    expect(same.filter((k) => !MAY_MATCH_ENGLISH.has(k))).toEqual([]);
  });

  const SCRIPTS: Partial<Record<(typeof OTHER_LOCALES)[number], RegExp>> = {
    'zh-CN': /[\u4e00-\u9fff]/,
    'zh-HK': /[\u4e00-\u9fff]/,
    ru: /[\u0400-\u04ff]/,
    ar: /[\u0600-\u06ff]/,
  };
  it.each(Object.entries(SCRIPTS))('%s is written in its own script', (locale, script) => {
    const bundle = BUNDLES[locale as keyof typeof BUNDLES];
    const lacking = Object.keys(EN).filter(
      (k) => /[A-Za-z]{3}/.test(EN[k]!) && !MAY_MATCH_ENGLISH.has(k) && !script.test(bundle[k]!),
    );
    expect(lacking).toEqual([]);
  });

  it('keeps Spanish punctuation and letters out of Portuguese, and Portuguese letters out of Spanish', () => {
    const spanishMarks = Object.entries(BUNDLES['pt-BR']).filter(([k, v]) => /[ñ¿¡]/.test(v) && !MAY_MATCH_ENGLISH.has(k));
    expect(spanishMarks.map(([k]) => k)).toEqual([]);
    const portugueseMarks = Object.entries(BUNDLES.es).filter(([, v]) => /[ãõ]/.test(v));
    expect(portugueseMarks.map(([k]) => k)).toEqual([]);
  });

  it('does not put English where Spanish or Portuguese belong', () => {
    for (const locale of ['es', 'pt-BR'] as const) {
      const leaked = Object.entries(BUNDLES[locale]).filter(
        ([k, v]) => !MAY_MATCH_ENGLISH.has(k) && k !== 'trips.booked.sms' && /\b(the|your|you|with)\b/i.test(v),
      );
      expect(leaked.map(([k]) => k), locale).toEqual([]);
    }
  });
});

describe('dignity rules (SOP §0)', () => {
  it.each([
    'Welcome back, ex-offender',
    'Your conviction record',
    'Programs for formerly incarcerated people',
    'inmate services',
  ])('rejects %j', (text) => {
    expect(() => assertCopyIsDignified(text, 'test')).toThrow(DignityViolationError);
  });

  it('allows ordinary plain-language copy', () => {
    expect(() => assertCopyIsDignified('Find a place that can help.', 'test')).not.toThrow();
  });
});

describe('readability (SOP §14)', () => {
  /**
   * Reported, not enforced. The heuristic is rough on proper nouns and the SOP
   * asks for a readability *check*, not a gate — a failing build over one long
   * street name would be noise. A key well over target is a signal to rewrite.
   */
  it('reports English strings above the grade-5 target', () => {
    const over = Object.entries(en)
      .filter(([, v]) => v.split(/\s+/).length >= 6)
      .map(([k, v]) => [k, Number(fleschKincaidGrade(v).toFixed(1))] as const)
      .filter(([, g]) => g > READABILITY_TARGET_GRADE)
      .sort((a, b) => b[1] - a[1]);

    if (over.length > 0) {
      console.warn(
        `\n  ${over.length} string(s) above grade ${READABILITY_TARGET_GRADE}:\n` +
          over.map(([k, g]) => `    ${g}  ${k}`).join('\n'),
      );
    }
    // The median string must be at or under target; outliers are surfaced above.
    const grades = Object.values(en)
      .filter((v) => v.split(/\s+/).length >= 6)
      .map((v) => fleschKincaidGrade(v))
      .sort((a, b) => a - b);
    const median = grades[Math.floor(grades.length / 2)]!;
    expect(median).toBeLessThanOrEqual(READABILITY_TARGET_GRADE + 1);
  });
});

describe('transparency screen (SOP §4.1)', () => {
  it('has every key translated in every language', () => {
    for (const key of TRANSPARENCY_I18N_KEYS) {
      for (const [locale, bundle] of Object.entries(bundles)) {
        expect(bundle, `${locale} is missing ${key}`).toHaveProperty(key);
      }
    }
  });

  it('keeps the English source in transparency.ts identical to en.json', () => {
    // The SOP requires this screen match §4.1 word for word. Two copies of the
    // text would drift; this asserts they cannot.
    const bundle = en as Record<string, string>;
    expect(bundle[TRANSPARENCY_SCREEN.titleKey]).toBe(TRANSPARENCY_SCREEN.title);
    expect(bundle[TRANSPARENCY_SCREEN.confirmKey]).toBe(TRANSPARENCY_SCREEN.confirm);
    expect(bundle[TRANSPARENCY_SCREEN.footerKey]).toBe(TRANSPARENCY_SCREEN.footer);
    for (const line of [...TRANSPARENCY_SCREEN.canSee, ...TRANSPARENCY_SCREEN.cannotSee]) {
      expect(bundle[line.key], `drift on ${line.key}`).toBe(line.en);
    }
  });
});

describe('transparency screen, grouped for reading (D-416)', () => {
  const lines = TRANSPARENCY_SCREEN.canSee.map((l) => l.key);
  const grouped = TRANSPARENCY_GROUPS.flatMap((g) => [...g.keys]);

  it('puts every line of the contract in exactly one group', () => {
    expect([...grouped].sort()).toEqual([...lines].sort());
  });

  it('keeps each group short enough to take in at a glance', () => {
    for (const g of TRANSPARENCY_GROUPS) expect(g.keys.length, g.titleKey).toBeLessThanOrEqual(4);
  });

  it('names every group and every reading aid in both languages', () => {
    for (const g of TRANSPARENCY_GROUPS) {
      expect(en, `en ${g.titleKey}`).toHaveProperty(g.titleKey);
      expect(es, `es ${g.titleKey}`).toHaveProperty(g.titleKey);
    }
    for (const key of ['guide.title', 'guide.body', 'copy.page', 'copy.done', 'copy.failed']) {
      expect(en).toHaveProperty(key);
      expect(es).toHaveProperty(key);
    }
  });

  it('defines "your guide" once, as the person who invited you or a staff member guiding you', () => {
    expect((en as Record<string, string>)['guide.body']).toMatch(/invited you/);
    expect((en as Record<string, string>)['guide.body']).toMatch(/responsible for guiding you/);
  });
});

describe('taxonomy (SOP §2.5)', () => {
  it('has exactly three top-level categories', () => {
    expect(CATEGORIES).toHaveLength(3);
    expect([...CATEGORIES]).toEqual(['education', 'workforce', 'family_services']);
  });

  it('translates every category and subcategory in every language', () => {
    for (const [locale, bundle] of Object.entries(bundles)) {
      for (const category of CATEGORY_LIST) {
        expect(bundle, `${locale} missing ${category.labelKey}`).toHaveProperty(category.labelKey);
        for (const s of category.subcategories) {
          expect(bundle, `${locale} missing ${s.labelKey}`).toHaveProperty(s.labelKey);
        }
      }
    }
  });

  it('gives each category a distinct pin colour', () => {
    const colours = CATEGORY_LIST.map((c) => c.colorToken);
    expect(new Set(colours).size).toBe(colours.length);
  });

  it('has no duplicate subcategory keys across categories', () => {
    const all = CATEGORY_LIST.flatMap((c) => c.subcategories.map((s) => s.key));
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('levels and badges (SOP §8)', () => {
  it('translates every level and badge in every language', () => {
    for (const [locale, bundle] of Object.entries(bundles)) {
      for (const { labelKey } of [...LEVELS, ...BADGES]) {
        expect(bundle, `${locale} missing ${labelKey}`).toHaveProperty(labelKey);
      }
    }
  });
});
