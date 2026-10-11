# 2026-10-11 — "I'm here" check-in

**Branch:** `claude/places-programs-im-here` (on part C) · **Lane:** Places & programs (Piper)

## What changed

Migration `20261011145930`: `i_am_here(visit, lat, lon)`, `i_went(visit)`, two internal helpers, and `check_in_visit` / `undo_check_in` replaced (a lead's mark after a member's own word pays the 40 missing; undo takes back only the lead's part; refuses a member's own mark). App: `lib/imHere.ts`, `screens/ImHereCard.tsx` on the place page for a real visit in its window; ten `checkin.*` strings (English in all seven files, copy-test allow-entry until Will signs). Storybook: "I'm here" state with a pretend database.

## What was wrong, and what missed it

Nothing let a person with no guide, or at a place with no lead, earn for going.

## Decisions made

D-535.

## Verified

DB suite with test 59 (149/160 m, the numbers never in audit or ledger, other member, lead, planned too late, outside the window, cancelled, no stored location, bad position, anon, cap of 3 per week, lead after a self-report +40, undo -40 leaves the member's word, restore once). Log check on the live project (D-535). Config tests, web tests, tsc, e2e im-here (axe clean).

## Left undone

Privacy line (Lena, Sage, then Will). The lead's circle still shows a member's own mark as filled, and tapping undo says it could not save; a later session could show that differently. Calendar link, Google sync and the appointments switch follow.

## Needs a human

Mira: apply `20261011145930` after `20261011053445`. Will: the Privacy line.
