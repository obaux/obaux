# D-475 — A text that is overdue is cancelled instead of sent late

**Date:** 2026-10-10 · **Branch:** `claude/messages-overdue-cutoff`

The merge desk decided (for Will, 10 October) after the reminder rehearsal (D-473, known gap 4):
the claim never hands over a day-before reminder whose visit has already started, and cancels a
time-bound text that is more than 12 hours late. No new words. Migration
`20261010130754_a_text_that_is_overdue_is_cancelled_instead_of_sent_late.sql`: `claim_outbound_messages`
replaced with the same signature, expand only.

- **Visit started:** the three appointment reminders, cancelled with `the visit has already started`.
- **12 hours late:** cancelled with `it was more than 12 hours late` for the texts whose whole point is
  the time: the sign-in code, the three appointment reminders, "did you make it today", "you have a
  new message".
- **Still sent however late** (late is still useful): invitations, a decision on a staff request, the
  notice that parts of the app are off, a saved place that closed, someone wanting to connect, a
  program connecting you, a visit booked/changed/planned (to staff), and the gentle follow-up to a
  missed visit.
- **Quiet hours are allowed for.** The limit is 12 hours or one hour past the member's own quiet window,
  whichever is longer. With the default window (9 pm to 7 am, 10 hours) that is 12 hours; a member with
  a 16-hour window is not stripped of every text held overnight. Without this, a member who set a long
  window would lose reminders that did nothing wrong.

Tested in `38_overdue_texts_are_cancelled_test.sql` (numbered 37 on its branch; renumbered at merge, as Piper's reminder-gaps test took 37 first); test 36's former KNOWN GAP 4 is now a plain check.
Reverse by replacing the function again with 20261010072848's body.
