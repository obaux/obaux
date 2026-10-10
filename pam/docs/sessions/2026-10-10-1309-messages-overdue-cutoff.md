# 2026-10-10 — messages overdue cutoff

**Branch:** `claude/messages-overdue-cutoff` · **Lane:** Messages & notifications (Nico)

## What changed

- Migration `20261010130754_…`: `claim_outbound_messages` (same signature, expand only) cancels a
  reminder whose visit has started and a time-bound text more than 12 hours late, quiet hours allowed for.
- Test 37 (new, 11 checks); test 36's KNOWN GAP 4 is now a plain check. Runbook switch-off updated; the
  pause is marked verified on the live project (merge desk, 10 October).
- Branched from my rehearsal branch (81a6681), not main: the merge desk's fixes to test 36 (ids moved to
  d0x, two checks scoped to the test's own members) are not on origin yet, so test 36 will conflict
  on merge in the places she changed; keep her versions, and the gap 4 block here.

## What was wrong, and what missed it

A text could be sent long after it was useful. Nothing tested lateness until the rehearsal.

## Decisions made

D-475.

## Verified

DB suite; tests 36 and 37 alone against a fresh database; config tests twice.

## Left undone

Gaps 1–3 (Piper's trigger). `verify_code` expires in 10 minutes but only the 12-hour rule applies to it.

## Needs a human

Nothing.
