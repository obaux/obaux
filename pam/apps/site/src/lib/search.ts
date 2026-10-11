import type { SupportPost } from '../content/posts';
import { SEARCH_PHRASES, type SearchPhrase } from '../content/search-phrases';

/**
 * Support search, done in the page: no server, no index to build. A person types
 * what happened to them ("why is this happening", "my code did not come"), so the
 * search cannot ask for every word to be in a post.
 *
 * 1. The query is cut into words, the small ones are dropped (why, is, this, my,
 *    the ...), and what is left is lightly stemmed so "texts" finds "text" and
 *    "happening" finds "happen".
 * 2. A post scores for each remaining word it contains, most for the title, then
 *    its keywords, then its summary. A known phrase (`content/search-phrases.ts`)
 *    that the query says, or is part of, scores far above that, so a phrase Sage
 *    mapped to a post puts that post first.
 * 3. Posts are ranked by score; any post that scores at all is a result.
 *
 * A phrase mapped to `null` is a known gap: `gap` is set so the page can say, in
 * plain words, that there is no article for that yet.
 */
const STOP = new Set(
  (
    'a an and are as at be but by can could did do does for from get got has have how i if in is it its ' +
    'me my of on or our should so that the their them then there these they this to us was we were what ' +
    'when where which who why will with would you your'
  ).split(' '),
);

/** Lower-case words, punctuation gone. */
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** A light stem: enough to treat texts/text and happening/happen as one word. */
export function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  return w;
}

/** The words that carry meaning, stemmed. If every word was small, keep them all rather than search for nothing. */
export function contentStems(text: string): string[] {
  const all = words(text);
  const kept = all.filter((w) => !STOP.has(w));
  return [...new Set((kept.length ? kept : all).map(stem))];
}

function hasStem(haystack: readonly string[], s: string): boolean {
  // `s + 'e'` so "com" (from coming) finds "come"; a prefix only counts from four letters, so a short stem is not everything
  return haystack.some((h) => h === s || h === `${s}e` || (s.length >= 4 && h.startsWith(s)));
}

const PHRASE_STEMS = SEARCH_PHRASES.map((p) => ({ p, stems: contentStems(p.phrase) }));

/** How strongly the query is the phrase: 1 when one contains the other, else the share of the phrase's words it says. */
function phraseOverlap(query: readonly string[], phrase: readonly string[]): number {
  if (!query.length || !phrase.length) return 0;
  const inQuery = phrase.filter((s) => hasStem(query, s)).length;
  const inPhrase = query.filter((s) => hasStem(phrase, s)).length;
  if (inQuery === phrase.length || inPhrase === query.length) return 1;
  return inQuery / phrase.length;
}

const PHRASE_MIN = 0.6;

export interface SearchResult {
  readonly posts: readonly SupportPost[];
  /** Set when the query is a known question with no post yet. */
  readonly gap: SearchPhrase | null;
}

export function search(
  posts: readonly SupportPost[],
  query: string,
  phrases: readonly { p: SearchPhrase; stems: string[] }[] = PHRASE_STEMS,
): SearchResult {
  const q = contentStems(query);
  if (!q.length) return { posts: [], gap: null };

  const phraseScore = new Map<string, number>();
  let gap: SearchPhrase | null = null;
  let gapScore = 0;
  for (const { p, stems } of phrases) {
    const overlap = phraseOverlap(q, stems);
    if (overlap < PHRASE_MIN) continue;
    const s = 100 * overlap;
    if (p.post) phraseScore.set(p.post, Math.max(phraseScore.get(p.post) ?? 0, s));
    else if (s > gapScore) {
      gap = p;
      gapScore = s;
    }
  }

  const scored = posts.map((post, order) => {
    const title = contentStems(post.title);
    const summary = contentStems(post.summary);
    const keyStems = post.keywords.map((k) => contentStems(k));
    let score = phraseScore.get(post.slug) ?? 0;
    for (const s of q) {
      if (hasStem(title, s)) score += 10;
      if (keyStems.some((k) => hasStem(k, s))) score += 5;
      if (hasStem(summary, s)) score += 1;
    }
    // a whole keyword the person said, in full ("sign in", "quiet hours")
    for (const k of keyStems) if (k.length > 1 && k.every((s) => hasStem(q, s))) score += 8;
    return { post, score, order };
  });

  const found = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((x) => x.post);

  // a phrase that maps to a post wins over a gap that only partly matches
  if (gap && phraseScore.size && Math.max(...phraseScore.values()) >= gapScore) gap = null;
  return { posts: found, gap };
}
