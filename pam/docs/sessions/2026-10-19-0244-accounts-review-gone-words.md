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
- 320 check in Arabic and Russian with the notice showing: no sideways scroll, no clipped text, the lines wrap. Pictures:
  `docs/design/review/2026-10-19-review-gone/review-gone-320-{ar,ru}.png`.

## Left undone

Approve and Deny are still offered under a request that is gone, as they are under one already decided. Taking them away is
a separate call.

## Needs a human

Nothing.
