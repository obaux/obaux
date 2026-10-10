# 2026-10-10 — messages reminder rehearsal

**Branch:** `claude/messages-reminder-rehearsal` · **Lane:** Messages & notifications (Nico)

## What changed

- `packages/db/test/36_day_before_reminder_rehearsal_test.sql` (35 went to Piper's Cancel): 44 checks.
- `packages/config/test/dispatch-sms.test.ts`: 18 tests of the real `dispatch()` with `fetch` faked.
- A go-live runbook at the top of `docs/sms-setup.md`.
- No application code, no migration, no new wording.

## What was wrong, and what missed it

Four gaps in the reminder path, pinned as KNOWN GAP checks and reported to the merge desk:
evening visits are reminded on their own day (quiet hours push 9 pm+ reminders to the morning of
the visit, still "tomorrow"); texts turned on later queue nothing for trips already planned; the
trigger cuts a long place name mid-word; an overdue reminder is not dropped after its visit.
Nothing tested the path from trip to text as a whole.

Not a gap, checked: cancel, move, move to under a day, STOP, never-asked and quiet hours all
behave. The signed text carries time, street and link only, so naming a service changes nothing.

## Decisions made

D-473.

## Verified

DB test run alone against a fresh database: 44 pass. With the trigger's cancel branch removed it
fails on "cancelling a trip cancels its reminder". Dispatcher tests: 18 pass.

## Left undone

Fixing the four gaps (Piper's trigger and a call on timing). YES/NO replies. The 2-hour and
morning-of reminders, which nothing queues.

## Needs a human

Will: nothing new. The merge desk: decide the four gaps; the runbook's switch-off uses
`cron.alter_job`, which I could not run locally (no pg_cron here).
