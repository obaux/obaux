# 2026-10-10 — places programs policies p3

**Branch:** `claude/places-programs-policies-p3` · **Lane:** Places & programs (Piper)

## What changed

Policies P3 (D-485, a25 point 1). Stacked on P2. Migration `20261010150922`, expand only: `program_policy_signers(program)` returns policy, member, FIRST NAME and date for the program's own policies, to its own lead (and admins); any other program reads as not found; no picture, no last name, no phone. App: a real lead's policies carry `signedBy` from it, so the existing Signed tab, the "Signed by N" counts and the verified tick (`isVerified`, `signedBy`) now read real signatures with no change to those screens.

## What was wrong, and what missed it

Nothing found.

## Decisions made

D-485.

## Verified

Whole database suite passes (new test 47: the lead reads two signers by first name and date; no picture/phone/last-name column exists; the lead still cannot read the table; another program's lead and a member are refused; a super admin reads any; signed-out refused). Web 93, tsc clean; e2e program-policies (new Signed-tab test) + policies: 36 passed on all three phones.

## Left undone

P4, only for this service. The verified tick shows only for real people the program sees; the screens that list people still list example people for a real lead until members are linked to programs for real.

## Needs a human

Mira: apply `20261010150922` after P2's.

## Rework after the merge desk held it (15:25)

`program_policy_signers` let in `is_admin()`, which on live includes case managers (0082: they reach assigned members only). Now the program's own lead or `is_super_admin()`; a case manager, even one covering a signer, gets PROGRAM_NOT_FOUND (test 47). Also: `program_policies_select_admin` and `can_read_policy_file` use `is_super_admin()` (case managers still read current policies of live programs like anyone signed in, not archived or not-yet-live ones); `archive_policy` checks `is_active_account()`; `add_policy` leaves `p_replaces` out of the 30 cap; `reminder_is_quiet` pins its search path. All create or replace / alter, no DROP.
