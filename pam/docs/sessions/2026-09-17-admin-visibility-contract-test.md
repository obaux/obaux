# 2026-09-17 — `admin_visibility.test.ts` built, and it turns out this sandbox can run `@pam/db test`

**Phase:** 1 (closing the last flagged gap from today's four messaging sessions) · **Sessions so far:** 29

## What changed

Will asked for the last piece named across today's work: `transparency.ts`'s
own file comment claimed a test called `admin_visibility.test.ts` enforces
`ADMIN_CAN_SEE` against live RLS. D-153 had already found it does not exist
anywhere in the repository. Built it — as `packages/db/test/04_transparency_contract_test.sql`,
matching the existing suite's naming and directory convention rather than
inventing a new location, picked up automatically by `pnpm --filter @pam/db
test`'s own file glob.

Four things, matching the four contract lines that moved across today's
sessions:

1. A case manager who **is** a conversation participant reads its full
   history. Proven against a new fixture this file adds: a real
   conversation between `admin_north` (Dana) and Marcus, inserted the same
   way `01_seed.sql` sets up its own — the pre-existing seeded conversation
   has no case manager in it at all.
2. The **same** case manager, who covers Marcus on their caseload but was
   never added to a *different* one of Marcus's conversations, reads
   nothing from it. Same account, same covered member, two conversations,
   opposite answers — the sharpest available proof that participation, not
   caseload coverage, is what grants access.
3. A program admin (Alice, genuinely both linked via enrollment and a real
   conversation participant) gets nothing back from `last_active_at` or
   `phone` through either function that reaches a member —
   `conversation_partners()` (0055) and `provider_linked_members()` (0056)
   — checked with the same `undefined_column`-on-`execute` technique
   `directory_people()`'s own test already established.
4. Restated from a third account (Ray, who participates in nothing): total
   message-table and `conversation_partners()` visibility is zero for a
   case manager who is not a participant anywhere.

Deliberately does not re-test the report path (D-074) — `04_rpc_test.sql`'s
existing "A case manager sees a message only when somebody reports it
(0034)" block already covers it, named explicitly in this file's own
comment so nobody goes looking for it here and concludes it's missing.

**Then installed `postgis`, since asking "can this run here" turned out to
have a different answer than every prior session assumed.** `apt-get
install postgresql-16-postgis-3` succeeded (one dependency 404'd on the
first attempt from a stale package index; `apt-get update` fixed it).
`pgcrypto` was already present. `pnpm --filter @pam/db test` ran for real
for the first time today, against every migration through `0056` and every
test file, old and new.

**221 checks pass, 0 failures.**

This retroactively answers the "unverified against the live RLS penetration
suite" caveat every one of today's four earlier session logs carries for
`0054`/`0055`/`0056`. Those logs are not edited — they are an accurate
record of what was true when each was written — but `STATUS.md`, which is
always current, now says the real thing: verified, not flagged.

## What was wrong, and what missed it

**The test file itself had two bugs, both caught only by actually running
it — reading it carefully first would not have found either.**

1. `\set convo2 '...' -- a comment` — psql's `\set` takes the rest of its
   line as the variable's value; it does not strip a trailing SQL-style
   comment the way an actual SQL statement would. The variable ended up
   containing the comment text appended to the UUID, and the first `INSERT`
   that used it failed with `invalid input syntax for type uuid`,
   immediately and loudly. Existing files in this suite avoid the bug by
   convention (no file puts a comment on a `\set` line) without ever
   stating why; this file's comments now explain it, so the convention
   survives being copied without the reasoning.
2. A hardcoded expectation that Marcus's seeded conversation (`convo1`) holds
   exactly 2 messages. It does not, by the time this file runs:
   `04_rpc_test.sql`'s own "0031: messaging is never switchable off" check
   sends a real message into that same conversation earlier in the suite,
   as a live insert, not fixture data. The check failed on its very first
   real run. Fixed by capturing the actual count with `\gset` immediately
   before this file's own fixture changes anything, rather than hardcoding
   a different, now-correct-until-the-next-side-effect number.

Both are exactly the class of error this project's own standing note about
verification already names: a thing that reads correctly and is wrong.
Neither would have been caught by review; both were caught in under two
minutes once the suite could actually run.

**The larger thing that was wrong: four consecutive sessions today assumed
`postgis` was unavailable in this sandbox without re-checking, after the
very first session hit that error once.** It was one `apt-get install`
away. Nothing forced re-checking it sooner — each session's own scope was
narrow enough that "flag it and move on" was individually reasonable — but
the compounding cost was four migrations and several hundred lines of
hand-written test code that could have been verified as it was written
instead of at the end.

## Decisions

- **D-157** — the new test file's scope and reasoning, the two bugs it
  caught in itself, and the `postgis` finding. Also updates the
  "unverified" framing in D-152/D-155/D-156 by pointing to this entry
  rather than editing them.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/db test` | **221 checks pass, 0 failures** — every migration `0001` through `0056`, every existing test file, and the new `04_transparency_contract_test.sql`, against a real throwaway Postgres 16 + PostGIS 3 + pgcrypto cluster, standing up and tearing down the way `scripts/test-db.sh` describes |
| `pnpm -r typecheck` | 5/5 packages clean |
| `pnpm --filter @pam/config test` | 211 passed, unaffected |
| `pnpm --filter @pam/ui test` | 65 passed, unaffected |
| `pnpm --filter @pam/web build` | succeeds |
| `node scripts/check-bundle-budget.mjs` | 501.0 kB gz, unchanged — no app code touched this session |
| Playwright, full suite (`a11y.spec.ts` + `join.spec.ts`) | re-run for completeness even though no app code changed |

## Left undone

- **Deploying today's migrations to the live Supabase project.** Everything
  above is local verification. `STATUS.md`'s "Fifty-one migrations applied,
  through 0052" line and the "Live RLS fingerprint" row both describe the
  *deployed* project, which is now several migrations behind this branch.
  Deploying, and running `mcp__Supabase__get_advisors` afterward per
  `CLAUDE.md`'s own instruction, is real, undone work — not something this
  session's local-only verification substitutes for.
- **D-152's own gap** (who may start a conversation should be a database
  rule) is unchanged by this session — this session tested what exists, it
  did not add new enforcement.
- No message-reporting UI, same gap flagged since the first of today's four
  sessions.

## Needs a human

- **Deploy `0053` through `0056`** to the live Supabase project, deliberately
  — not implied by "the local tests pass" — and run
  `mcp__Supabase__get_advisors` afterward.
- Nothing else new; every open question from the day's four earlier
  sessions stands as those sessions left it.
