# 2026-10-14 — places-programs one search (D-573, card a86)

**Branch:** `claude/places-programs-one-search` (the full-screen version) and `claude/places-programs-one-search-inline` (the inline rework, which replaces it) · **Lane:** Places & programs (Piper)

## What changed

- First build (take three): a full-screen search with Programs / Areas / Addresses sections, Lena's and Sage's words, Dot's outline and height token. Pictures were sent; Will then tried street search live (06:45) and asked for no pop-up, no dropdown, only Pam's programs.
- Inline rework (this branch): Explore's search is one inline `SearchField` (and the same on staff's All programs, on its own row, Dot's placement). Typing filters the list under it; the clear (×) inside the field empties it and keeps focus; no Cancel, no full screen, no dropdown. A typed address no program matches goes through `places-search` (autocomplete, then details of the first suggestion; the same two calls and host as the drawer) and the list is Pam's programs nearest that point; the heading says what was typed, the Near control reads its ZIP (display only) and Google's mark sits under the heading row. The point lives in memory only (`useAddressOrigin`). The "Near ZIP ✎" control and the drawer are unchanged.
- `wantsGoogleFromBox` is kept (address-like AND the programs search, every kind, answered successfully with nothing); the explicit "Search addresses" tap is gone. `searchPlacesChecked` tells a failed programs search from an empty one.
- Removed: `ExploreSearch`, the explore.search.programs/areas/addresses/addressRow(.note)/boxLabel keys, explore.empty.search.body, `searchRow`/`cancelIn` in `SearchPill.tsx`. The "Nearest to {zip}" key was dropped (the control says it). The search-empty state says "Nothing matched that." (Sage).
- Tests: `one-search.spec.ts` rewritten for the inline field (10 cases); `places.spec`, `explore-bell(-shift)` and Dot's `focus-text-boxes` one-bar test moved to the inline field; story `One search` (Resting, ProgramWord, NothingMatched, Address).

## What was wrong, and what missed it

The first build's rule would have sent program words to Google (caught in the privacy check before any code). Will then found the drawer stayed open after a pick (fixed on its own branch, D-575).

## Decisions made

D-573 (rewritten for the inline design).

## Verified

See the READY. Pictures: `docs/one-search-built/inline-*.png`.

## Left undone

Sage: the small p7 edit (Lena's note: the "when" fits, the "how" wording changes). Dot may restyle the quiet line and the mark. `explore.search.none`, `explore.results` stay (other screens).

## Needs a human

Will: the pictures. Merge desk: merge after he has seen them.
