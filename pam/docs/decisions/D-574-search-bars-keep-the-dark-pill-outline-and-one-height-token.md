# D-574 — Search bars keep the dark pill outline, and one height token

**Date:** 2026-10-14 · **Branch:** `claude/pam-design-search-pill`

**Decided by:** Will, via the merge desk (14 October, 05:55, card a86): "Also please bring back the selected dark pill outline around search bar when user selects it. And make search bar on homepage match the height of search when active, they should feel as one. not disconnected."

**Search bars are the exception to D-569** (Will, 04:08: no ring on a text box). While a search field is active, its whole pill is outlined again: the same 3px ink ring (white in dark mode) that D-569 took off, on the large input group, which is only ever a search pill (`SearchPill`, `SearchField`), so every search bar matches. The field inside still draws none, and every other text box (the help form, the composer, Sign in) stays without a ring. Keyboard focus on arrival is unchanged.

**One height.** `--pam-search-height` (60px) in `tokens.stylex.ts` and `styles/tokens.css`; the resting `SearchLauncher` and every open search group read it. Both were already 60px (measured on Explore: resting 60, active pill 60, the Location sheet's box 60), so no screen moves; the token is so they cannot drift apart. 60, not the 56px of `--pam-field-height`: a search pill is taller than a form field on purpose (D-265), and 60 is what Will signed. Height was not what felt disconnected; width and alignment were, so (merge desk, 06:16, Will's "feel as one"): the resting bar puts its magnifier and "Search programs" at the left, with the same left room (16px), gap (4px) and type (16px, 600) as the open field, so nothing jumps on a tap; the open pill's right edge draws in as Cancel comes in over 200ms (none with reduced motion); and there are 12px (`--spacing-3`) between the pill and Cancel, plus the 5px outline. The words were centred before (D-265, the reference's look); this replaces that.

**The Location drawer's box stays as it was.**

**Tests.** `focus-text-boxes.spec.ts`: the drawer's search is focused on arrival with the pill (3px, rounded) round it and nothing on the field, also when Tab lands on it; the resting bar, the open pill and the sheet's box are all 60px; the magnifier and the words are at the same x and in the same type resting and open; and there are at least 12px between the outline and Cancel. `consent.spec` still asserts no ring on Sign in's field. Pictures: `docs/design/review/2026-10-14-search-pill/`.

## Same words start in every search bar (Piper, a86, 14 October)

`SearchField` (the sheet's box, Messages, Schedule, the one-search screen) had 8px between its magnifier and its words; `SearchPill` and the resting launcher have 4px, so the words started 4px further right in an open `SearchField`. `SearchField`'s inner field now takes the same 4px gap (`fieldGap` in `SearchPill.tsx`), and the test measures the resting bar, the open `SearchPill` and the sheet's `SearchField`: magnifier and words at the same x in all three.
