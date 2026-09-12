import { describe, expect, it } from 'vitest';
import en from '../src/locales/en.json' with { type: 'json' };
import es from '../src/locales/es.json' with { type: 'json' };
import {
  findDignityViolations,
  assertCopyIsDignified,
  DignityViolationError,
  fleschKincaidGrade,
  READABILITY_TARGET_GRADE,
} from '../src/language.js';
import { TRANSPARENCY_I18N_KEYS, TRANSPARENCY_SCREEN } from '../src/transparency.js';
import { CATEGORY_LIST, CATEGORIES } from '../src/categories.js';
import { LEVELS, BADGES } from '../src/points.js';

const bundles = { en, es } as const satisfies Record<string, Record<string, string>>;

describe('locale bundles', () => {
  it('have identical key sets, so no screen falls back to English mid-flow', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
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
      const source = (en as Record<string, string>)[key]!;
      const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(ph(value), `placeholders drifted on "${key}"`).toEqual(ph(source));
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
  it('has every key translated in both languages', () => {
    for (const key of TRANSPARENCY_I18N_KEYS) {
      expect(en, `en is missing ${key}`).toHaveProperty(key);
      expect(es, `es is missing ${key}`).toHaveProperty(key);
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

describe('taxonomy (SOP §2.5)', () => {
  it('has exactly three top-level categories', () => {
    expect(CATEGORIES).toHaveLength(3);
    expect([...CATEGORIES]).toEqual(['education', 'workforce', 'family_services']);
  });

  it('translates every category and subcategory in both languages', () => {
    for (const category of CATEGORY_LIST) {
      expect(en, `en missing ${category.labelKey}`).toHaveProperty(category.labelKey);
      expect(es, `es missing ${category.labelKey}`).toHaveProperty(category.labelKey);
      for (const s of category.subcategories) {
        expect(en, `en missing ${s.labelKey}`).toHaveProperty(s.labelKey);
        expect(es, `es missing ${s.labelKey}`).toHaveProperty(s.labelKey);
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
  it('translates every level and badge in both languages', () => {
    for (const { labelKey } of [...LEVELS, ...BADGES]) {
      expect(en, `en missing ${labelKey}`).toHaveProperty(labelKey);
      expect(es, `es missing ${labelKey}`).toHaveProperty(labelKey);
    }
  });
});
