# 2026-10-31 — places-programs no made-up hours on the real app

**Branch:** `claude/places-programs-parks-no-hours` (on 73a0f6e6) · **Lane:** places and programs (Piper)

## What changed

Will, 31 October 20:35: "It's not acceptable to have fake hours on the real app." The stand-in week is **deleted** from `@pam/config/hours`
(`USE_PLACEHOLDER_HOURS`, the four shapes, `shapeFor`): `hoursFor()` returns the place's own hours or nothing. So no screen can show a stand-in: place page,
Explore, Connect, reported places, saved places (all via `placeStatus`). A place with no hours and not Parks & Rec (D-622) gets, on the place page, the signed
row "Check hours on Google" (`place.hoursOnGoogle`) linking to Google Maps, second in the list of ways to reach it, where the hours row was. No new words.
The `place.hours.sample` string is unused now and left in the bundles. Example screens lose their stand-in hours too (dropped, not kept with a "sample" note:
simpler, and it cannot leak). D-624 is the rule; it supersedes the 16 September stand-in and says real hours come from Iris's research once Will says yes.

## What was wrong, and what missed it

A flag set to true by default, for demos, was on in the live app; a flag is one edit from fake hours coming back, so the code went, not the flag.

## Decisions made

D-624 (the number I claimed as 623 was taken; every reference says D-624).

## Verified

- Tests changed, and why (also in D-624): `hours.test.ts` stand-in tests replaced by "never makes hours up" (many ids × many unreadable values) and "no open or
  closed line without hours"; `place.spec.ts` "says out loud that the hours are samples" replaced by "shows none, links to Google", the hours-row and drawer
  tests bring a real week, one new test keeps a real-hours place unchanged, the directions test counts the new row; `places.spec.ts` (Explore card line from the
  stand-in), `focus-text-boxes.spec.ts` (real week for the drawer), `visit-change.spec.ts` (example place: the Google link) updated.
- A full e2e run was started and stopped by the 30-minute limit near the end of the iPhone project: it found one failure (the directions test above, fixed);
  nothing else failed before it stopped. The targeted run after (place, places, saved, focus-text-boxes, visit-change, place-scraped-vs-pam, places-without-a-lead,
  explore-bell, directory × 3 projects): 195 passed, 0 failed.
- Unit: config 1593 passed (third-party-hosts fails only for my untracked local `pw.real.config.ts`, not committed); web 246; tsc all; budget 1.8 kB to spare;
  Storybook builds.
- Pictures at 320, English and Arabic, a behavioral-health place and an Explore list, before and after: `docs/design/review/2026-10-31-no-made-up-hours/`.

## Left undone

Storybook stories that pass hours or `hoursArePlaceholder` to PlaceDetail are unchanged (the props still exist). `place.hours.sample` is still in seven bundles.

## Needs a human

Nothing. Real hours wait on Iris's research and Will's yes.
