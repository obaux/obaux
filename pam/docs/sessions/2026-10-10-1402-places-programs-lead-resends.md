# 2026-10-10 — places programs lead resends

**Branch:** `claude/places-programs-lead-reads-review` · **Lane:** Places & programs (Piper)

## What changed

Part 5b. The lead's screens already read their program and its open submission from the database (the earlier 'load a lead's own program' job), so the review wait and Pam's note were already real; what was missing was answering a request for changes. Migration `20261010135742`, expand only: `resend_program_submission(id, …)` puts the SAME submission back in review with corrected words (listing and record both), clearing the note; the wait restarts after a change request and is kept for a correction while waiting; first sends only (a live program's change is corrected through `request_program_change`, which already did this). App: Edit and send again (`/programs/new/?edit=1`) resends instead of calling `submit_program`, and fills in from the database (not the tab); editing a program still being checked goes through the same function so the reviewer reads the corrected words.

## What was wrong, and what missed it

Edit and send again called `submit_program`, which refuses while the listing is in review: a leader asked for changes could not answer. And a correction made in place changed the listing but not the record of what was sent. Neither showed until part 6 gave Pam a way to ask for changes.

## Decisions made

None new (D-386 as written).

## Verified

Whole database suite passes (new test 42: same submission, note cleared, listing and record corrected, wait kept/restarted, another lead and a member refused, closed and live-change submissions refused, signed-out refused). Web 77, tsc clean; e2e new program-resend (reads from the database, calls resend not submit) plus a11y, account, join: 117 passed on all three phones.

## Left undone

Real policies per service (D-313 step 2); switching between a lead's programs (D-318). A bell row for the leader and the approval text (need Will).

## Needs a human

Mira applies the migration at merge (after part 6).
