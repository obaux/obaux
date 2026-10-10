import { describe, expect, it } from 'vitest';
import { BUNDLES } from './_bundles.js';

/**
 * A planned visit has one name in each language, the one on the tab (`tab.trips`): Visitas, Visitas, 预约, 到訪,
 * Визиты, الزيارات. Spanish once said "viaje" in sixteen strings beside a tab that said "Visitas" (10 October, D-480),
 * and a person cannot tell that a "viaje" is what the tab holds. The words a language must not use for it:
 */
const NOT_A_TRIP: Readonly<Record<string, RegExp>> = {
  es: /viaj/i,
  'pt-BR': /viage/i,
  'zh-CN': /行程|旅程|旅行/,
  'zh-HK': /旅程|旅行/, // 行程 stays in the glossary's definition of 到訪, which needs another word to say it
  ru: /поездк|путешеств/i,
  ar: /(?<![\u0621-\u064A])(ال|ب|ل|و|ف)?(رحلة|رحلات)/, // not "مرحلة" (a stage)
};

// "Getting around" is transport, not a visit.
const NOT_ABOUT_VISITS = new Set(['category.sub.transportation']);

describe('one word for a planned visit in each language (D-480)', () => {
  it.each(Object.entries(NOT_A_TRIP))('%s uses the tab\'s word, not another', (locale, banned) => {
    const bundle = BUNDLES[locale as keyof typeof BUNDLES];
    const said = Object.entries(bundle)
      .filter(([key, words]) => !NOT_ABOUT_VISITS.has(key) && banned.test(words))
      .map(([key, words]) => `${key}: ${words}`);
    expect(said, `${locale}'s Trips tab says "${bundle['tab.trips']}"; say that`).toEqual([]);
  });
});
