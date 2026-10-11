import type { SupportPost } from '../content/posts';
import { SEARCH_PHRASES, isAnswered, type SearchPhrase } from '../content/search-phrases';
import { SYNONYMS } from '../content/search-synonyms';

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
 *    that the query says, or is part of, scores far above that: the phrase's
 *    `answer` post goes first, its `also` posts follow.
 * 3. Posts are ranked by score; any post that scores at all is a result.
 *
 * A phrase with no published post (`answer: null`, or a draft) is a known gap:
 * `gap` is set so the page can say, in plain words, that there is no article for
 * that yet.
 */
const STOP = new Set(
  (
    'a an and are as at be but by can could did do does for from get got has have how i if is it its ' +
    'me my of or our should so that the their them then there these they this to us was we were what ' +
    'when where which who why will with would you your'
  ).split(' '),
);

/** Lower-case words, punctuation gone. */
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents: español = espanol
    .replace(/[’']/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => (w === 'cannot' ? 'cant' : w)); // "cannot" and "can't" are one word to a person
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
const SYN_STEMS = SYNONYMS.map((group) => group.map((m) => contentStems(m)));

/** Edit distance with a swap of two neighbouring letters counted as one mistake (teh = the). */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}

/** How many mistakes a word of this length may have and still be read as the word meant: none under 4 letters, one to 7, two from 8. */
function allowance(len: number): number {
  return len < 4 ? 0 : len < 8 ? 1 : 2;
}

/** Every word the site knows, with how much it weighs (a title word more than a summary word): the dictionary a typo is corrected against. */
function buildDictionary(posts: readonly SupportPost[]): Dictionary {
  const dict: Dictionary = new Map<string, number>();
  const add = (text: string, w: number) => {
    for (const s of contentStems(text)) dict.set(s, Math.max(dict.get(s) ?? 0, w));
    // the words as written too: a typo can break the ending ("sining" for "signing") so it has to be corrected before it is stemmed
    for (const r of words(text)) if (!STOP.has(r)) dict.set(`~${r}`, Math.max(dict.get(`~${r}`) ?? 0, w));
  };
  for (const post of posts) {
    add(post.title, 3);
    for (const k of post.keywords) add(k, 2);
    add(post.summary, 1);
  }
  for (const { p, stems } of PHRASE_STEMS) {
    add(p.phrase, 2);
    for (const s of stems) dict.set(s, Math.max(dict.get(s) ?? 0, 2));
  }
  for (const group of SYNONYMS) for (const m of group) add(m, 2);
  return dict;
}

/** Stems, and (with a leading ~) the words as written. */
type Dictionary = Map<string, number>;

const DICT_CACHE = new WeakMap<readonly SupportPost[], Dictionary>();
function dictionaryFor(posts: readonly SupportPost[]): Dictionary {
  let d = DICT_CACHE.get(posts);
  if (!d) {
    d = buildDictionary(posts);
    DICT_CACHE.set(posts, d);
  }
  return d;
}

/** The closest known word within the allowance, or null when the word is known already (or nothing is close enough). `kind` is '' for stems, '~' for words as written. */
function correct(word: string, dict: Dictionary, kind: '' | '~'): string | null {
  if (word.length < 4 || /\d/.test(word)) return null;
  const key = kind + word;
  if (dict.has(key)) return null;
  for (const d of dict.keys()) if (d.startsWith(key)) return null; // a word still being typed
  const k = allowance(word.length);
  let best: string | null = null;
  let bestDist = k + 1;
  let bestWeight = -1;
  for (const [dk, w] of dict) {
    if (kind === '~' ? !dk.startsWith('~') : dk.startsWith('~')) continue;
    const d = kind === '~' ? dk.slice(1) : dk;
    if (Math.abs(d.length - word.length) > k) continue;
    const dist = editDistance(word, d);
    if (dist > k) continue;
    if (dist < bestDist || (dist === bestDist && (w > bestWeight || (w === bestWeight && best !== null && d < best)))) {
      best = d;
      bestDist = dist;
      bestWeight = w;
    }
  }
  return best;
}

export interface Prepared {
  /** What the person typed, as stems. */
  readonly typed: readonly string[];
  /** Typos read as the word meant: typed stem -> known stem. */
  readonly corrections: Readonly<Record<string, string>>;
  /** Other words for the same thing (`search-synonyms.ts`), weaker than what was typed. */
  readonly expansions: readonly string[];
  /** The query said with a group's own word in place of the everyday one ("log in" -> "sign in"), for keywords said in order. */
  readonly altQueries: readonly string[];
}

/** Read a query: its words, the typos corrected, and the everyday words that mean the same. */
export function prepare(posts: readonly SupportPost[], text: string): Prepared {
  const typed = contentStems(text);
  const dict = dictionaryFor(posts);
  const corrections: Record<string, string> = {};
  // first the words as typed, so a broken ending is mended before stemming; then the stems that are still unknown
  for (const w of words(text)) {
    if (STOP.has(w)) continue;
    const sw = stem(w);
    if (!typed.includes(sw) || dict.has(sw) || corrections[sw]) continue;
    const c = correct(w, dict, '~');
    if (c) corrections[sw] = stem(c);
  }
  for (const s of typed) {
    if (corrections[s]) continue;
    const c = correct(s, dict, '');
    if (c) corrections[s] = c;
  }
  const known = [...typed, ...Object.values(corrections)];
  const expansions = new Set<string>();
  const altQueries: string[] = [];
  const raw = words(text).join(' ');
  SYN_STEMS.forEach((group, gi) => {
    const hit = group.some((m) => m.length > 0 && m.every((s) => hasStem(known, s)));
    if (!hit) return;
    // Pam's own word (the first) and the single everyday words widen the search; a longer phrase somebody typed
    // ("text message") would only drag in a second meaning, and Pam's word already says what it means.
    const members = SYNONYMS[gi]!;
    group.forEach((m, mi) => {
      if (mi !== 0 && members[mi]!.trim().includes(' ')) return;
      for (const s of m) if (!hasStem(known, s)) expansions.add(s);
    });
    // "log in" is "sign in" to the post that has the keyword "sign in"
    const pam = words(members[0]!).join(' ');
    for (const member of members.slice(1)) {
      const mw = words(member).join(' ');
      if (mw && ` ${raw} `.includes(` ${mw} `)) altQueries.push(raw.replace(mw, pam));
    }
  });
  return { typed, corrections, expansions: [...expansions], altQueries };
}

/** How much the query and the phrase say the same thing: the share of their words that are shared (1 = the same words). */
function phraseOverlap(query: readonly string[], phrase: readonly string[]): number {
  if (!query.length || !phrase.length) return 0;
  const shared = phrase.filter((s) => hasStem(query, s)).length;
  return shared / (phrase.length + query.length - shared);
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
  const prep = prepare(posts, query);
  // what was meant: each typed word, or the known word it was read as
  const q = prep.typed.map((x) => prep.corrections[x] ?? x);
  if (!q.length) return { posts: [], gap: null };
  const rawQuery = words(query).join(' ');
  // each word and how much it counts: what was typed 1, a typo read as a known word 0.9, an everyday synonym 0.6
  const weighted: [string, number][] = [
    ...prep.typed.map((s): [string, number] => [s, prep.corrections[s] ? 0.3 : 1]),
    ...Object.values(prep.corrections).map((s): [string, number] => [s, 0.9]),
    ...prep.expansions.map((s): [string, number] => [s, 0.6]),
  ];

  const phraseScore = new Map<string, number>();
  const bump = (slug: string, v: number) => phraseScore.set(slug, Math.max(phraseScore.get(slug) ?? 0, v));
  let gap: SearchPhrase | null = null;
  let gapScore = 0;
  let answeredScore = 0;
  for (const { p, stems } of phrases) {
    const overlap = phraseOverlap(q, stems);
    if (overlap < PHRASE_MIN) continue;
    const s = 100 * overlap;
    if (isAnswered(p) && p.answer) {
      bump(p.answer, s);
      answeredScore = Math.max(answeredScore, s);
    } else if (s > gapScore) {
      gap = p;
      gapScore = s;
    }
    // related posts follow the best one (and follow a gap's "these may be close")
    for (const slug of p.also ?? []) bump(slug, s * 0.6);
  }

  const scored = posts.map((post, order) => {
    const title = contentStems(post.title);
    const summary = contentStems(post.summary);
    const keyStems = post.keywords.map((k) => contentStems(k));
    let score = phraseScore.get(post.slug) ?? 0;
    for (const [s, w] of weighted) {
      if (hasStem(title, s)) score += 10 * w;
      if (keyStems.some((k) => hasStem(k, s))) score += 5 * w;
      if (hasStem(summary, s)) score += 1 * w;
    }
    // a whole keyword the person said, in full ("sign in", "quiet hours")
    for (const k of keyStems) if (k.length > 1 && k.every((s) => hasStem(q, s))) score += 8;
    // ...and a keyword of two or more words said in that order, small words and all: "sign in" is joining, not signing
    for (const k of post.keywords) {
      const kw = words(k).join(' ');
      if (!kw.includes(' ')) continue;
      if (` ${rawQuery} `.includes(` ${kw} `)) score += 12;
      else if (prep.altQueries.some((a) => ` ${a} `.includes(` ${kw} `))) score += 8;
    }
    return { post, score, order };
  });

  const found = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((x) => x.post);

  // a phrase that maps to a post wins over a gap that only partly matches
  if (gap && answeredScore >= gapScore) gap = null;
  return { posts: found, gap };
}

const QUESTION_START = /^(why|how|what|who|where|when|is|are|does|do|can|will|should|which)\b/;

const APOSTROPHES: Record<string, string> = {
  didnt: 'didn’t', dont: 'don’t', doesnt: 'doesn’t', cant: 'can’t', wont: 'won’t', isnt: 'isn’t', arent: 'aren’t', wasnt: 'wasn’t',
  couldnt: 'couldn’t', shouldnt: 'shouldn’t', wouldnt: 'wouldn’t', havent: 'haven’t', hasnt: 'hasn’t', im: 'I’m', ive: 'I’ve',
  whats: 'what’s', thats: 'that’s', theres: 'there’s', youre: 'you’re', theyre: 'they’re', i: 'I',
};

/** A phrase as it reads in a list: apostrophes back, a capital, and a question mark when it is a question. People type "why didnt i get a code"; the list shows "Why didn’t I get a code?". */
export function asQuestion(phrase: string): string {
  const p = phrase.trim();
  const fixed = p.replace(/[A-Za-z]+/g, (w) => APOSTROPHES[w.toLowerCase()] ?? w);
  const text = fixed.charAt(0).toUpperCase() + fixed.slice(1);
  return QUESTION_START.test(p) && !/[?.!]$/.test(p) ? `${text}?` : text;
}

export interface Suggestion {
  /** Stable id for the list. */
  readonly id: string;
  /** What the row says: a likely question, or a post's title. */
  readonly label: string;
  /** Under it: the post that answers. */
  readonly description: string;
  /** The words to search for when it is chosen. */
  readonly query: string;
  readonly slug: string;
}

/**
 * Likely questions, as you type: from two letters, the known questions (and post titles)
 * that start the way you are typing. Every word but the last must be a word of the
 * question (or its typo-corrected or everyday synonym); the last may be only the first
 * letters of one. Questions come before titles.
 */
export function suggest(posts: readonly SupportPost[], text: string, max = 5): Suggestion[] {
  const t = text.trim();
  if (t.replace(/\s/g, '').length < 2) return [];
  const rawWords = words(t);
  if (!rawWords.length) return [];
  const typedRaw = rawWords.join(' ');
  const last = rawWords[rawWords.length - 1]!;
  // the words already finished, small ones left out: "how do i" has none, "why didnt i g" has didnt
  const done = rawWords.slice(0, -1).filter((w) => !STOP.has(w));
  const prep = prepare(posts, done.join(' '));
  const titleOf = (slug: string) => posts.find((p) => p.slug === slug)?.title;

  type Cand = { id: string; label: string; query: string; slug: string; stems: string[]; raw: string[]; kind: 0 | 1 };
  const cands: Cand[] = [];
  for (const { p, stems } of PHRASE_STEMS) {
    if (!isAnswered(p) || !p.answer || !titleOf(p.answer)) continue;
    cands.push({ id: `q:${p.phrase}`, label: asQuestion(p.phrase), query: p.phrase, slug: p.answer, stems, raw: words(p.phrase), kind: 0 });
  }
  for (const post of posts) cands.push({ id: `p:${post.slug}`, label: post.title, query: post.title, slug: post.slug, stems: contentStems(post.title), raw: words(post.title), kind: 1 });

  const scored: { c: Cand; score: number }[] = [];
  for (const c of cands) {
    const rawText = c.raw.join(' ');
    // the start of the question, word for word: the surest match
    const starts = rawText.startsWith(typedRaw);
    let matched = 0;
    if (!starts) {
      // every finished word is in the candidate: as typed, as a typo read as the word meant, or by an everyday synonym
      const ok = prep.typed.every((s) => {
        const alts = [s, prep.corrections[s]].filter((x): x is string => !!x);
        const hit = alts.some((a) => hasStem(c.stems, a)) || prep.expansions.some((e) => hasStem(c.stems, e));
        if (hit) matched += 1;
        return hit;
      });
      if (!ok) continue;
      // and the last word, which may be only its first letters, starts one of its words
      if (!STOP.has(last) && !c.raw.some((w) => w.startsWith(last)) && !c.stems.some((x) => x.startsWith(stem(last)))) continue;
    }
    // more of your words, a question before a title, a start-of-question before a loose match, a shorter one before a longer
    const score = matched * 10 + (starts ? 20 : 0) + (c.kind === 0 ? 5 : 0) - c.raw.length * 0.1;
    scored.push({ c, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const { c } of scored) {
    if (seen.has(c.label)) continue;
    seen.add(c.label);
    out.push({ id: c.id, label: c.label, description: c.kind === 1 ? (posts.find((p) => p.slug === c.slug)?.summary ?? '') : (titleOf(c.slug) ?? ''), query: c.query, slug: c.slug });
    if (out.length >= max) break;
  }
  return out;
}

/**
 * "Did you mean…": when nothing matched, the known questions that share a word with
 * what was typed (a typo corrected, an everyday word read as its group), the closest first.
 */
export function didYouMean(posts: readonly SupportPost[], text: string, max = 3): Suggestion[] {
  const prep = prepare(posts, text);
  const q = [...prep.typed, ...Object.values(prep.corrections), ...prep.expansions];
  if (!q.length) return [];
  const titleOf = (slug: string) => posts.find((p) => p.slug === slug)?.title ?? '';
  const out: { s: Suggestion; score: number }[] = [];
  for (const { p, stems } of PHRASE_STEMS) {
    if (!isAnswered(p) || !p.answer) continue;
    const shared = stems.filter((s) => hasStem(q, s)).length;
    if (!shared || shared / stems.length < 0.3) continue;
    out.push({
      s: { id: `q:${p.phrase}`, label: asQuestion(p.phrase), description: titleOf(p.answer), query: p.phrase, slug: p.answer },
      score: shared / stems.length + shared,
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, max).map((x) => x.s);
}
