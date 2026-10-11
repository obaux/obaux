/**
 * The questions shown under the search box on Support's front page: the ones to answer first.
 * Sage curates the list; each is a phrase in `search-phrases.ts` that has a published answer, and
 * the question links straight to that post. There is no analytics behind it (the site counts
 * nothing a person types), so it is a judgement, to be replaced by real counts only if Will
 * approves the design for that (it touches privacy).
 */
export const MOST_ASKED: readonly string[] = [
  'cant sign in',
  'why didnt i get a code',
  'who can see this',
  'how do i plan a visit',
  'how do i talk to a real person',
  'why is this happening',
];
