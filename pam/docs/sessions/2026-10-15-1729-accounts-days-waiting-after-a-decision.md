# 2026-10-15 — accounts days waiting after a decision

**Branch:** `claude/pam-days-waiting-decided` · **Lane:** Accounts & invites

## What changed

- Iris re-tested b44, and the super admin pass passed apart from one note. After approving a late program, "Days
  waiting: 4" still showed under "Hearth Kitchen Training is approved".
- `ProgramReviewScreen` now shows the review.days line only while the program waits for a decision:
  `!decided && isLate(program)`. No new words.

## What was wrong, and what missed it

- D-584 added the decided notice at the top of the page but left the days line keyed to `isLate` alone. A decision
  made on this screen doesn't change the loaded program's status, so `isLate` stayed true. No test looked at the line
  after a decision.

## Checked: the list and isLate agree

- `isLate` is `status === 'in_review' && daysWaiting >= REVIEW_DAYS`. It is already false for withdrawn and
  changes_asked, and the unit tests say so.
- The list (`ProgramsToCheckScreen`) uses the same `isLate`. It loads fresh when opened, and `programs_to_check`
  returns only in_review, changes_asked and withdrawn. Approved and discarded programs leave the list, so it never
  counts their days.
- One edge, left as it is: `programFromRow` maps any status it doesn't know to `in_review`. If the function ever
  returned approved or discarded rows, they would count as waiting. It doesn't today, so this was not widened.

## Verified

- The new e2e assertions failed before the fix: Approve and Ask for changes each still showed the line. They pass
  after it.
- Days waiting shows while a late program waits. It is gone after approve, changes asked and discard. A program
  waiting on its leader shows no days, even at 9.
- `tsc` is clean and the programsToCheck unit tests pass (6). After build:e2e, programs-review, super-admin-pass and
  a11y pass on all three projects: 81 tests.

## Left undone

- Nothing.

## Needs a human

- Nothing.
