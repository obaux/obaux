# 2026-10-13 — real visits on a real member's page (W4)

**Branch:** `claude/places-programs-real-trips-for-case-managers` · **Lane:** Places & programs (Piper), for Ava's lane (accounts and people): `person/page.tsx` and `PastTripsView.tsx` are hers; Ava was blocked on a push and the merge desk asked for a minimal diff.

## What changed

- A real member's page (and "Programs attended in the past"), for their case manager, now shows the visits really planned, read as the case manager
  (`appointments_select_admin` / `admin_covers` decide which members come back), and never `dummyTripsFor()`. `lib/useMemberTrips.ts` asks only for
  the place, its kind and the day and time: not how a visit was marked, not a note (the §4.1 list already includes appointments).
- The "trips shown are examples" note is said only on example people; a real member's page shows no note.
- e2e `person-real-trips.spec.ts`: nothing planned = "None yet." and no example note; real visits show; the past page too.

## What was wrong, and what missed it (Iris's b25 re-test, W4)

`person/page.tsx` always called `dummyTripsFor(person.id)`, which invents five trips from any id, so a real case manager saw "2 Trips coming up" for a real member
with no example mark. D-509 (no examples for real accounts) had covered Trips, Messages, places, Explore, Saved and Profile, not this page.

## Left undone

If a case manager is "super admin previewing" a member, `admin_covers` may not return rows; they see none rather than examples.

## Needs a human

Nothing.
