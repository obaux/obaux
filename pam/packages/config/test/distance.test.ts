import { describe, expect, it } from 'vitest';
import { distanceLabel } from '../src/distance.js';
import { fillTemplate, pickTemplate, type Locale } from '../src/i18n.js';
import { BUNDLES } from './_bundles.js';

const en = BUNDLES.en;

/** The app's own path: the label's key and variables through `pickTemplate`. */
function render(miles: number, locale: Locale = 'en'): string | null {
  const label = distanceLabel(miles, locale);
  if (!label) return null;
  return fillTemplate(pickTemplate(locale, BUNDLES[locale], en, label.key, label.vars), label.vars);
}

describe('distanceLabel', () => {
  it('never shows a floating-point artifact', () => {
    // The bug this was written for: 3 * 0.6 is 1.7999999999999998, and it
    // reached a member-facing card verbatim.
    expect(render(3 * 0.6)).toBe('1.8 miles');
    expect(render(0.1 + 0.2)).toBe('0.3 miles');
  });

  it('agrees with itself about the number and the plural', () => {
    expect(render(1)).toBe('1 mile');
    expect(render(1.04)).toBe('1 mile');
    expect(render(1.05)).toBe('1.1 miles');
    expect(render(2)).toBe('2 miles');
    expect(render(0.6)).toBe('0.6 miles');
  });

  it('will not claim precision a GPS fix does not have', () => {
    expect(render(0.02)).toBe('Less than 0.1 miles');
    expect(render(0)).toBe('Less than 0.1 miles');
  });

  it('says nothing rather than something wrong', () => {
    expect(distanceLabel(Number.NaN)).toBeNull();
    expect(distanceLabel(Number.POSITIVE_INFINITY)).toBeNull();
    expect(distanceLabel(-1)).toBeNull();
  });

  it('speaks Spanish in Spanish, decimal comma and all', () => {
    expect(render(3 * 0.6, 'es')).toBe('1,8 millas');
    expect(render(1, 'es')).toBe('1 milla');
  });

  it('speaks Portuguese the Brazilian way: decimal comma, and 1 to 1.99 is singular', () => {
    expect(render(1, 'pt-BR')).toBe('1 milha');
    expect(render(3 * 0.6, 'pt-BR')).toBe('1,8 milha');
    expect(render(2, 'pt-BR')).toBe('2 milhas');
    expect(render(0.02, 'pt-BR')).toBe('Menos de 0,1 milha');
  });

  it('says the distance the way Russian counts: 1 миля, 2 мили, 5 миль, 21 миля', () => {
    expect([1, 2, 3, 5, 11, 21, 22, 100].map((m) => render(m, 'ru'))).toEqual([
      '1 миля', '2 мили', '3 мили', '5 миль', '11 миль', '21 миля', '22 мили', '100 миль',
    ]);
    expect(render(1.5, 'ru')).toBe('1,5 мили'); // a fraction takes the genitive singular
    expect(render(3 * 0.6, 'ru')).toBe('1,8 мили');
  });

  it('says it the way Arabic counts: a dual for two, a plural for 3 to 10, a singular after', () => {
    expect(render(2, 'ar')).toBe('2 ميلان');
    expect(render(3, 'ar')).toBe('3 أميال');
    expect(render(5, 'ar')).toBe('5 أميال');
    expect(render(11, 'ar')).toBe('11 ميلا');
    expect(render(100, 'ar')).toBe('100 ميل');
  });

  it('writes Arabic distances with Western digits, like every number Pam writes in a sentence', () => {
    expect(render(3 * 0.6, 'ar')).toMatch(/^1\.8 /);
  });

  it('needs no plural forms in Chinese', () => {
    expect(render(1, 'zh-CN')).toBe('1英里');
    expect(render(21, 'zh-HK')).toBe('21英哩');
  });
});
