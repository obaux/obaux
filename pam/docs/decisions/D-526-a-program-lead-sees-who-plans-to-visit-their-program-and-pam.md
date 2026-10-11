# D-526 — a program lead sees who plans to visit their program, and Pam records who came

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-attendance-a-visits` (part A)

## Decision

Sage found that Pam promises attendance it does not record: the transparency screen says a member's guide sees "if you went or missed one", and Privacy says Pam keeps "whether you went", but check-ins lived only in the lead's browser session and nothing ever marked a visit missed. Mira asked for a plan (card a56); Will answered 11 October 2026: "go, but we do want points to work for attending programs in Pam." This is the record for the four parts, which are separate branches:

- **A. A lead sees real visits.** `my_program_visits(from, to)` (migration `20261011050637`): the visits planned at the caller's OWN program that are not cancelled, with the member's FIRST NAME only, the service picked and whether they were checked in. Program lead with an active account only; another program's lead, a member and a super admin are refused. Window default two weeks back to two months ahead, at most 180 days. Before this the lead's Home showed only example visits and the ones they booked themselves, because a member's profile is not readable by a program without an enrollment. A member's page stays closed: the visit's name is plain text, not a link.
- **B. Check-in writer** (next): `check_in_visit` / `undo_check_in` for the lead of the program that runs the visit, from two hours before to 14 days after; the lead's "here" pays the existing `attend_appointment_verified` rule (100 points, once per visit; an undo within 14 days writes a reversing ledger row, never a delete).
- **C. Missed:** the clock marks a scheduled visit missed 24 hours after it ends, only at places with a lead on Pam (D-498); the lead can still tap "here" for 14 days; missed pays nothing and takes nothing; no missed text.
- **D. What people see:** the lead's circle (real), the member's past visits ("Not marked as there" for the unmarked), the guide's per-visit marks, and the privacy/transparency lines made true ("at programs on Pam", Lena).

Places with no lead on Pam: attendance is unknown, not missed; nobody can check anyone in.

## What a later session might reverse

Whether a lead should also see members' last names (today: no). Whether the clock (24 h) should be longer. Whether a member can say "I did come" (today: they tell the lead, who corrects it).
