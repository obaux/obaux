# D-543 — A program has its own card on the transparency screen: what it sees before a visit

**Date:** 2026-10-11 · **Branch:** `claude/lena-program-sees-before-a-visit`

**Decided by:** Will, 11 October 2026, 20:22 and 20:24 (relayed by the merge desk): members must be able to message a program before booking, and "communicate what programs can see, even before the person books". The structure below is mine (Lena) and Sage's (signed 20:42); Will can reverse it.

## What was wrong

`privacy.s.sharing.p2` began "A program sees you only after you sign up with them or plan a visit there", and the site said "only after you sign up with them". Neither was true. A program already reads a member's first name and the day they signed one of its rules with no sign-up (`program_policy_signers()`, 20261010150922), and with D-541 a member can write to a program from its page with no sign-up and no visit. Before a visit a program sees a first name and what a member does with it, and a member had been told nothing.

## What changed

- **Privacy, `sharing.p2`, line 1.** It names the four ways a program comes to see a member (write to them, sign their rules, sign up with them, plan a visit) and says what they see before a visit: first name, what you write, the day you signed their rules and, if you signed up, how that is going. Lines 2–4 (Will signed them, a63) are unchanged. Sage's edit: the paragraph's own word for a program is "them/they".
- **A new card on the transparency screen, "A program can see:"**, five lines (`transparency.program.*`). The first card is headed "Your guide can see:", so a fact only a program reads (a message to it, a signature on its rules) cannot stand in it without telling a member their guide reads it. The old `transparency.canSee.signed` was in that list and was wrong twice: no case manager can read a signature, and "a program you joined" was not the test (signing needs no sign-up). It is now line 3 of the new card, in new words (Will's a25 point 2 wording moved).
- **The short version** (Profile › What others can see) has one more line, `transparency.summary.program`. Will approved the four before it on 9 October (D-427).
- **The contract** (`transparency.ts`) lists `first_name_and_words_to_a_program_they_message` and `first_name_and_day_signed_on_a_programs_policy` as seen, and keeps hidden `the_note_a_member_keeps_on_a_visit` and `a_sign_up_written_by_the_member_or_a_lead_directly`: two gaps found the same day (a lead could read whole appointment rows, note and how a visit was marked; members and leads could write enrollments, D-541 test 64), which are being closed, not disclosed.
- **The site** (`WhatOthersCanSee.tsx`) carries the same two sentences word for word; its column is "A program", with a row for the day you signed a program's rules.
- **Test:** `program-sees-before-a-visit.test.ts` holds the contract, the Privacy page, the screen and the site to one story, and fails if any line says a program reads a note or how a visit was marked.

## What a later session might reverse

- The card is the heaviest part: Will may prefer one line in the guide's list. It cannot be a guide line (a guide does not read a message to a program), so the alternative is a separate screen, not a reworded line.
- "A program cannot write to you first" is deliberately not said anywhere (Sage, 20:42). Today a program can open a chat with anyone enrolled with it, so as a blanket promise it is false. If D-541 makes it true for everyone and a test says so, it is Will's to add.
- The site's Messages in Pam post (`MessagesInPam.tsx`) still says a member may message "a program you joined … Nobody else can start a chat with you". It becomes false the day D-541 ships and must change in that deploy (Wren).

