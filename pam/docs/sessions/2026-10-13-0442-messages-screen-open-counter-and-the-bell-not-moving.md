# 2026-10-13 — messages screen open counter and the bell not moving

**Branch:** `claude/messages-screen-open-counter` · **Lane:** Messages & notifications (Nico)

## What changed

- Migration `20261013042956_count_how_many_phones_open_your_points_and_profile_each_day`: `screen_open_counts (day, screen, count)` (RLS forced, a deny policy, no grants), `count_screen_open(screen)` (security definer, search_path set, 'points'/'profile' only, signed-in only), `screen_opens_weekly()` (service role, under 5 shown as "under 5"). DB test 70.
- `lib/screenOpens.ts`: `countOnce` (the once-a-day note) and `useCountScreenOpen`; on `/points/` and `ProfileScreen` (Ava reviews that call). Unit test, e2e `screen-open-count.spec.ts`. Storybook mock answers the call.
- W3: `HeaderBell` holds the bell's place when the phone had the bell last time (`pam.explore.bell`), so the page no longer moves 26-30px when it arrives. e2e `explore-bell-shift.spec.ts` (failed with 26-30px before the fix).

## What was wrong, and what missed it

## Decisions made

D-555.

## Verified

## Left undone

- Lena's Privacy line (a76) must ship in the same batch as this, never before. Nothing here is live until Mira applies the migration.
- The first time a phone has a bell, the page still moves once (it cannot know before the answer).
- Notes on the phone, for Lena if Privacy lists them: `pam.counted.points`, `pam.counted.profile` (a date) and `pam.explore.bell` (`1`).

## Needs a human
