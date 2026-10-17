# D-591 — The search bar is centred at rest, narrows with Cancel when tapped, and the words slide left

**Date:** 2026-10-17 · **Branch:** `claude/pam-design-search-bar-look` (stacked on `claude/places-programs-one-search-inline`, a86)

**Decided by:** Will, card a86, 17 October 05:32, via the merge desk: the search bar that shrinks with Cancel on its right is back (the one-search branch had swapped it for a plain field); "at rest the magnifier and words are centred, once tapped they move left, ready to type"; Google's mark at the bottom of the results, centred.

## What it is

`SearchBar` in `@pam/ui/SearchPill` (the one bar, on a member's Explore and the staff All programs):

- **At rest:** the centred launcher (`SearchLauncher`): magnifier and words in the middle of a 60px pill, 16px/600, 4px between them. This reverses D-574's left-at-rest (14 October); the outline, the one height token and the 12px before Cancel in D-574 stand.
- **Tapped:** the field mounts in the same place, focused; Cancel draws in on its right over 200ms, so the pill narrows to make room, and the magnifier and the words slide from where they were to the left (a transform from the measured positions, both directions: the bar's edges stay put). Same 60px throughout, so there is no height jump. The 3px ink outline (D-574) is on while it is active.
- **Reduced motion:** no slide, no draw-in; the bar is simply in its next state.
- **Cancel** empties the words and returns to rest; a bar with words in it comes back open (Back restoring a query).
- **Google's mark** goes under the last result, centred (`ExploreView`'s `afterResults`), not under the heading on the left.

## What it replaces

D-573's one inline field with no Cancel (Piper's a86 branch): its `SearchField` on Explore is now behind `SearchBar`. `SearchField` itself stays for the sheet, Messages and the schedule.

## Tests

`focus-text-boxes.spec.ts` (resting 60px and centred; tapped: same top and height, narrower, the magnifier left of where it was, Cancel at least 11px clear), `one-search.spec.ts` (tap, Cancel puts the launcher back; the mark centred under the results) and the specs that typed into the bar now tap `[data-search-launcher]` first (`e2e/searchBar.ts`). Pictures: `docs/design/review/2026-10-17-search-bar-look/`.

## What a later session might reverse

The words slide is a nicety: if it ever janks on a real phone, the swap with no slide still meets Will's words.
