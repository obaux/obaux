# D-479 — A super admin reviews programs: approve, ask for changes, discard only withdrawn

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-review-queue`

**Decided** by the CTO's answers of 10 October 2026 (Mira, to Piper), building D-386 as Will specified it on 7 October. Will needs to decide nothing here.

**What.** A super admin has a queue of programs to check (`/programs/review/`) and a page per program. Decisions are `review_program_submission` (migration `20261010134145`):
- **Approve**, only from in review. A first listing goes live; a change applies only the four fields the leader sent (name, kind, type, address). The reviewer edits nothing.
- **Ask for changes**, only from in review, with a required note (≤500 characters).
- **Discard**, only a **withdrawn** submission. Pam is a human-touch company: an open request must not vanish because Pam was slow; "Ask for changes" says why instead. Discarding a timed-out open one can come later, with a notification that says so.
A submission waiting on the leader cannot be approved: the leader sends it again first.

**The old path stays sane.** A trigger closes a first-time submission as approved when its listing's `needs_review` goes true to false by any path, so a hand-written approval no longer blocks the leader's one-open-submission index. A narrow backfill (`20261010134146`) gives each of the six org-owned programs on file before the record existed one row.

**Not here.** No new notification kind (changing the CHECK is a DROP the live connector hangs on, D-387) and no approval text (new wording needs Will). The leader learns from their program going live; their screen reading submissions and the note is part 5b. "Message the lead" (D-262) is not built: the list carries a first name only, by design.

**What a later session might reverse.** Discarding timed-out open requests; a bell row for the leader (needs the CHECK widening as manual SQL for Will); letting the reviewer message the leader from the review page.
