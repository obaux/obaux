# D-574 — Search bars keep the dark pill outline, and one height token

**Date:** 2026-10-14 · **Branch:** `claude/pam-design-search-pill`

**Decided by:** Will, via the merge desk (14 October, 05:55, card a86): "Also please bring back the selected dark pill outline around search bar when user selects it. And make search bar on homepage match the height of search when active, they should feel as one. not disconnected."

**Search bars are the exception to D-569** (Will, 04:08: no ring on a text box). While a search field is active, its whole pill is outlined again: the same 3px ink ring (white in dark mode) that D-569 took off, on the large input group, which is only ever a search pill (`SearchPill`, `SearchField`), so every search bar matches. The field inside still draws none, and every other text box (the help form, the composer, Sign in) stays without a ring. Keyboard focus on arrival is unchanged.

**One height.** `--pam-search-height` (60px) in `tokens.stylex.ts` and `styles/tokens.css`; the resting `SearchLauncher` and every open search group read it. Both were already 60px (measured on Explore: resting 60, active pill 60, the Location sheet's box 60), so no screen moves; the token is so they cannot drift apart. 60, not the 56px of `--pam-field-height`: a search pill is taller than a form field on purpose (D-265), and 60 is what Will signed. What can still feel disconnected is width and alignment, not height: the resting bar is full width with centred words, the active one shares its row with Cancel and starts its words at the left. Said to Will with the pictures; his call.

**Tests.** `focus-text-boxes.spec.ts`: the drawer's search is focused on arrival with the pill (3px, rounded) round it and nothing on the field, also when Tab lands on it; the resting bar, the open pill and the sheet's box are all 60px. `consent.spec` still asserts no ring on Sign in's field. Pictures: `docs/design/review/2026-10-14-search-pill/`.
