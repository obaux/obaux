# 2026-10-19 — accounts review gone words

**Branch:** `claude/pam-review-gone-words` · **Lane:** Accounts & invites

## What changed

Staff request review: `REQUEST_NOT_FOUND` (the request went with the person's account, since `staff_requests` cascades from
`auth.users`) has its own lines, `requests.failed.gone.title/body`, instead of the "already decided" ones (Iris's D-618 table).
Sage signed them at 34b590b0 ("account", not "sign-in"), and Lena translated them into six languages at 96a7b59a.

## What was wrong, and what missed it

"This request was already decided" was shown for a request that was never decided. No test raised `REQUEST_NOT_FOUND`.

## Decisions made

None.

## Verified

- `staff-request-approve.spec`: the new test fails on main, 3 of 3, and passes now. With `invite.spec`, all pass. Config:
  1501 passed. tsc is clean.
- 320 check in Arabic and Russian with the notice showing: no sideways scroll, no clipped text, the lines wrap. Picture:
  `docs/design/review/2026-10-19-review-gone/review-gone-320-ar.png`, reshot without the buttons; the Russian one, shot
  before they went, was removed.

Then, on Mira's call (02:52): once a request is gone or already decided, Approve and Deny go (they could only fail again),
and the header's Back is the way out. A gone request also loses "Text {name}", because the account was deleted and there's no
one to text; if that leaves the list empty, the list isn't drawn. No new words. Two new `staff-request-approve` tests (gone;
already decided) fail on the screen before this change, 6 of 6, and pass now.

## Left undone

Nothing.

## Needs a human

Nothing.
