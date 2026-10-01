# 2026-10-01 — Readiness review, the holes it found, and blocking

**Phase:** 1 · branch `claude/hopeful-thompson-07nj7n`, rebased onto `main`
at `23cb190` (it carried one unmerged 17 September commit — D-207)

## What changed

**The review (30 September, D-204).** Will asked how ready PAM is for
production. Every suite re-run on `main` (config 231, ui 65, db 302,
Playwright 507, bundle 505.3 kB — all as STATUS said); the live project
queried directly; Vercel read for the production deployment; a code-audit
subagent's findings re-checked against the live policies and grants before
any was repeated. Will's calls on the findings: keep placeholder hours (for
investors), keep the free Supabase plan, fix the security holes, build
blocking.

**`packages/db/migrations/0068_close_readiness_gaps.sql`** (D-205):
`to_e164()` + `normalise_phone` triggers on `profiles` and
`outbound_messages`; `start_membership()` copies the verified phone;
`redeem_invite()` compares the formatted number; backfill. `guard_connection`
trigger + column grants on `connections`. `conversation_members` updatable
only in `last_read_at`; `messages` not updatable, insertable only in content
columns. `flag_service()` hides at once only for vouched accounts or a
second flagger, ten a day. `profiles` select granted column by column
without `phone`.

**`packages/db/migrations/0069_blocking.sql`** (D-206): `blocks` table;
`is_blocked_between()` and `can_message()` honour it; `messages_insert_sender`
refuses into a blocked conversation; `conversation_block_state()`,
`block_in_conversation()`, `unblock_in_conversation()`.

**Web:** `useThread` reads the block state (a failed read shows no block —
the database still refuses the send) and exposes `block`/`unblock`;
`ThreadHeader` gained a `trailing` slot; the thread page draws a 48px
`MoreMenu` and an `AlertDialog`; `ThreadView` replaces the composer with the
block state, Unblock for the blocker and "Call PAM for help" for the
blocked. Eleven `messages.block.*` keys, en and es. D-207's saved-places
change re-applied to `places/page.tsx` after the rebase.

**Tests:** `packages/db/test/08_readiness_and_blocking_test.sql` (new);
`04_rpc_test.sql` reads the approved profile by named columns and checks the
phone as the server; `e2e/messages.spec.ts` gained four blocking tests and a
block-state stub; `scripts/journeys.mjs` stubs the new RPC.

## What was wrong, and what missed it

**No invite could have been redeemed on the live project.** Supabase Auth
stores a verified phone as `12675551234`; `profiles.phone` must be E.164
(0002). `redeem_invite()` and `review_staff_request()` copied the raw number
and would have failed the check. Every fixture writes `auth.users.phone`
with a "+", so 302 checks passed; the live project has no invited account,
so nobody noticed. Found by querying the shape of the live numbers (not
their values) while fixing the self-sign-up phone. The new test file stores
Auth numbers the way Auth does.

**STATUS.md had drifted in places nobody re-read**: the opening paragraph
still said no member-facing flow existed, the production URL was a team
alias, and "Next" said `0052` never deployed. Corrected.

**My 17 September commit sat unmerged for two weeks** while `main` reused
its decision number (D-159). Renumbered D-207 during the rebase, its session
log corrected before it ever reached `main`.

## Decisions

- D-204 — the review, and what Will kept (hours, free plan).
- D-205 — 0068; D-071 narrowed for unvouched accounts only; the case
  manager region arm left for Will.
- D-206 — blocking: own table, both ways, undone only by the blocker.
- D-207 — the demo view reaches saved places (formerly D-159).

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 |
| `pnpm --filter @pam/config test` | 231 pass |
| `pnpm --filter @pam/ui test` | 65 pass |
| `pnpm --filter @pam/web test` | 8 pass |
| `pnpm --filter @pam/web build` | OK |
| `node scripts/check-bundle-budget.mjs` | 505.7 kB of 600 (+0.4 kB) |
| Playwright, full suite | **519 pass** (507 + 4 blocking tests × 3 projects) |
| `pnpm --filter @pam/db test` | **Not run.** The sandbox's permission check refused the script (as root it `chmod o+x`es every parent directory up to `/`). `0068`, `0069` and `08_readiness_and_blocking_test.sql` were reviewed line by line instead, and the earlier test files checked for anything the new grants would break (one fixed in `04_rpc_test.sql`). |

## Left undone

- **Run the DB suite**, then deploy `0068` and `0069` — before this branch
  reaches `main`, or the blocking menu calls RPCs the live project lacks.
- The HELP auto-reply (Twilio Console), STOP not recorded in PAM, and the
  region-arm question — STATUS rows 29, 32, 30.

## Needs a human

- Permission to run `pnpm --filter @pam/db test`, or a run on Will's side /
  in CI (the CI job uses a Postgres service container and never touches
  directory permissions).
- Deploy `0068` + `0069` after the suite is green.
