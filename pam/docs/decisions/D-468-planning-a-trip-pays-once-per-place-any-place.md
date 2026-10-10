# D-468 — Planning a trip pays once per place, any place

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-trip-points`

**Decided** by the CTO (the merge desk), 10 October 2026, under Will's delegation ("Go ahead and decide, you're the CTO"); Will can override.

**What.** Planning a trip earns 25 points, once per **place** ever, at any place (a program or not), members only, with at most three awards a day in the trip's time zone. The award is paid inside `book_trip` (migration `20261010115117`), reason `plan_trip`.

**Why per place, not per trip.** Cancelling a trip takes nothing back (docs/points-awarding.md, principle 5), so a per-trip rule would pay "plan, cancel, plan again" every time. One award per place closes that, and still honours Will's wish that a cancelled trip does not earn, in spirit. Any place pays because the trip itself is the habit Pam wants.

**What it replaces.** The spec's first design (a trigger on `appointments`, once per program). Config's `self_reported_signup` is renamed `plan_trip`.

**What a later session might reverse.** Paying only program places; counting the cap in the member's own zone rather than the trip's; a backfill for trips planned before this (none was done: the ledger is history).
