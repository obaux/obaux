# D-473 — The day-before reminder is rehearsed end to end, and four gaps are pinned

**Date:** 2026-10-10 · **Branch:** `claude/messages-reminder-rehearsal`

The merge desk asked for a go-live rehearsal of the day-before reminder, Pam's north star,
in the local stack with Twilio faked at the HTTP boundary. It stays in the suite:

- `packages/db/test/36_day_before_reminder_rehearsal_test.sql`: book_trip and
  book_trip_at_service queue the reminder, the claim hands it over only when due and
  allowed (quiet hours, STOP, never asked), and a cancelled or moved trip does not text the
  old plan. A mutation (removing the trigger's cancel branch) turns it red.
- `packages/config/test/dispatch-sms.test.ts`: the real `dispatch()` with a faked `fetch`:
  the signed words in all seven languages, the 134/160 limit with long real place names, no
  silent fall-back to English, Twilio refusing, Twilio not configured.

**Gaps found are pinned, not hidden.** Four behaviours are wrong today and belong to the
appointment trigger (Piper's) or the claim (merge desk): evening visits are reminded on their
own day; texts turned on later queue nothing for trips already planned; the trigger cuts a
place name mid-word; an overdue reminder is not dropped after its visit. Each is a check
named KNOWN GAP that passes on today's behaviour, so whoever fixes one sees exactly that
line go red and flips it. They are not fixed here: the trigger is Piper's, and the right
fix for two of them needs a decision about wording or timing.

**The signed text has no place for a program service.** Naming a service on a trip does not
change the reminder. That is by the signed wording; adding one is new words, which are Will's.

The runbook is at the top of `docs/sms-setup.md`. Reverse this only by deleting the tests.
