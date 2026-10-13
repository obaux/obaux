import { describe, expect, it } from 'vitest';
import { EVERYDAY_WORDS } from '../src/content/everyday-words';

describe('everyday words (Sage writes them, Wren searches with them)', () => {
  it('puts each word in one group only', () => {
    const seen = new Map<string, number>();
    EVERYDAY_WORDS.forEach((g, i) =>
      g.words.forEach((w) => {
        const k = w.toLowerCase();
        expect(seen.has(k), `"${w}" is in group ${seen.get(k)} and group ${i}`).toBe(false);
        seen.set(k, i);
      }),
    );
  });
  it('writes every word in lower case, with no spare spaces', () => {
    for (const g of EVERYDAY_WORDS) for (const w of g.words) expect(w, w).toBe(w.toLowerCase().trim());
  });
  it('gives every group at least two words', () => {
    for (const g of EVERYDAY_WORDS) expect(g.words.length, g.words[0]).toBeGreaterThan(1);
  });
});
