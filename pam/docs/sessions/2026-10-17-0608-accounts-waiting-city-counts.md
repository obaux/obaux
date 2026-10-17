# 2026-10-17 — accounts waiting city counts

**Branch:** `claude/pam-waiting-city-counts` · **Lane:** Accounts & invites

## What changed

- This is card a96, item 3, which Will signed on 17 October. A super admin sees each city people are waiting for,
  and how many (D-593).
- Migration `20261017055932`: `waiting_city_counts()`, a definer that only a super admin can run. It returns
  counts only, grouped as D-593 says.
- `useWaitingCities`, `WaitingCitiesScreen` at `/cities/waiting/` (back to Home with `?from=home`, else Profile),
  and a row on the super admin's Home with everyone waiting as its number.
- Words: three new keys, `waitingCities.title`, `.empty.title` and `.empty.body`, in English and waiting for Sage.
  The six other languages hold the English, unrecorded, so copy:status lists them until Lena translates. The
  subtitle reuses `requests.count` ("{count} waiting").
- Storybook: fake data for the function (with a long place for the fit check), the route, and the story Super
  admin › Screens › Cities people are waiting for.

## What was wrong, and what missed it

- The first grouping showed "CAMDEN" on a three-way tie (mode() picks the first value in sort order). It is now
  ordinary case on a tie, and test 75 holds it.
- The first list cut a long place off with "…" (`ListItem`'s string label). It now wraps, like `MenuList`'s labels.

## Verified

- Test 75: grouping, biggest first, total, two outputs only, definer with the fixed path. A member, a case manager,
  a program lead, someone on the waiting list and anon all get nothing. All database checks pass.
- New e2e `waiting-cities.spec.ts`: the Home row's link and number (23), the list biggest first with no links in
  it, back to Home, and the empty state. With super-admin-pass, programs-review, staff-request-approve and a11y:
  99 passed on all three projects.
- Web `tsc` is clean, and Storybook builds. Pictures are in `docs/design/review/2026-10-17-waiting-cities/` (Home
  and list, en 390, en 320, ar 390).

## Left undone

- Sage signs the three lines, Lena translates them, and Dot confirms the look. Config stays red on the six
  unrecorded keys until Lena's words land, so this is not READY yet.
- The pictures go on card a96 before it ships.

## Needs a human

- Nothing yet.
