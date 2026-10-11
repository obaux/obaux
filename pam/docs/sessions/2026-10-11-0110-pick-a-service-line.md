# 2026-10-11 — pick a service line

**Branch:** `claude/places-programs-pick-a-service-line` · **Lane:** Places & programs (Piper)

## What changed

W3 from Iris's member-flow pass: Plan a trip on a place with services is greyed until one is picked, with no reason given. Will approved (11 October, via Mira): "Pick a service above to plan a trip.", shown under the greyed button only while a service is still to pick. One new key, `place.schedule.pickService`, in seven languages (six are drafts for Lena; ledger acked). No decision file: it is Will's wording on an existing rule (D-313).

## What was wrong, and what missed it

The disabled button had no explanation; the "Pick a service" heading sits above the cards, out of sight of the button at the foot.

## Decisions made

None new (D-313 stands).

## Verified

New e2e place-pick-a-service (2 tests, three phones); place, places-without-a-lead, a11y, trip-booked, visit-change pass (108); config 1067, web 94, tsc, Storybook build, fit audit on the place stories: 0 new defects.

## Left undone

Nothing.

## Needs a human

Lena: one string in six languages.
