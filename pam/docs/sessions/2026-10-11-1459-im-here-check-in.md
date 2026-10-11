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

Privacy line (Lena, Sage, then Will). Calendar link, Google sync and the appointments switch follow.

## Needs a human

Mira: apply `20261011145930` after `20261011053445`. Will: the Privacy line.

## Follow-up (Mira, 16:02): the lead's circle for a member's own mark

Migration `20261011160433`: `my_program_own_marks(from, to)` returns, as ids only, the visits at the lead's own program that the member marked themselves (position or word, not told apart). The lead's circle shows such a visit as marked but disabled, labelled "{name} marked this visit themselves" (`schedule.checkin.byMember`, English until signed), with no undo. DB test 60; unit test in `useProgramVisits.test.ts`; e2e in `program-visits.spec.ts`. NOTE: this tells the program one more fact (that the member marked it, not how); the Privacy line for a63/a66 should say so.
