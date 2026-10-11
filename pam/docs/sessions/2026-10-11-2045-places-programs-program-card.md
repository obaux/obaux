# 2026-10-11 — a program's view of a member, and what a program can read of a visit

**Branch:** `claude/places-programs-im-here` · **Lane:** Places & programs (Piper)

## What changed

- Migration `20261011060000_a_program_lead_reads_no_appointment_row_directly` (ahead of `…145930`): `appointments_provider_select`
  altered to `using (false)`, so a lead reads visits only through `my_program_visits`. Test 65.
- Migration `20261011203852_a_program_lead_reads_a_small_card_for_a_member_linked_to`: `program_member_card(member)`. Test 66.
- `/person/?id=` for a lead shows `ProgramMemberCardView` instead of "not found"; Home's visit names link to it. `useProgramMemberCard`.
- `person.card.note` (English in all seven files, allow-listed). e2e in `program-visits.spec.ts`.

## What was wrong, and what missed it

a63 promised a program never learns how a visit was marked, but RLS let a lead select whole rows. Tests checked the function's columns
(test 60), not the table. Test 65 now reads the table as a lead.

## Decisions made

D-542. Policy is `false`, not `provider_id = auth.uid()` as Mira asked, because a lead-booked row still carries `attendance_method`.

## Verified

DB suite passes; config tests; tsc; program-visits e2e 21/21. See the READY message for the full e2e, Storybook and fit.

## Left undone

Nico's D-541 (message a program before booking) decides who may open a conversation (`open_direct_conversation`); the card's Message
row calls `openConversation` and falls back to Messages. Sage signs `person.card.note`, Lena translates it. Held for Will's signature on a63 line 1.

## Needs a human

Will signs a63 line 1.
