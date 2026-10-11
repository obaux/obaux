import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POSTS } from '../src/content/posts';
import { SEARCH_GAPS, SEARCH_PHRASES, isAnswered } from '../src/content/search-phrases';
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

  it('returns nothing, not everything, for words no post says', () => {
    expect(find('zzzz qqqq').posts).toEqual([]);
  });
});

describe('every use case in search-phrases.ts, through the real search', () => {
  const gapsDoc = (() => {
    try {
      return readFileSync(GAPS, 'utf8').toLowerCase();
    } catch {
      return '';
    }
  })();

  it('finds the answering post first, or within the top three when other posts are fine too', () => {
    for (const p of SEARCH_PHRASES) {
      if (!isAnswered(p)) continue;
      const slugs = find(p.phrase).posts.map((x) => x.slug);
      if (p.also?.length) expect(slugs.slice(0, 3), `“${p.phrase}” should show ${p.answer} in the top 3`).toContain(p.answer);
      else expect(slugs[0], `“${p.phrase}” should find ${p.answer} first`).toBe(p.answer);
    }
  });

  it('with no published post, is told so, not silently empty', () => {
    for (const p of SEARCH_GAPS) expect(find(p.phrase).gap?.phrase, `“${p.phrase}” should be a known gap`).toBe(p.phrase);
  });

  it('with no published post, is written down in docs/help-centre-gaps.md', () => {
    for (const p of SEARCH_GAPS) expect(gapsDoc.includes(p.phrase.toLowerCase()), `“${p.phrase}” missing from help-centre-gaps.md`).toBe(true);
  });
});
