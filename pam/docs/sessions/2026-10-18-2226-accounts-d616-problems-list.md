# 2026-10-18 — accounts d616 problems list

**Branch:** `claude/pam-problems-list` · **Lane:** Accounts & invites

## What changed

- **Problems** (`/problems/`, D-616; Will, 21:14: "if something breaks, please create an error log so the team can be notified
  and fix the issue"): a super admin's list of what broke in the last 7 days, read from Nico's `app_errors_grouped(p_days: 7)`,
  newest first. Each row leads with the action's name (`appError.action.<key>`), or the key itself while it has none, then
  `key · route · code`, last and first seen, and the count. No person and no free text, because the log keeps neither. Anyone
  but a super admin gets the `directory.notSuper` line and the log is never asked. Reached from the bell's `app_error` row and
  a row beside Waiting cities on Requests; Back goes to Notifications, Home or Profile by `?from=`.
- **The bell's `app_error` row says the name** (Mira, 22:12, from Lena's find): `describe()` in `notifications/page.tsx`
  swaps the database's action key for its name before filling `notify.app_error`, as `service_flagged` does with its reason,
  falling back to the key.
- Seven `problems.*` lines (Sage signed 891682a1; Lena's six languages, a26d0510, merged here).
- Storybook: `Problems` and `ProblemsEmpty` under Super admin, with an `app_errors_grouped` fixture.

## What was wrong, and what missed it

- Until 22:12 the bell row would have read "messages.send didn't go through…": the database writes the key, and `describe()`
  passed it straight through. Nothing caught it because no spec drew an `app_error` row. One does now, and it fails on the
  old page (3 of 3 projects).
- The database writes `count` as a number; a spec that sent `'1'` as a string got "1 times" and looked like a plural bug.
  It isn't: a number picks `.one`. The spec sends numbers, as `report_app_error` does.

## Decisions made

None that need a file; the screen follows D-616 as Mira relayed it.

## Verified

- `e2e/problems.spec.ts` (10 tests × 3 projects), with notifications, messages, super-admin-pass and invite specs: 366 passed.
- `@pam/config` 1464 passed; `@pam/web` unit 221 passed; tsc clean; Storybook builds.
- Pictures: `docs/design/review/2026-10-18-problems/` (390 English, 320 dark, 320 Arabic; list and empty).

## Left undone

- The five accounts-lane action keys (`pam.hours.save`, `pam.thread.status`, `directory.demo-view`, `requests.review`,
  `invite.create`) have names signed by Sage (689f92a6) but not yet in the bundles; until Lena adds them they show as the key.
- D-616 part (b), the team-side saves on Dot's rule with `reportAppError`, waits for Dot's hook on main.

## Needs a human

Nothing.
