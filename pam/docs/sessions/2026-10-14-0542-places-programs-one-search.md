# 2026-10-14 — places-programs one search (D-573, card a86)

**Branch:** `claude/places-programs-one-search` · **Lane:** Places & programs (Piper)

## What changed

- Explore's search is one box (take three, Will's 05:21 words): launcher "Search programs" → full screen, cursor in the box; one list: Programs, Areas, Addresses; all digits means Areas first; "Use my current location" before anything is typed, no hint line. A program opens its page; an area or address returns to Explore and sets "Near …" (a street shows only its ZIP, D-552). The "Near ✎" control and its drawer are unchanged.
- Google rule for the box (`wantsGoogleFromBox`): address-like words AND no program matches (the programs search answered, successfully, with nothing), or a tap on "Search addresses for “…”", which sends exactly those words once. `searchPlacesChecked` tells a failed programs search from an empty one; failure sends nothing. The drawer keeps D-552's rule.
- Staff's All programs: the bar sits on its own row under Back / + / Help, above the chips (`searchBelow` in `ExploreView`, Dot's placement); the round search icon is gone; same screen.
- Sage's words (signed under A29): box name "Search programs, areas or addresses", "Nothing matched that.", the explicit row and its line "Sends what you typed to Google."; section names; the box has no footer privacy line (the drawer keeps its).
- Copy: 6 new keys, English in all 7 until Lena (`MAY_MATCH_ENGLISH`).
- Tests: `streetSearch.test.ts` (box rule), new `one-search.spec.ts` (12 cases), `places.spec` by-name search; story `One search`.

## What was wrong, and what missed it

Today's `wantsGoogle` also asks Google when Pam's areas find nothing; with one box that would have sent program words ("food"). Caught in the privacy check on the drawing, before any code. My first spec version typed words that no longer matched a program and was right to send; the test was wrong, not the rule.

## Decisions made

D-573.

## Verified

tsc; web unit 182, config 1311; Playwright all three projects: 680 passed on the first build (one-search, area-picker, street-search, explore-bell(+shift), focus-text-boxes, back, saved*, account, places, place, places-retired, role-badge-fit, messages), then 129/129 on the final build for the files this touched; Storybook build; fit audit on `One search` and `explore` (nothing new). Pictures: `docs/one-search-built/`.

## Left undone

Lena's six languages for the 6 new keys. Typing no longer filters the Explore list behind it, so `ExploreView`'s `query` / `onClearSearch` and some `explore.search.*` / `explore.results` strings are dead; left for a clean-up. `hideWhenEmpty` untouched.

## Needs a human

Will: the built pictures before merge. Lena: translate. Mira: merge after Will has seen them.
