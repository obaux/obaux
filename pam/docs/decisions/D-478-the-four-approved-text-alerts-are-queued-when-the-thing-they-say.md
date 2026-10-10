# D-478 — The four approved text alerts are queued when the thing they say happens

**Date:** 2026-10-10 · **Branch:** `claude/messages-alert-texts-wired`

Will approved four texts on 10 October ("Text alerts: approved") and nothing queued them. The merge
desk asked for each to be wired to its real event. Migration
`20261010134429_text_alerts_are_queued_when_the_thing_they_say_happens.sql`, expand only; no new words.

**Per-kind switches needed storage.** The Text alerts screen has a switch per kind but kept one
yes/no (`sms_enabled`), with a note that "a yes per kind is a column and a migration for the day a second
kind is built". This is that day: `alert_message`, `alert_booked`, `alert_changed`, `alert_trip` on
`notification_preferences`, all default off (consent is an act; a carrier rejected a pre-selected opt-in),
written by the person themself. Turning a switch on also records the yes to texts, as the screen always did.
Turning the last one off withdraws it, for a case manager or program only: a member's yes also covers
their reminders and saved-place notices, so one alert going off never withdraws it.

**Events** (three new triggers, none editing Piper's reminder trigger or the bell's):
- a message written → `message_waiting` to the others in the conversation;
- a visit inserted → `visit_booked` to the program's staff and `trip_planned` to the member's current
  case manager; a visit moved or cancelled → `booking_changed` to the program's staff.
  Never to the person who made the change, never to the member the visit is for. Editing a note
  texts nobody.

**Debounce.** One text per change: a text already waiting for the same person and kind covers the next
change (six messages overnight are one text at 7 am); a change while "booked" still waits adds
nothing; a message text is not repeated inside 30 minutes of the last one going.

**Everything else is the existing claim:** a yes to texts, no STOP, quiet hours, a phone number, the
12-hour lateness rule for message texts (D-475). The three visit texts are still useful late.

**Reverse** by dropping the three triggers; the columns are harmless.
