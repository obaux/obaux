# 2026-10-18 — accounts d616 team saves

**Branch:** `claude/pam-d616-team-saves` · **Lane:** Accounts & invites

## What changed

D-616 part (b), on Dot's `useMalfunction` and `settleWithin` (b76):

- **Demo view (Everyone):** the switch moves only after `set_demo_view` succeeds. While it saves, it shows `isLoading`. On a
  failure or a 15 s timeout it stays put and shows the bottom alert, logged as `directory.demo-view` with the database's code.
  A late answer re-reads the directory. After a success the switch shows the saved value until the re-read directory agrees.
  `setDemoView` now throws instead of returning a boolean, so the log gets a code.
- **Pam's hours Save** (`pam.hours.save`) and **Close/Reopen** (`pam.thread.status`): the inline "That didn't go through. Try
  again." is gone; the bottom alert replaces it. The field checks (no day, closing before opening) stay by Save. A late
  Close/Reopen answer re-reads the inbox. Pam's own calls (`lib/pam.ts`, Nico's) return no code, so these log `offline` or
  `unknown`.
- **New invite** (`invite.create`): the "We could not make a code" card is gone; the bottom alert replaces it, and the form
  keeps what was typed. `createInvite` throws. A late invite is not shown: it was made, nobody sees it, and it expires.
- **Staff request review** (`requests.review`): an unexpected failure, or no answer in 15 s, shows the bottom alert (a late
  answer re-reads the requests). The named refusals (other city, pair not allowed, already decided) stay inline, as before.

## What was wrong, and what missed it

- **The demo view switch's failure said nothing.** `setDemoView`'s boolean was never read, so a failed save looked like a
  slow one.
- **The malfunction alert has no surface** (Dot's component): every layer from `role=alert` up to the fixed host has a
  transparent background, so on Everyone the next card's text shows through the alert's words. Dot's own screens have
  nothing behind it at the bottom. I sent it to Dot as a FINDING and did not touch `malfunction.tsx`. The demo-view pictures
  show it as it is.

## Decisions made

None that need a file: this is D-616 and D-617 as written.

## Verified

- `e2e/team-saves.spec.ts` (8 tests) plus the updated `admin.spec` (invite) and `staff-request-approve.spec` (other
  failure). On the old code, 6 of the 8 converted-behaviour tests fail. The other 2 pass by design: the switch already moved
  only after its directory re-read, and the field checks already stayed by Save.
- The log carries the action and code only: the specs check that no name, phone or person id goes into `report_app_error`.
- `check-bundle-budget`: within budget, 5.6 kB spare. Config: 1491 passed. Web unit: 224 passed. tsc is clean.
- The full e2e result is in the READY.
- Pictures: `docs/design/review/2026-10-18-d616-team-saves/`: all five at 390 light, plus demo view at 320 dark and 320 Arabic, at 600px tall so content sits behind the alert. Reshot after merging Dot's surface fix (ef8b19af).

## Left undone

- `pam.thread.statusFailed` and `pam.hours.said.failed` are no longer drawn. Removing keys from all seven bundles and the
  ledger is Lena's call, so they stay for now.

## Needs a human

Nothing.
