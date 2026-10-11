import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POSTS } from '../src/content/posts';
import { SEARCH_PHRASES } from '../src/content/search-phrases';
import { contentStems, search } from '../src/lib/search';

const find = (q: string) => search(POSTS, q);
const GAPS = join(__dirname, '../../../docs/help-centre-gaps.md');

describe('search takes a person’s own words', () => {
  it('drops the small words and keeps the ones that carry meaning', () => {
    expect(contentStems('why is this happening')).toEqual(['happen']);
    expect(contentStems('Why is my text not coming?')).toEqual(['text', 'not', 'com']);
  });

  it('still finds a post when only some of the typed words are in it', () => {
    // every-word matching found nothing for this
    expect(find('why did my text code not come').posts.length).toBeGreaterThan(0);
    expect(find('who is my guide').posts[0]?.slug).toBe('who-is-my-guide');
  });

  it('finds the plural for the singular and the other way round', () => {
    expect(find('texts').posts.map((p) => p.slug)).toContain('texts-from-pam');
    expect(find('policy').posts.map((p) => p.slug)).toContain('signing-a-programs-rules');
  });

  it('ranks the title above the keywords above the summary', () => {
    const first = find('rules').posts[0];
    expect(first?.slug).toBe('signing-a-programs-rules');
  });

  it('returns nothing, not everything, for a query of only small words that no post says', () => {
    expect(find('zzzz qqqq').posts).toEqual([]);
  });
});

describe('every use case in search-phrases.ts', () => {
  const slugs = new Set(POSTS.map((p) => p.slug));
  const gapsDoc = (() => {
    try {
      return readFileSync(GAPS, 'utf8').toLowerCase();
    } catch {
      return '';
    }
  })();

  it('names a post that exists, or none', () => {
    for (const p of SEARCH_PHRASES) if (p.post !== null) expect(slugs.has(p.post), `${p.phrase}: no post "${p.post}"`).toBe(true);
  });

  it('finds its post first', () => {
    for (const p of SEARCH_PHRASES) {
      if (p.post === null) continue;
      expect(find(p.phrase).posts[0]?.slug, `“${p.phrase}” should find ${p.post} first`).toBe(p.post);
    }
  });

  it('with no post yet, is told so, not silently empty', () => {
    for (const p of SEARCH_PHRASES) {
      if (p.post !== null) continue;
      expect(find(p.phrase).gap?.phrase, `“${p.phrase}” should be a known gap`).toBe(p.phrase);
    }
  });

  it('with no post yet, is written down in docs/help-centre-gaps.md', () => {
    for (const p of SEARCH_PHRASES) if (p.post === null) expect(gapsDoc.includes(p.phrase.toLowerCase()), `“${p.phrase}” missing from help-centre-gaps.md`).toBe(true);
  });

  it('has no phrase twice', () => {
    const seen = new Set<string>();
    for (const p of SEARCH_PHRASES) {
      const k = p.phrase.toLowerCase().trim();
      expect(seen.has(k), `duplicate phrase “${p.phrase}”`).toBe(false);
      seen.add(k);
    }
  });
});
