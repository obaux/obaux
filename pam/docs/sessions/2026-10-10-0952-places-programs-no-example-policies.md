# 2026-10-10 — Places & programs: no example policies for a real place (D-313)

**Branch:** `claude/places-programs-no-example-policies` (from `main` at `3ddac79`) · **Lane:** Places & programs (Piper)
**Job:** Mira, from my own finding on the services READY: a member planning a trip to a real place was shown "Sign 4 policies for <place>" from the example policy set — rules a program never wrote. Hide them for real places until D-313's real policies exist; example places keep them for Storybook.

## What changed

- **`placeAsksForPolicies` says no to a place from the catalogue** (a uuid id), in `packages/config/src/dummy-policies.ts`. Every member screen that shows policies already asked that one gate (the place page, booking and its booked screen, the signing page), so they all stop at once.
- **The Trips list bypassed the gate.** `TripsScreen.withPolicies` counted the example policies for every trip itself, so a real place's trip read "Sign 4 policies for Riverside Job Center". It now asks the gate first.
- **Tests** (`policies-for-real-places.test.ts`): a uuid place asks nothing (any case); example places still ask; the example food pantry still doesn't; and the four member screens that show policies each go through the gate, so a fifth path that skips it has to be written on purpose.

## What was wrong, and what missed it

- **The leak was one missing call.** Four screens used the gate; the Trips list did its own sum. Nothing failed because the example set *is* what every example place borrows, so every example story was right; only a real place (which only exists since trips and programs became real, D-454, D-462) showed it, and I found it in a browser check, not a test. The source-scan test in `policies-for-real-places.test.ts` is what would have caught it.
- **A program's own, example data still shows for leads and case managers** (`PoliciesView`, `PersonPoliciesView`, `VerifiedBadge`, `ScheduleView`, the person page): they read `usePolicies()` as example data too. Not touched here; they are the lead's and staff's screens, and the next step (real policies) replaces the data under all of them.

## Decisions made

None new.

## Verified

- config tests (7 new), web tests, tsc clean, Storybook builds.
- In a browser (Chromium, 390px): on a real place, the booked screen and the place's page show no policies row, and Trips has no "Sign N policies" for it; an example place's trip still does.
- **Not run:** anything against the live project.

## Left undone

- Real policies per program and per service (D-313's second step), and what a member signs.
- The leads' and staff's policy screens still show example data.

## Needs a human

Nothing.
