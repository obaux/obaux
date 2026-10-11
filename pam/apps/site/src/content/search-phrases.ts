/**
 * What people type into Support's search, in their own words, and where it
 * should take them. This file is the use cases: Sage writes the phrases, Wren's
 * search (`lib/search.ts`) reads them, and `test/search.test.ts` runs every one
 * through the real search.
 *
 * - `phrase` is how a person would say it, the way they would say it out loud:
 *   "why is this happening", "I did not get a code". Plain words, no jargon.
 * - `post` is the slug of the published post that should come first for that
 *   phrase, or `null` when no post answers it yet. A `null` phrase is a gap:
 *   it must also be listed in `docs/help-centre-gaps.md` (the test checks), and
 *   the page tells the person plainly that there is no article for it yet.
 * - `use` is one line of the use case: who is asking and what has just happened
 *   to them. It is for the people who write the posts; it is never shown.
 *
 * English only for now.
 */
export interface SearchPhrase {
  readonly phrase: string;
  readonly post: string | null;
  readonly use: string;
}

export const SEARCH_PHRASES: readonly SearchPhrase[] = [];
