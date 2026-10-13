# D-568 — A case manager asks to join from the website; refused and unanswered requests are deleted

**Date:** 2026-10-13 · **Branch:** `claude/pam-case-manager-request`

**Decided by:** Will, card a84, on the merge desk's advice: the super admin approves case managers alone; a work email
is required; a refused request is kept 30 days. The merge desk read the plan (13 October, 19:21) and set the order (the
new number first, then this). Then, after Lena checked the Privacy words (p15): a refused request is purged 30 days
after the decision, covering any refused row that exists when this ships (19:27); the purge also deletes the
requester's sign-in when they have no profile, never when they have an account (19:48); a request nobody answers is
purged 90 days after it was made, a setting, with the sign-in on the same terms (19:48, 19:51). Lena (19:30): approved
rows must not be purged, because `useProgramRequest` (D-525) reads the row to know an approved request is not reopened.

## What

- **The way in:** the website's "Join as a case manager" (Wren's button) opens `/join/case-manager/`. Until now a case
  manager could only come in by an invite from the Pam team (D-369: Join without a link is a member's sign-up).
- **Sign in first.** The page asks for the phone and the normal code before anything else. Nothing is stored for a
  phone nobody proved, the code is the rate limit (one a minute, to a real phone), and there is no public form for a
  bot to fill.
- **The form, the fewest fields that let the super admin decide:** first and last name, the city they work in (one Pam
  serves, from the list), where they work, and their work email (D-441: staff need one). Nothing else: no ID, no
  caseload. `request_case_manager_access` checks the same in the database (`INVALID` otherwise).
- **It is a staff request like any other** (`staff_requests`, `wants_role = 'admin'`): the super admin's bell, the
  Requests list (now with where they work), the request page (now with "Works at" and "Work email"), Approve/Deny and
  the approved and denied texts are the existing ones. Nico has nothing new. `request_staff_access` and
  `review_staff_request` are untouched.
- **On approval** the account becomes a case manager in the city the super admin picks (as today), and the work email
  moves onto the account, into `profile_emails` (D-441's table, which only a super admin reads; an account keeps the
  first email it was given), and off the request row, so it is kept in one place. A trigger does this
  (`staff_request_email_to_account`), so `review_staff_request` did not need replacing.
- **Asking again** (D-525): a waiting request is not sent twice, an approved one is not reopened, a refused one can be
  asked again; the page fills in what they sent last time, except the email.
- **Somebody with an account** cannot use this (`HAS_ACCOUNT`): approving a case manager onto an existing account is
  refused anyway (`ROLE_PAIR_NOT_ALLOWED`, D-491), so the page tells them to contact Pam.
- **A sign-in that asked is never sent into member setup.** Sign in sends a sign-in with no profile to Join; Join now
  reads the sign-in's own request (`staff_requests_own`) and, for a case manager request, goes to `/join/case-manager/`
  (waiting, or refused with "Ask again"). The read has a 3-second limit; no answer reads as no request, so a slow
  network cannot leave Join on Loading.
- **The answer is texted.** The decision is an account text (`staff_request_approved` / `staff_request_denied`), which
  goes out whatever `texts_live` says (D-481, migration 20261010141859). Sage signed the waiting screen as "We will
  text you the answer. You can also sign in with this phone to see it." (A29, ledger `claude/sage-signs` @ 6ced4a4d).
  My first draft promised no text, on the wrong reading that texts are off for this too; `join.staff.*` is true and
  stays.

## Forgetting (`purge_staff_requests`, nightly at 03:55 where pg_cron is installed)

- A **refused** request is deleted `refused_keep_days` (30) after the decision; one **nobody answered**,
  `unanswered_keep_days` (90) after it was made. Both numbers are in `staff_request_rules()`, one place, so a different
  answer from Will is a one-line change.
- Each deletion also removes the super admin's bell rows that named the person and any "no" text still addressed to
  the phone (sent with no member, so it carries the number), then the sign-in that asked **only when it has no
  profile** (`remove_temporary_signin`, the same function and body as D-567's, so either migration can run first).
  A sign-in with an account is never deleted: a member's refused program-lead request (D-525) loses only the row.
- **Approved requests are never purged.** They stay with the account and go with it (`user_id` cascades).
- It covers every staff request, program-lead ones included, and any refused row that exists when it ships (live had
  one row, approved, on 13 October).
  Confirmed by the merge desk, 13 October 21:28, option (a): both purges cover every staff request, a member's "add
  a program" request (D-525) included — "one rule, and nothing kept forever". Lena widens Privacy p15 to name program
  requests before Will signs a84.
- The audit log keeps what it already had: `staff_request.deny` with the role and no name. Nothing here writes a name,
  a phone, an organization or an email into it (D-443); the DB test checks the approval rows.

## Proof

`packages/db/test/73_a_case_manager_request_is_purged_without_test.sql` (47 checks): anon can't ask; an account can't;
each field is required and the email has to look like one; a city Pam does not serve is refused; one waiting request
at a time; only the asker reads it; asking makes no profile; the bell lights; a sign-in can't write a staff profile or
decide its own request; approval makes a case manager, moves the email onto the account and off the request; no audit
row holds the email, organization or name; refused, then asked again; the purge deletes a 31-day refusal with its
sign-in, bell rows and "no" texts, keeps a 29-day one, deletes a 91-day unanswered request with its sign-in, keeps an
89-day one, deletes the rows of two people with accounts and keeps their sign-ins and accounts, never touches an
approved row; nobody but the job can run it. `e2e/case-manager-request.spec.ts` (6 tests × 3 projects).

## Not done

- The website button (Wren). The six other languages for the 23 new strings (Lena), after Sage signs them.
- An email for a case manager approved before this (none on live), and showing the email anywhere else.
- A program lead's request from the website: still the invite or the member's Add a program (D-525).

## Would reasonably be reversed

- **Super admin alone.** Will may want a program lead in that city to vouch first (card a84, option a).
- **The 30 and 90 days** (one line in `staff_request_rules`).
- **Moving the email off the request on approval.** If the super admin wants to see it on an approved request, it is
  on the account (`profile_emails`).
