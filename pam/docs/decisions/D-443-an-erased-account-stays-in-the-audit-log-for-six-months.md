# D-443 — An erased account stays in the audit log for six months

**Date:** 2026-10-10 · **Branch:** `claude/affectionate-goldberg-tvu4sz`

Will, 10 October 2026: "When account is deleted the account should sit in audit log
for 6 months before it disappears." The answer to the question 0086 (D-441) left
open: what happens to an erased person's audit rows.

## What was wrong

Pam deletes an account when somebody calls and asks (the Delete my account screen
says "Call Pam"). A plain delete was **refused for anyone who had ever acted**:
`audit_log.actor_id` was `references profiles … on delete set null`, setting it null
is an UPDATE, and the audit log refuses every UPDATE — even from the service key
(0007). 0086 fixed the other half of the blocker (an invited account could not be
deleted because of the invite's own check).

## What was decided and built

Two migrations, **live since 10 October 2026** (Will: "Yes" to applying them), in the order they were applied:

1. `20261010031734_audit_log_keeps_an_erased_account_six_months.sql`
   - A `before delete` trigger on `profiles` writes one audit row, `account.delete`,
     about the profile (`target_id` = its id; `meta` = role, region, and who did it).
     **No name, phone or email** — the audit log never holds them. That row is the
     six-month clock; there is no separate tombstone table.
   - `purge_erased_audit()` deletes every audit row that names an erased account (as
     the actor or as the person acted on) once its `account.delete` row is more than
     six months old, and that row too. It runs nightly (03:30 UTC) from pg_cron.
   - `reject_mutation()` — the append-only guard, shared with `points_ledger` — lets
     exactly one thing through: a DELETE on `audit_log` while a flag that only the
     purge function sets is on **and** the session runs as that function's owner. A
     service-role connection that sets the flag itself is still refused (tested).
2. `20261010031736_audit_log_actor_is_not_a_foreign_key.sql` removes the foreign key
   from `audit_log.actor_id` to `profiles`, so the rows keep the id instead of being
   nulled (nulling them would be the account vanishing at once). It is one `alter
   table … drop constraint`, which the connector may hang on (D-387): if it does, run
   that one statement in the Supabase SQL editor. Migration 1 is safe without it
   (deletions of accounts that acted are simply still refused). **Apply 1 first.**

The privacy policy says it (`privacy.s.how-long.p3`, seven languages; the six
translations are drafts for a native reader, as for every promise in
`docs/copy-changes.md`): "When we
delete your account, we keep a short record that it existed for six months: what it
did in Pam, and what Pam's staff did to it. It has no name, phone number or email in
it. After six months we delete that too."

Verified: DB suite 639 checks, 31 of them new (`22_audit_erasure_test.sql`, and Ivy —
who redeemed and acted — deleted in `21_…`): an account that acted is deleted; its
rows stay under its id; nothing goes one day short of six months; at six months and a
day exactly the rows naming it go and nobody else's; the guard still refuses a
delete or update from the database owner and from a service-role session that sets
the flag; the points ledger gets no exception; clients cannot call either function.

## Applied live (10 October, after `list_migrations` showed no drift)

1. The first migration through the connector (no `drop`). Read back: the nightly job
   `purge-erased-audit` (`30 3 * * *`) is in `cron.job`; `record_account_deletion` and
   `purge_erased_audit` are not executable by `anon` or `authenticated`; the deletion
   trigger is on `profiles`; running the purge once as the owner removed 0 rows.
2. The second (`drop constraint audit_log_actor_id_fkey`) **also went through the
   connector** — D-387's hang was on `DROP TRIGGER` / `DROP POLICY`; a `drop constraint`
   is not held. Read back: no foreign key from `audit_log` to `profiles`, primary key
   intact.
3. **`get_advisors` then flagged `function_search_path_mutable` on `reject_mutation`.**
   0021 had pinned every public function's search path, and `create or replace function`
   without a `set` clause (migration 1) silently resets it. Fixed forward with
   `20261010033722_pin_the_append_only_guard_search_path.sql`
   (`alter function … set search_path = public, extensions`); advisors are back to the
   by-design list. The DB suite's invariant covers only SECURITY DEFINER functions, so it
   did not catch this: the next time a trigger function is replaced, keep its `set`
   clause (the migration check in `numbering.test.ts` is about removals, not this).

## Not done, and found on the way

- **A member who has points still cannot be deleted** (Will said, 10 October, after reading this: yes, deleting a member should delete their points history — the next change, after this one is merged). `points_ledger.member_id`
  cascades from the profile, and the points ledger is append-only in the same way, so
  the cascade is refused. Probed on the seeded data: Marcus (a member with points)
  is blocked; the admins and providers are not. The same shape of fix would work (the
  ledger guard lets a DELETE through only when the member's profile no longer exists),
  but it is a decision about the points history — Will has not been asked. On the
  before-launch list under "Make Delete my account work for everyone".
- No routine for the Pam team yet (profile, email, invites, messages, photos, points
  in one tested call). The delete itself now works for everything except points.
- The nightly schedule is only created where pg_cron exists; the test database does
  not have it, so the schedule itself is unproven until it is applied. Check
  `select * from cron.job` after applying.
- What the six months are *for* is not written into the policy sentence, because Will
  did not say. If it should say "so we can look into a report", that is his sentence.
