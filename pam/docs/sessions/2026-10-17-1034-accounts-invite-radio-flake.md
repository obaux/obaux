# 2026-10-17 — accounts invite radio flake

**Branch:** `claude/pam-invite-radio-flake` · **Lane:** Accounts & invites

## What changed

- `invite.spec.ts:178`, a row opens the request: after "Pick a city first." appears, the test waits for
  `settled(page)`, checks Philadelphia, then asserts `toBeChecked()` before Approve. Test-only, as Mira chose.

## What was wrong, and what missed it

- In b55's full local run, `check()` on the Philadelphia radio failed once at iphone-se-viewport with "Clicking the
  checkbox did not change its state", and passed on retry. The trace was lost: CI keeps 'on-first-retry', which
  records the passing run, and the local test-results/ were cleared.
- Not reproduced in about 430 runs, all at iphone-se-viewport with retries 0:
  - 40 repeats on 6 workers;
  - delays on user, profile, regions and requests, with CPU throttled up to 6×;
  - a forced session refresh as the tap lands;
  - webfonts delayed 1.5 to 3.5 s;
  - 260 repeats with all 4 cores busy-looped.
- Two causes fit the error:
  - the screen unmounting between the click and React's commit;
  - a layout shift between Playwright's stability check and the click. The test never waited for `settled()`, unlike
    its neighbours.
- The city line doesn't move the radios: it sits under them in the card. Measured on all three projects, the radio's
  box is the same before and after it appears, and the scroll is unchanged. So no product fix is needed.

## Verified

- invite.spec on 3 projects: 24 passed. The hardened test with --repeat-each=30 on 4 workers: 90 passed.

## Left undone

- The root cause is not proven, because nothing reproduced it. If it recurs, keep its trace (`--trace=retain-on-failure`
  for that run).

## Needs a human

- Nothing.
