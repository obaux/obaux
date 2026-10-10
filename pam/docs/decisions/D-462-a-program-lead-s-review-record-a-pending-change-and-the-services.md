# D-462 — A program lead's review record, a pending change, and the services a program offers

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-submissions-and-services`

**Decided by Will, 10 October 2026.** On where the services a program offers
(and their policies) should be kept, Will approved option A: "I trust you will
make Pam fully functional. Do what you must." Option A was a new table for the
services, with their policies in the table after it. The rest — the review
record and the pending change — implements what Will already decided in D-386
(the program review queue) and D-447 (editing a live program, 10 October).

## The decision

Four things, in the database, none of which the live app calls yet:

- **`program_submissions`** — one row per time a lead sends a program, as
  `docs/design/program-review-queue.md` (D-386) specifies: `details` is exactly
  what was sent, `status` is `in_review`, `changes_asked`, `approved`,
  `withdrawn` or `discarded`, `replaces_id` links a start-over to what it
  replaced, `changes_note` is Pam's note. A lead reads their own program's;
  a super admin reads all; members never; **nobody writes a row directly** —
  only the functions below do. One open submission per listing, enforced by an
  index, not by the screen.
- **`withdraw_program_submission`** — "Delete and start over" (D-385). The
  submission becomes `withdrawn`; a first listing is taken off (`is_active =
  false`) so it can never go live by being approved late; nothing is deleted. A
  program someone else owns reads as "not found", so a guess at an id learns
  nothing.
- **`request_program_change`** — D-447's rule, built. A live program's new name,
  address or kind of help is held as a `change` submission beside the live row,
  which keeps serving members until Pam approves. Asking again while one waits
  corrects the same request (D-386: it is the same request, fixed).
- **`program_services`** — a child of the program's listing (D-313): name, a
  sentence or two, and where they differ from the program's, a phone, website,
  address and hours. Members read a live program's; its lead manages their own,
  including while it is being checked; nobody else writes. Policies per service
  are the next table, as agreed.

`submit_program` (D-447's first migration) also leaves a record now, and a
withdrawn program no longer counts as "already in review".

## Not in this decision

The super admin's side — approve, ask for changes, discard — is part 6, so
nothing in these migrations can approve a submission. Until it is built, a
program is cleared the way a listing always was: a super admin or admin writing
`services` directly. The app screens that read these tables are the next part,
after this one is live. A booking pointing at one service
(`appointments.program_service_id`, and `book_trip` taking it) is part of that
next part: changing `book_trip`'s signature is a contract step and will be its
own migration.

## What a later session might reverse

- **One open submission per listing**, with a correction replacing the open
  change rather than queueing behind it. If Pam wants to see a history of
  corrections, add a column, not a second open row.
- **A lead's services apply at once** (D-447's "description, phone, website
  apply at once", extended to services). If Pam wants services checked, put them
  behind a submission the way a name change is.
