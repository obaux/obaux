# 2026-10-16 — accounts request refusal stories

**Branch:** `claude/pam-request-refusal-stories` · **Lane:** Accounts & invites

## What changed

- Lena asked for this in her weekly review of the staff-request words (D-491). The lines Approve can end on were
  drawn by no story, so her fit audit could not see them in any language. These are requests.done (already had an
  account, now a program lead too), and requests.failed.pair, .city, .decided and the plain requests.failed.
- Five stories in Super admin/States/Decisions use the long-named request r-3 (Anna-Christina
  Castellanos-Whitfield). Each confirms Approve and lands on its line.
- The Storybook mock answers `review_staff_request` and `profile_roles`, which were unmatched before. A new
  `staffReview` option picks the answer: through, refused (pair, city, decided), failed, or added to an existing
  account.
- Stories only. No app code or words changed.

## Verified

- `tsc` is clean and Storybook builds.
- In the build, all 10 lines (title and body of each state) are drawn in full, with the name filled in, in all seven
  languages: 70 of 70.
- None of the five stories logs `[journey] no fixture`.

## Left undone

- Lena audits fit at both heights. Her word changes (ed85e716) are on her own branch. This one is off main, so it
  shows main's words until both merge.

## Needs a human

- Nothing.
