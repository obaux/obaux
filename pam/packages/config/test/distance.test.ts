import { describe, expect, it } from 'vitest';
import { distanceLabel } from '../src/distance.js';
import en from '../src/locales/en.json' with { type: 'json' };
import es from '../src/locales/es.json' with { type: 'json' };

const BUNDLES: Record<string, Record<string, string>> = { en, es };

function render(miles: number, locale: 'en' | 'es' = 'en'): string | null {
  const label = distanceLabel(miles, locale);
  if (!label) return null;
  return BUNDLES[locale][label.key].replace('{count}', label.vars.count);
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
});
