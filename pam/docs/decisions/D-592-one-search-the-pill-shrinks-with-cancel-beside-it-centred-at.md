# D-592 — One search: the pill shrinks with Cancel beside it, centred at rest, Google under the list

**Date:** 2026-10-17 · **Branch:** `claude/places-programs-one-search-inline` (a86, held for Will's yes and his p7 signature)

**Decided by:** Will, on card a86 from the Control Room, 17 October 05:32, relayed by the merge desk. His three notes, in his words:

1. "What happened to the search component that shrinks and cancel button sits next to search on right?"
2. "The first impression of search bar should have items center aligned, search changes to type on left once clicked."
3. "Move Google Maps logo on bottom of list, center aligned."

## What it does now

- **The bar is `SearchBar`** (`packages/ui/src/SearchPill.tsx`). At rest it is the pill, as it is live on main. Tapped, the same pill narrows and **Cancel** appears on its right; the field is focused, with its clear × inside. **Cancel** (or Escape) clears the words, closes the field and returns the list to how it was. The list still filters as the words are typed (D-573), with no pop-up and no dropdown. The staff All programs screen uses the same bar in its own row.
- **Smooth, still.** The two states are the same height (`--pam-search-height`, 60px), so nothing below moves. The room for Cancel grows in 200ms and the field gives way to it; under `prefers-reduced-motion` it is simply there. Cancel is out of the tab order and the accessibility tree while the bar is at rest.
- **Centred at rest, at the left when open.** The magnifier and "Search programs" are centred in the resting pill; once tapped the same words sit at the left, ready to type. **This reverses D-574's words-at-the-left-at-rest of 14 October** (Will's own, a86 05:55): his words now win. D-574's one outline and one height token stay.
- **Google's logo is under the last result**, centred, whenever a typed address is what the list is sorted from (`PoweredByGoogle`, the default centred form), before the note about where the list comes from. It is shown whenever a Google result is on screen, as the Places terms require; with no result (an empty list) it follows the empty state. It was under the heading, at the left.

## Privacy guard

`data-collected.ts` moves Explore's one field from `ExploreScreen.tsx` to `packages/ui/src/SearchPill.tsx` (it draws the field now), still `address-typed`. No field was added or removed.

## What a later session might reverse

Left-at-rest words (D-574) are gone for good unless Will says so. The launcher (`SearchLauncher`) is only used inside `SearchBar`.
