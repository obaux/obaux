# D-624 — No made-up hours on the real app

**Date:** 2026-10-31 · **Branch:** `claude/places-programs-parks-no-hours`

**Decided by Will, 31 October 2026 (Control Room note n-20261031-2035):** "It's not acceptable to have fake hours on the real app."

## The rule

Pam never shows hours it made up. A place Pam holds no real hours for shows **no hours row, no week drawer, no "Open until…/Closed" line and no
"sample hours" note**: on the place page, Explore, saved places, map cards, Connect, reported places, and anywhere else that calls `hoursFor()`.
Only a place with real hours (the six OIC places, or any row `enrich-places` fills from real data one day) shows hours.

- **The stand-in is deleted, not switched off.** `USE_PLACEHOLDER_HOURS`, the four stand-in shapes and `shapeFor()` are gone from `@pam/config/hours`;
  a flag left at `false` is one edit from fake hours going live again. `hoursFor()` returns the place's own hours or nothing. Example screens
  (Storybook, `examplesOn()`, the demo data) lose their stand-in hours too: it was Will's call to keep them only if they said they were samples, and
  dropping them is simpler and cannot leak.
- **A way to the real hours, with no new words.** For a place with no hours that is not Parks & Rec, the place page's list of ways to reach it has the
  existing signed line "Check hours on Google" (`place.hoursOnGoogle`, in every language) linking to the place on Google Maps. Pam claims no hours; the
  member finds them where they are. A place that declares it has none on purpose (`{"none": true}`, D-622) has no such row either.
- **Supersedes** the 16 September stand-in rule (Will's request for placeholder hours so screens could be demonstrated, `hours.ts`'s old header) and
  brings back D-044's "no open/closed state unless Pam knows".
- **Where real hours come from:** the research project (Iris), once Will says yes. Until then, only the six OIC places have any.
- `place.hours.sample` ("These are sample hours while Pam checks the real ones. Call before you go.") is no longer shown anywhere. The string stays in
  the bundles (signed, translated); remove it with the next locale sweep, not here.

## Tests that changed, and why

- `hours.test.ts`: "marks a stand-in as not real" and "the same place the same stand-in" are replaced by "never makes hours up" (many ids and many unreadable
  values all give nothing) and "no open or closed line without hours". That is the test that a real account never sees a stand-in: there is no stand-in code
  path left to reach.
- `place.spec.ts`: "says out loud that the hours are samples" is replaced by "shows none, links to Google"; the tests of the hours row and its drawer now bring a
  real week (they relied on the stand-in); a new test keeps a real-hours place unchanged. The Parks & Rec test no longer expects a stand-in for another place.
- `places.spec.ts` (Explore card said open or closed from the stand-in) now expects no such line; `focus-text-boxes.spec.ts` brings a real week for its drawer
  tests; `visit-change.spec.ts` (an example place) expects the Google link, not an hours row.

