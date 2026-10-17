# D-592 — One search: the pill shrinks with Cancel beside it, centred at rest, Google under the list (see D-591)

**Date:** 2026-10-17 · **Branch:** `claude/places-programs-one-search-inline` (a86, held for Will's yes and his p7 signature)

Claimed in parallel with D-591, which is the record: Will's three notes on a86 (17 October, 05:32), the `SearchBar` component built by Dot, its behaviour and the reversal of D-574's words-at-the-left-at-rest are all there. Read D-591.

What is Piper's, on top of it (the wiring):

- The list under the bar still filters as the words are typed (D-573), with no pop-up; Cancel returns it to how it was.
- Google's mark sits under the last result, centred, before the note about where the list comes from (`ExploreView`'s `afterResults`).
- The privacy list moves Explore's one field from `ExploreScreen.tsx` to `SearchPill.tsx` (same `address-typed`).
- The e2e specs tap the launcher before typing (`e2e/searchBar.ts`).

An earlier build of the same bar by Piper (572143ee) was dropped in favour of Dot's, which animates the words from the middle to the left.
