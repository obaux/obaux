import { describe, expect, it } from 'vitest';
import { SEARCH_GAPS, SEARCH_PHRASES, unknownSlugs } from '../src/content/search-phrases';

describe('search phrases (Sage writes them, Wren matches them)', () => {
  it('names only posts that exist', () => {
    expect(unknownSlugs()).toEqual([]);
  });
  it('says what each missing post needs', () => {
    for (const p of SEARCH_PHRASES.filter((x) => x.answer === null)) expect(p.gap, p.phrase).toBeTruthy();
  });
  it('lists each phrase once', () => {
    const seen = SEARCH_PHRASES.map((p) => p.phrase);
    expect(new Set(seen).size).toBe(seen.length);
  });
  it('has gaps to write, and answers for most', () => {
    expect(SEARCH_GAPS.length).toBeGreaterThan(0);
    expect(SEARCH_GAPS.length).toBeLessThan(SEARCH_PHRASES.length);
  });
});
