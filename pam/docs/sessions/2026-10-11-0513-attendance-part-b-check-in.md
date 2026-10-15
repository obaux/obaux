# 2026-10-11 — attendance part B: check-in and points

**Branch:** `claude/places-programs-attendance-b-checkin` (on part A) · **Lane:** Places & programs (Piper)

## What changed

Migration `20261011051257`: `check_in_visit(appointment)` and `undo_check_in(appointment)`. A program lead with an active account, for a visit at a service of their own program, from 2 hours before it starts to 14 days after it ends. Check-in sets attended / now / `provider_checkin`, writes an audit row, and pays `attend_appointment_verified` (100) once per visit through the ledger's unique index. Undo puts the visit back to scheduled and writes a reversing `attend_appointment_reversed` (-100) once; checking in again after a reversal pays `attend_appointment_restored` once, then the ledger stops moving for that visit. App: `checkIns.ts` asks the database for real (uuid) visits and only then fills the circle; a failed ask leaves it as it was and says "We could not save that"; the circle is seeded from `my_program_visits`; example visits stay in the session.

## What was wrong, and what missed it

Check-ins lived only in the lead's browser (the file said nothing wrote them), while Privacy says Pam keeps whether you went.

## Decisions made

D-526 (no new ones).

## Verified

Whole DB suite with new test 57: lead pays once and a repeat pays nothing; another program's lead, a member (own visit too), a super admin, a limited lead and anon refused; cancelled, far-future and older-than-14-days visits refused; undo reverses exactly once; re-check-in restores once; a second round moves nothing; Luis is paid separately. Web 119, tsc, e2e program-visits (tap asks the RPC with the visit id, refusal leaves the circle empty, undo asks first).

## Left undone

Part C (missed after 24 h), part D (member Trips line, guide marks). No new strings.

## Needs a human

Mira: apply `20261011051257` (after `20261011050637`).
