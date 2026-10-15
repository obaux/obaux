# 2026-10-15 — accounts super-admin-pass

**Branch:** `claude/pam-super-admin-pass` (from main 7f850755) · **Lane:** Accounts & invites (Ava)

The merge desk routed Iris's super admin first pass to this lane (15 October, 14:38): W1 and P1 to P7.

## What changed

- **W1:** `RequestReviewScreen` and `ProgramReviewScreen` ask with `ConfirmDialog` before Approve/Deny and before a
  program's Approve, then stay on the screen with a line at the top saying what happened, and a button back the way
  they came. 19 new English keys (`requests.confirm.*`, `requests.decided.*`, `review.confirm.*`, `review.decided.*`).
- **P1:** Home's Programs to check row has a count; `requests.city` reads "City: {city}".
- **P2:** `?from=home` on that row, so Programs to check goes Back to Home; decisions go back with `goBack`.
- **P3:** `toLookAt()` counts in-review only.
- **P4:** phone (tel:, displayPhone), website (https) and address (Maps) are links on a program to check.
- **P5:** each switch is "Demo view for {name}" (new key). A row opening the person's page is not done (see D-584).
- **P6:** Profile's staff list is named "Your work" (new key).
- **P7:** invites log states at 14px.
- **Records:** D-584, this log, a changelog fragment, STATUS.

## What was wrong, and what missed it

- **The decision tests asserted the wrong thing:** that the URL changed after a tap. That passed while the screen gave
  no word at all. They now check the confirm, that nothing is sent before the yes, and the line after.
- **Token's size prop doesn't change its size in Pam's theme** (12px at sm and md). Found by measuring in the new spec,
  not by looking.

## Decisions made

- D-584.

## Verified

| Check | Result |
|---|---|
| `build:e2e`, then Playwright on 3 projects: super-admin-pass, staff-request-approve, programs-review, invite, directory, account, admin, a11y, back, tap-targets, alerts, places | 309 passed; after the last fix: super-admin-pass, programs-review, invite, staff-request-approve and a11y, 117 passed |
| `@pam/web` vitest; tsc | 177 passed; clean |
| Storybook build | passes |
| `@pam/config` | only the 21 new keys missing and `requests.city` stale in six languages |

## Left undone

- P5's row opening a person's page: there's no super admin person page for a real person. The merge desk decides
  whether one is wanted and what it shows.

## Needs a human

- Sage: the 21 new keys and the reworded `requests.city`. Then Lena: six languages.
