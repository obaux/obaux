# 2026-10-11 — messages enrollments lockdown and message a program

**Branch:** `claude/messages-program-before-booking` · **Lane:** Messages & notifications (Nico)

## What changed

- Migration `…203659_lock_down_who_can_write_enrollments`: members read their own enrollments only; leads change status/notes on their own org's rows; no one else writes. Test 64 (fails without it).
- Migration `…203917_a_member_can_message_a_program_before_booking`: `message_program(service)`, `can_start_conversation()`, and `open_direct_conversation` / `messageable_people` now use it. Test 67.
- Place page: the Message row and menu item open the conversation (`/messages/thread/?program=`), none where the place has no lead on Pam. The thread screen opens it and swaps the address. `messages.empty.body.provider` reworded to what is true; two new keys for the failure state (drafts in six languages, for Lena).
- e2e `place-message-program.spec.ts`; the Storybook journey answers `message_program`.

## What was wrong, and what missed it

`enrollments_own` was `for all` with INSERT/UPDATE/DELETE granted to anon and authenticated, so a member could enrol at any program and unlock messaging with its leads; `enrollments_update_provider` had `with check (true)`. Nothing had used it (0 rows). No test attacked enrollment writes.

My first `open_direct_conversation` rewrite reused an existing conversation before checking permission, which let a blocked pair reopen; test 12 caught it. Fixed by checking first and giving `can_start_conversation` an arm for "the member already wrote".

## Decisions made

D-541 (both parts).

## Verified

DB suite (all), config tests twice, web unit tests, new e2e, full e2e.

## Left undone

- Held for merge until Will signs the reworded Privacy line (a63 line 1); Sage signs the new app sentences (A29); Lena checks the six drafts.
- `person/page.tsx` untouched (Piper's side: what a lead sees of a member).

## Needs a human
