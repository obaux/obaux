# D-454 — A saved trip queues one day-before reminder, only for someone who turned reminders on

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-save-trips`

**Decided by Will, 10 October 2026.** The north star: "Pam is an app that
conveniently messages people to make it easy to help them access and get
reminded about services. Your job is to bring this vision to life." On how many
reminders a trip should send, answering Piper's question (relayed by Mira):
"I trust you're looking out to make Pam a very great app to use." Mira decided
it, with that as the brief: **one text, the day before.**

## What was true

A trip a member planned lived only in the browser tab (`addedTrips.ts`). The
`appointments` table existed (0004) and nothing wrote to it. The three
reminder texts (`appointment_24h`, `appointment_morning_of`, `appointment_2h`)
existed and were signed. The dispatcher reads one queue, `outbound_messages`
(0039), and nothing put a trip's reminder there. So the done screen's "We will
remind you the day before" had nothing behind it.

## The decision

- A trip a member plans is **saved** (`book_trip`) and can be **moved**
  (`move_trip`) or **cancelled** (`cancel_trip`), each acting on the caller's
  own trips only. The screens read them through `my_trips()`.
- **One text, the day before** (`appointment_24h`), queued 24 hours before the
  visit, in the member's own time. Not the morning-of or two-hours-before texts:
  people who have been away from phones for years are the easiest to lose by
  over-texting, and a second reminder is a one-line change once there is
  evidence it helps.
- **Consent is checked in the database, not the screen.** A text is queued only
  when the member's `notification_preferences` row exists, `sms_enabled` is true
  and `sms_stopped_at` is null (0042: reminders are off until somebody asks). The
  dispatcher's claim does *not* stop a member with no row — it only cancels for
  `sms_enabled = false` or STOP — so the queueing step has to. It re-checks
  whenever the trip changes: turned on after planning, the next change queues the
  text; turned off, it is cancelled.
- **The text follows the trip.** Moved: re-timed in place (one text, never two).
  Cancelled, or moved to less than a day away: cancelled, with the reason
  recorded. A visit less than a day away when planned is saved with no text.
- **Its link goes to the Trips screen**, not to one place: a place's id would
  not fit the 160 characters beside a street and a time (a test renders the
  worst case in all seven languages).
- **Only the member's own trips.** A program booking for a member (D-316) and the
  example places (their ids are not real services) stay as they are, on the
  device, until a later step.

## Found on the way, and closed (second migration)

Writing the tests the day trips became real turned up that **any signed-in
person could write an appointment for any other member**
(`appointments_provider` was `for all … with check (true)`), and a member could
mark their own appointment `attended`, which the points award reads. With a
reminder following each appointment, the first would also have texted the
victim. All appointment writes now go through the trip functions; the policies
only read. It is a contract step (its own migration).

## What a later session might reverse

The one-text choice (add `appointment_morning_of` when there is evidence); the
link to Trips (a short link service would let it go to one place's directions).
