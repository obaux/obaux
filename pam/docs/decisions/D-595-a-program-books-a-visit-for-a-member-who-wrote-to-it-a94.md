# D-595 — A program books a visit for a member who wrote to it (a94)

**Date:** 2026-10-17 · **Branch:** `claude/places-programs-a94-booking`

## Decided

Will, 17 October 05:46 (card a94), chose that booking a visit for a member is real: "If a program books an appointment on
behalf of a member, it should show on the member's side." Until now "Book a visit for a member" (D-316) kept the booking in
the lead's own tab and said so (Lena's promise sweep). It is saved now.

**Who can be booked for.** Will's option A as written (Mira, 06:11 and 06:45): a member who has written to the program (a
conversation with one of its leads), signed up with it (enrolled in one of its services: requested, enrolled, active or
completed; "interested" is not signing up) or planned a visit there (a visit not cancelled). Anybody else, and anybody blocked
either way, is refused (`MEMBER_NOT_LINKED`) with the same message for every reason. "Book a visit for a member" lists all
three kinds, each once, first name only (`my_program_bookable_members`; a lead reads no enrollment or visit row directly). A
test holds each case (`packages/db/test/76_…`). Signing the program's rules alone does not count; it is not one of the three.

**What the member sees.** The visit is on their Trips and, when it is their next, on Explore, marked "Booked for you by
{program}". The bell tells them (`visit_booked_for_you`, in the app only; no text). They can move or cancel it like any visit.
Reminder texts for it stay exactly as for any visit (`texts_live` is off).

**Who booked it is stored on the visit** as the organisation (`appointments.booked_by_org`), not a person. The member reads
it through `my_trip_booked_by()` (`my_trips()` keeps its shape); a case manager reads the column under the existing
`appointments_select_admin` rule; a program lead reads no appointment row, and `my_program_visits` / `program_member_card` show
nothing more for a booked visit than for a member-planned one.

**Limits.** Three bookings a day by a program for one member, thirty a day by a program in all (the day is the member's). The
visit must be at one of the program's own live services, ahead of now and within 180 days, with no other live visit there
within an hour.

**Attendance is unchanged.** The member checks in ("I'm here" / "I went"), or the program checks in; a visit nobody marks
becomes missed a day after it ends; the member can mark themselves only for a visit planned at least two hours ahead. A
booking made for right now (a desk booking: the member is at the counter) is covered by the program's check-in — the member
need not plan ahead for it and is not asked to. To the member it reads as a visit that was booked for them and is already
today: the same card, "Booked for you by {program}", and when the program checks them in it reads "Checked in", like any other.

**Case manager.** "Booked by {program}" sits next to the visit on the member's page (and on Past visits). Will is choosing
whether it shows on every booked visit or only on missed ones; the whole choice is `BOOKED_BY_SHOWN_ON` in
`apps/web/src/lib/bookedByLine.ts` (`'every'` now), and every screen asks `showsBookedBy(visit)`. The member's page lists only
visits marked attended (W5), so a missed one is not on it; in `'missed'` mode the line would appear where missed visits are
listed (Home's visit line, a93).

**Privacy wording** (`ADMIN_CAN_SEE`, `who-can-see.p1`, the `transparency.canSee` row, `join.privacy.admin.2`) is Lena's and ships
in the same batch as the signed line; this change edits none of it.

## Why not

- Letting a program book for anyone: it needs one of the three ways a program already sees a member, so booking for them is never the first.
- Storing a person as the booker: the program is who the member knows; a lead who leaves would otherwise change the record.

## Reverse it by

Stop calling `book_visit_for_member` from `bookTrip` (the example path still works); the column and bell kind can stay.
