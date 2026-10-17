# 2026-10-13 — the way on after Sign in, W6 and the polish

**Branch:** `claude/places-programs-signin-next-follow-up` · **Lane:** Places & programs (Piper)

## What changed

- W6: a person who has never been asked about reminders no longer gets `/reminders/` instead of the listed way on; the way on wins and the reminders question waits for the next sign-in.
- The stored way on is forgotten whenever it is not taken (an invite to add a program, an invite that cannot join, a non-member): `SignInScreen` takes it as soon as the account is known to exist, so it can never fire on a later visit to Sign in in the same tab.
- Polish: only a member is taken to Add my program (`takeNext` returns null for a program lead, a case manager and a super admin, and still forgets it). A brand-new account in the join flow (no role yet) is a member's.
- Tests: `signinNext.test.ts` (6) and `signin-next.spec.ts` (a case manager and a super admin are not sent; storage is empty afterwards).

## Left undone

The phone-code path itself (the code step with reminders unasked) is not run in an e2e; it is covered by the unit rules and by reading `SignInScreen`.
