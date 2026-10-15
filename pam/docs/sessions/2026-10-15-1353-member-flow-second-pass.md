# 2026-10-15 — member flow second pass (D-578)

**Branch:** `claude/places-programs-member-flow-pass` · **Lane:** Places & programs (Piper), job from the merge desk

## What changed

- W4: `HelpButton` on New trip's When and on the three policy screens (`PolicyActions` beside Done) — `NewTripView.tsx`, `MemberPoliciesView.tsx`.
- P3: `TripCard` name wraps — `packages/ui/src/TripCard.tsx`.
- P7: `CopyButton` `inCard` is 48px (margin above and beside only); "View all places to visit" is a button row — `CopyButton.tsx`, `NewTripView.tsx`.
- W1: `SignSheet` resets `hasInk`, drawing, typing and name when it closes — `MemberPoliciesView.tsx`.
- W2: `AWARDED_TODAY` gains the two attend reasons; Ways to earn shows them first with the buttons' own words — `points.ts`, `app/points/page.tsx`, `points.test.ts`.
- P6: `ImHereCard` `onMarked`; the place page hides Cancel once marked — `ImHereCard.tsx`, `app/place/page.tsx`.
- P8: signature fixtures in `stories/journeys/mockSupabase.ts`; `useMySignatures` falls back to the browser's drawing.
- Tests: new `e2e/member-flow-pass.spec.ts`; additions to `member-signs-policy`, `im-here` and `points` specs.

## What was wrong, and what missed it

Each was found by Iris's walk, not by a test: nothing measured a link row's target (P7), a screen's Help (W4), or a sheet opened twice (W1). The attend reasons were added to the database in D-535 without the list that guards the points screen (W2); its test pinned the old list. Now pinned with the new one.

## Decisions made

D-578.

## Verified

Built with `build:e2e`. The touched specs on three projects (member-flow-pass, member-signs-policy, im-here, points, tap-targets, policies, program-policies, place, trips-real-account, trip-booked, trips-past, a11y); `@pam/ui` and `@pam/config` tests. The place a11y test caught the first copy-button margin lying over the address below it (axe target-size); fixed before the push.

## Left undone

P1 and P2 went in with Sage's words (second commit). Lena: translate `trips.card.label.alone` and re-check the three `trips.new.missing.*` (kept, not retranslated). W3 and W5 are Dot's; W6 goes on Will's phone list. `points.way.attend` is now unused (left in the ledger; remove with Lena's next pass).

Forms list (Mira, 13:55): Will's a85 Q3, "Pam stops keeping the drawn signature", covers policies too, so `member_signatures` (D-270's "real version") is due to change when the forms and DocuSign work is built.

## Guard added after review

The fallback to the tab's drawing (P8) is used only where examples are shown (`examplesOn()`); sign-out clears `pam.mySignatures` beside `pam.view-as`; two specs in `member-signs-policy.spec.ts` hold both.

## Needs a human

Merge desk: READY. Screens: Trips (long name), New trip (When, Where), Policies to sign, a policy, a place with an address, a place after "I'm here", Your points.
