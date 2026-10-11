# D-535 — I'm here: a member marks their own visit

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-im-here`

**Decided by:** Will (via the merge desk), 11 October 2026: "we do want points to work for attending programs in Pam … we can't rely on a guide, because not everyone has one. In fact many users may use Pam just to navigate their city better without a case manager. So we need a way to reward them." Details settled with Mira, 11 October 05:45 UTC.

## What

A member can mark their own visit, at any place, with or without a lead:

- **"I'm here"** asks the phone where it is once, on the tap. The database (`i_am_here`) compares it with the place's stored location. Within 150 m, in the visit window, the visit is attended by `geofence` and pays `attend_appointment_verified` (100). Further away nothing is written and the member can tap again.
- **"I went"** (`i_went`) sends no position: attended by `sms_reply`, pays `attend_appointment_sms` (60), at most 3 in any 7 days.
- Both: own visit only; from 2 h before it starts to 3 h after it ends; planned at least 2 h before it starts; never cancelled; one award per visit (the ledger's unique index).
- A lead's mark after a member's "I went" upgrades the visit and pays the 40 difference once; a visit the phone already proved pays nothing more. A lead's undo takes back only the lead's part and refuses a member's own mark.

## The position is never kept

Used in one comparison in the function, then gone: no table, audit row, notice or ledger row holds it (test 59 checks this). The numbers travel in a POST body. Checked on the live project on 11 October: gateway log rows carry the path, user id, IP, user agent and content length but no body (and no query string); `log_statement` is `ddl`; parameters are not logged on error; `pg_stat_statements` normalises values. What logs do show is that a signed-in account called the function at a time, from an IP address: Privacy must not say more than "Pam does not keep the position your phone sends".

## Nobody is shown how a visit was marked

`my_program_visits` and `my_trips` return the status and time only. `attendance_method` is not returned to any lead or guide.

## Why a weekly cap of 3, and the 2-hour rule

A word costs nothing to say; a phone's position is harder to fake. Self-reported awards are capped; the cap is not applied to a position check. Planning a visit and claiming it in one go is refused (`PLANNED_TOO_LATE`).

## What a later session might reverse

The window (2 h before to 3 h after the end), 150 m, the cap of 3, and whether "I went" should be offered at a place with a lead (it is: earning must never depend on a lead).

## Waiting for Will

The Privacy line (Lena and Sage word it from five points sent to the merge desk). The strings are English in all seven files until he signs.
