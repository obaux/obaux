# 2026-10-10 — approve for an existing member

**Branch:** `claude/places-programs-approve-existing-member` · **Lane:** Places & programs (Piper)

## What changed

Mira's live bug (16:07): Approve answered 400 "This person already has an account" for someone who became a member while their program-lead request waited. Migration `20261010160818`, create or replace `review_staff_request`, same signature, no DROP: an existing member (or provider) asked to lead a program gets the provider role on their account (granted by the super admin, acting role provider, org + listing if the request has program details, audit with `added_to_existing`, approved text queued, request decided); their city is kept (`ACCOUNT_IN_OTHER_CITY` if another is chosen); any other pair raises `ROLE_PAIR_NOT_ALLOWED`. The no-profile path is as before. App: `reviewStaffRequest` returns a reason; the review screen explains each refusal in staff words with no "Call Pam", and says plainly when a role was added to an account that existed; subtitles read "Wants to add a program" / "Wants to be a case manager" (Will's wording via Mira). 11 new strings and one reworded, in seven languages (drafts for Lena); `requests.wants` removed.

## What was wrong, and what missed it

The approve path assumed no profile exists; nothing tested a request outliving the person becoming a member. The error card was the member one, shown to the super admin.

## Decisions made

D-491.

## Verified

Whole database suite passes (new test 50: member then provider request approved with both roles, active role provider, own program readable, granted by the super admin, audited and texted; a member asking to be a case manager refused with the code; other city refused; decided request refused; deny works; no-profile path unchanged; non-super-admin refused). Config 1058, web 93, tsc clean; e2e staff-request-approve (new, 4 tests) and invite, admin, directory, programs-review pass on three phones.

## Left undone

P4 (policies, only for this service) waits on Will pasting its migration. A person who already leads a program and is approved again gets no second program.

## Needs a human

Mira: apply `20261010160818`, then Will taps Approve again. Lena: drafts in six languages.
