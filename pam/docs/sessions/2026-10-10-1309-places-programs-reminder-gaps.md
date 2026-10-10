# 2026-10-10 — places programs reminder gaps

**Branch:** `claude/places-programs-reminder-gaps` · **Lane:** Places & programs (Piper)

## What changed

Migration `20261010130831`, expand only, closes the three KNOWN GAPs of Nico's rehearsal (D-473): (a) `reminder_moment()` picks when the day-before text goes: the 24-hour mark if outside the member's quiet hours; else the end of quiet hours if that is still the day before; else 5 minutes before quiet hours begin the evening before; else today's rule. (b) `queue_trip_reminder()` holds the old trigger body and a new trigger on `notification_preferences` calls it for every future scheduled trip on a real turn-on (not on+unstopped before, on+unstopped now; also on a START that clears a stop). (c) the 34-character cut of the place name is gone. `sync_trip_reminder` keeps its name and trigger.

## What was wrong, and what missed it

The trigger only ran when a trip changed, never when consent did; and it timed everything from the 24-hour mark without asking whether that moment is allowed. Test 28 covered a mid-morning visit only.

## Decisions made

None new: the CTO's decision of 10 October (relayed by Mira).

## Verified

Whole database suite passes. New test 37 (ids f0x, phones ...889x): 21:30, 22:00 and 21:00 visits at 20:55 the evening before; a 06:00 visit at 07:00 the day before; custom quiet hours (22-06); a 21:30 visit outside them is unchanged; no evening text lands on the morning of the visit; under a day ahead keeps today's rule; texts turned on queue both future trips, none for a trip whose moment has passed or a cancelled one; another preference or off-and-on queues nothing twice; START after STOP queues; a long name is passed whole. Config 997.

## Left undone

Test 36's KNOWN GAP checks are not in my tree (36 is not on main yet): when merged they need flipping for (a), (b) and (c). The dispatcher's own quiet-hours check (`in_quiet_hours`, 0039) reads New York time, so for a trip in another zone it can still hold a text this migration scheduled; reported, not changed (not my file). Quiet hours changed after planning do not re-time existing texts until the trip next changes.

## Needs a human

Mira applies the migration at merge and flips test 36's checks.
