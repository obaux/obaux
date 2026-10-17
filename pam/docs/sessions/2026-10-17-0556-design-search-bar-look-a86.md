# 2026-10-17 — design search bar look a86

**Branch:** `claude/pam-design-search-bar-look` · **Lane:** design system (Dot) · Asked by Mira, from Will (card a86, 05:32)

## What changed

`SearchBar` (centred at rest; narrows with Cancel on its right when tapped; the magnifier and words slide left; reduced motion = no slide) and a centred `SearchLauncher` in `packages/ui/src/SearchPill.tsx`; Explore and the staff All programs use it; Google's mark moved under the results, centred (`ExploreView` `afterResults`); stories (`Components/Inputs/SearchBar`, One search's Open); the specs tap the launcher first; the privacy list names `SearchPill.tsx` (D-587). D-591 records it and D-574 now says what it changed.

## What was wrong, and what missed it

The a86 inline branch swapped the shrinking bar for a plain field; Will wanted the bar back. In a dev Storybook the launcher's shadow reads `none` (Button's own rule wins in dev's style order); the static build is right. A first `HStack` wrapper left the field at its own width (the pill 39px short of the room); a `VStack` makes it fill.

## Decisions made

D-591.

## Verified

Static Storybook: rest, tapped, typing a program word and an address, 390 and 320, light and dark, Arabic at 320; the mark centred (centre 195 of 390, 160 of 320). `@pam/ui` tests 124 pass, `@pam/config` 1328 pass. e2e on narrow-320 for one-search, focus-text-boxes, explore-bell and explore-bell-shift (see the READY for the final run).

## Left undone

Piper's own pictures (rest, open, typing, the mark) go on card a86 after he signs off.

## Needs a human

Will, on card a86.
