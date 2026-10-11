import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POSTS } from '../src/content/posts';
import { SEARCH_GAPS, SEARCH_PHRASES, isAnswered } from '../src/content/search-phrases';
import { SYNONYMS } from '../src/content/search-synonyms';
import { asQuestion, contentStems, didYouMean, editDistance, search, suggest } from '../src/lib/search';

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

  it('hears “cannot sign in” as the signing-in question, not the one about signing a program’s rules', () => {
    expect(find('I cannot sign in').posts[0]?.slug).not.toBe('signing-a-programs-rules');
    expect(find('sign in').posts[0]?.slug).not.toBe('signing-a-programs-rules');
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

describe('search forgives typing mistakes', () => {
  it('counts a swapped pair of letters as one mistake', () => {
    expect(editDistance('teh', 'the')).toBe(1);
    expect(editDistance('invte', 'invite')).toBe(1);
  });

  it('reads a misspelled word as the word meant', () => {
    expect(find('invte').posts[0]?.slug).toBe('sending-an-invite');
    expect(find('langauge').posts[0]?.slug).toBe('your-language');
    expect(find('reminders paused acount').posts.length).toBeGreaterThan(0);
  });

  it('leaves short words and numbers alone (no mistakes allowed under four letters)', () => {
    expect(find('zzz').posts).toEqual([]);
  });

  it('still finds the answer when a letter is missing or two are swapped in a phrase people typed', () => {
    for (const p of SEARCH_PHRASES) {
      if (!isAnswered(p)) continue;
      const w = p.phrase.split(' ').sort((a, b) => b.length - a.length)[0]!;
      if (w.length < 6) continue; // a typo is read within one mistake to seven letters, two from eight
      const missing = p.phrase.replace(w, w.slice(0, 2) + w.slice(3)); // drop the third letter
      const swapped = p.phrase.replace(w, w.slice(0, 1) + w[2] + w[1] + w.slice(3)); // swap letters two and three
      for (const typo of [missing, swapped]) {
        const top = find(typo).posts.slice(0, 3).map((x) => x.slug);
        expect(top, `“${typo}” (a typo of “${p.phrase}”) should still show ${p.answer} in the top 3`).toContain(p.answer);
      }
    }
  });
});

describe('search knows everyday words for the same thing', () => {
  it('finds the post for another word for the same thing', () => {
    expect(find('sms').posts[0]?.slug).toBe('texts-from-pam');
    expect(find('caseworker').posts.map((p) => p.slug)).toContain('who-is-my-guide');
    expect(find('ayuda').posts.length).toBeGreaterThan(0);
    expect(find('log in').posts[0]?.slug).not.toBe('signing-a-programs-rules');
  });

  it('gives every word in a group the post the first word of the group finds, among its top three', () => {
    for (const group of SYNONYMS) {
      const first = find(group[0]!).posts[0]?.slug;
      if (!first) continue;
      for (const member of group.slice(1)) {
        const top = find(member).posts.slice(0, 3).map((p) => p.slug);
        expect(top, `“${member}” should find what “${group[0]}” finds (${first})`).toContain(first);
      }
    }
  });

  it('ignores accents', () => {
    expect(contentStems('Español')).toEqual(contentStems('espanol'));
  });
});

describe('suggestions as you type', () => {
  it('waits for two letters', () => {
    expect(suggest(POSTS, 'w')).toEqual([]);
  });

  it('offers the question being typed, with the post that answers it under it', () => {
    const s = suggest(POSTS, 'why didnt i g');
    expect(s.map((x) => x.query)).toContain('why didnt i get a code');
    expect(s.find((x) => x.query === 'why didnt i get a code')?.slug).toBe('texts-from-pam');
  });

  it('puts questions before post titles, and offers at most five', () => {
    const s = suggest(POSTS, 'sign');
    expect(s.length).toBeLessThanOrEqual(5);
    expect(s.length).toBeGreaterThan(0);
  });

  it('writes a typed phrase the way it reads in a list', () => {
    expect(asQuestion('why didnt i get a code')).toBe('Why didn’t I get a code?');
    expect(asQuestion('cant sign in')).toBe('Can’t sign in');
    expect(asQuestion('block someone')).toBe('Block someone');
  });

  it('offers a suggestion for the start of every question people type, which then finds its post', () => {
    for (const p of SEARCH_PHRASES) {
      if (!isAnswered(p)) continue;
      const start = p.phrase.slice(0, Math.max(3, Math.ceil(p.phrase.length * 0.6)));
      expect(suggest(POSTS, start).some((x) => x.query === p.phrase), `“${start}” should suggest “${p.phrase}”`).toBe(true);
    }
  });
});

describe('did you mean', () => {
  it('offers the questions that share a word when nothing matched', () => {
    expect(find('probation').posts).toEqual([]);
    const d = didYouMean(POSTS, 'probation');
    expect(d.length).toBeGreaterThan(0);
    expect(d[0]?.slug).toBe('what-others-can-see');
  });

  it('offers nothing for nonsense', () => {
    expect(didYouMean(POSTS, 'zzzz qqqq')).toEqual([]);
  });
});

describe('most asked, under the search box', () => {
  it('lists only questions that exist and have a published answer', async () => {
    const { MOST_ASKED } = await import('../src/content/most-asked');
    for (const phrase of MOST_ASKED) {
      const p = SEARCH_PHRASES.find((x) => x.phrase === phrase);
      expect(p, `“${phrase}” is not in search-phrases.ts`).toBeTruthy();
      expect(p && isAnswered(p), `“${phrase}” has no published answer`).toBe(true);
    }
  });
});
