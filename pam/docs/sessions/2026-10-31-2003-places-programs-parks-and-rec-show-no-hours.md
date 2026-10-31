# 2026-10-31 — places-programs parks and rec show no hours

**Branch:** `claude/places-programs-parks-no-hours` (off `mira/b78` 0c820c27) · **Lane:** places and programs (Piper)

## What changed

Will, 31 October: Parks & Rec places need no phone, website or times open. The desk cleared phone and website live (20261031193246). This branch
makes the app show **no hours** for those 166 places: `services.hours = {"none": true}` is the marker (`NO_HOURS`, `declaresNoHours` in
`@pam/config/hours`); `hoursFor()` returns nothing for it, and every screen that draws an open or closed state calls `hoursFor()` through
`placeStatus` / `usePlaceStatus` (place page, Explore, Connect, reported places), so the hours row, week drawer, "Open until…/Closed" line and the
"sample hours" note all go at once. Migration `20261031200500_parks_and_rec_places_say_they_have_no_hours.sql` writes the marker on `source_ref like
'pprsite:%'` rows with null hours. **Written, not applied; the desk applies it.** Until it is, those pages still show the stand-in. D-622 is the rule,
including that a future `enrich-places` must not fill phone, website or hours for these rows.

## What was wrong, and what missed it

The app could not tell a Parks & Rec place from any other (no read carries `source`), so the stand-in week (Will's 16 September switch) showed on all 166.
Picking the column that every read already returns avoided changing any function (a DROP).

## Decisions made

D-622. Marker in `hours`, not a new column or a field on the reads: no DROP, no read changes, and `has_hours` becomes true for these rows (nothing reads it).

## Verified

- Old-code proof: the new place.spec test fails on `mira/b78` (the Hours button is there); passes on this branch (18/18 over 6 repeats × 3 projects).
- Unit: `hours.test.ts` 13 tests (4 new). Config 1593 passed (the one failure, third-party-hosts, is only my untracked local `pw.real.config.ts`, not committed).
  Web unit 246. tsc all packages. Bundle budget 1.7 kB to spare.
- e2e place, places, saved, place-scraped-vs-pam, places-without-a-lead, trips-real-account on three projects: 133 passed, 1 flake in my own first spec
  (`/^(Open|Closed)/` matched "Open in Google Maps"), fixed and repeated 18/18.
- Pictures at 320, English and Arabic, before and after, in `docs/design/review/2026-10-31-parks-no-hours/`.

## Left undone

Nothing visible depends on a database change that is not applied: the marker migration must be applied by the desk. Storybook stories that hard-code
stand-in hours were not touched.

## Needs a human

The desk applies `20261031200500`. If Will reverses D-622, set `hours` back to null on those rows.
