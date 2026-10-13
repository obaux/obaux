# 2026-10-13 — "Programs attended in the past" lists only attended visits (W5)

**Branch:** `claude/places-programs-attended-only` · **Lane:** Places & programs (Piper), in Ava's files `person/page.tsx` and `PastTripsView.tsx`.

## What changed

`useMemberTrips` also reads `status`; "Programs attended in the past" (the person page, its count, and `PastTripsView`) lists only visits with `status = 'attended'`.
A missed visit and a past visit nobody has marked are not there. Upcoming visits are unchanged. No new words: the member's transparency screen already says a case manager
sees "if you went or missed one". Example people keep their made-up past.

## What was wrong, and what missed it (Iris, b27 re-test, W5)

W4 listed every non-cancelled past visit, so a missed visit told the case manager the member went. The test fixtures had no status.

## Verified

e2e `person-real-trips.spec.ts` (15 across 3 projects): a missed and an unmarked past visit are not there, an attended one is, and the count says 1 of 3.
