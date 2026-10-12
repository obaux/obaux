# D-542 — A program sees a small card for a member who is linked to it

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-im-here`

**Decided by:** Will (11 October, 20:22 and 20:24), relayed by the merge desk: residents can message programs before booking, a
program sees a limited profile, and Pam says what a program can see "even before the person books" (a63).

## The database matches a63's promise first

`appointments_provider_select` let a lead read whole rows of any visit at their org's services, or any row they were `provider_id` of:
`attendance_method` (how a visit was marked), `check_in_code`, `geo`, `location_text`. RLS is per row, so a column cannot be hidden.
Migration `20261011060000_a_program_lead_reads_no_appointment_row_directly` alters the policy (not drops it) to `using (false)`.
Mira asked for `provider_id = auth.uid()` only; that still shows `attendance_method` on a visit the lead booked for a member that
the member may have marked themselves, so it is `false`. Nothing in the app reads the table as a lead (every path is a definer
function: `my_program_visits`, `check_in_visit`, `undo_check_in`, `book_trip…`). Restore a narrower policy only with a column-safe
view. Test 65.

## The card

`program_member_card(member)` (migration `20261011203852_…`, test 66) returns a JSON of three keys: `member_id`, `first_name`, `visits`
(this program's non-cancelled visits, as `my_program_visits` shows them). Linked means enrolled in one of the org's services, a
non-cancelled visit there, or a shared conversation with the org's staff. Else `MEMBER_NOT_LINKED` (also for another org's lead, and
for a person who is not a member); not a lead: `NOT_A_PROGRAM_LEAD`.

The screen is `ProgramMemberCardView`, shown on `/person/?id=` to a lead in place of "not found": the first name, a Message row
(`openConversation`; Nico's D-541 widens who may open one), the visits, and one line saying that is all the program sees
(`person.card.note`, English until signed). Home's visit rows link to it. No last name, phone, photo, points or last active.

## What a later session might reverse

Adding a field to the card (a new key in the function and a new line in the a63 words, Will first).
