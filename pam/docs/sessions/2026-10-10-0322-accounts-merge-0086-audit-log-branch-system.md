# 2026-10-10 — Accounts & invites: 0086 live and merged, the audit log keeps an erased account six months, and a system for running sessions side by side

**Branch:** `claude/affectionate-goldberg-tvu4sz` · **Lane:** Accounts & invites (plus the platform tooling, which is the merge desk's lane — see `docs/lanes.md`)

Continues `2026-10-09-two-promises-that-contradicted.md`. Will's instructions this
session: "Apply and merge 0086"; "When account is deleted the account should sit in
audit log for 6 months before it disappears"; and, answering how to run three sessions
without interference, "Let's do all of them … give me a list of sessions by topics …
using dates may not be the best … Wouldn't day + time be better? Go ahead and skip
Supabase's per branch test for now."

## What changed

1. **0086 (staff email on invites) is live, and the branch is merged to `main`
   (`0220ae0`).** `list_migrations` first: live ended at 0081, 0085 still held on
   purpose, no drift. Applied through the connector (no `drop`); read back the two
   tables (forced RLS, one policy each, no `anon` select, no `authenticated` insert),
   the functions (`invite_create`, `keep_invite_email` and the trigger function not
   executable by clients; `create_invite` and `create_staff_invite` executable by
   signed-in people only), and the advisors (unchanged in kind). Merged with a merge
   commit; PAM CI (three jobs) and Storybook green on `main`; Vercel `web` production
   READY on that commit. The live copy of the migration is the same statements without
   the explanatory `--` comments (the file in the repo has them).
2. **An erased account stays in the audit log for six months (D-443), not live.**
   Two migrations and the privacy sentence; see the decision file. Found on the way:
   a member who has points cannot be deleted either (the append-only points ledger
   refuses the cascade).
3. **Lanes, claimed numbers and records as files (D-442).** `pnpm claim`, `pnpm
   records:release`, `docs/lanes.md`, per-decision / per-amendment / per-changelog
   files, migrations named by day and time to the second, a lint that a removal says
   `-- contract:`, `docs/allocations.md` reduced to the rule, `CLAUDE.md` rewritten
   around it. Tested against a throwaway remote that held another session's claim and a
   branch still on the old table.

## What was wrong, and what missed it

- **A claim script that reads only `main` would have missed the old protocol.** Other
  branches still bump the "Next free" table in `docs/allocations.md`; the script reads
  that row on every ref too (`claimedFromAllocationsRow`). Missed by: nothing yet — I
  built the throwaway-remote test with a branch on the old table to prove it.
- **`slugify` cut a title in the middle of a word** (a 48-character limit landed after
  "six" of "six months"). Fixed to cut between words, 64 characters. Caught by reading
  the first real file name it made.
- **The Write tool put literal combining-mark characters into a regex** instead of the
  `̀-ͯ` escape. Harmless to run, hard to read; rewritten with escapes.
- **`test.check` takes `bigint` only**, so a text or boolean check in the new DB test
  failed to compile at the first run. Rewritten as counts.
- **Nothing in CI catches the audit schedule.** The test database has no pg_cron, so the
  `purge-erased-audit` job is created only where the extension exists and its first real
  proof is `select * from cron.job` after applying. Said in D-443 and on the
  before-launch list.

## Decisions made

- D-442 — lanes, numbers claimed as files, records as files (Will, "do all of them").
- D-443 — an erased account stays in the audit log for six months (Will's words).
- The guard exception: the append-only trigger lets a DELETE on `audit_log` through only
  when a flag the purge function sets is on *and* the session runs as that function's
  owner. A service-role session that sets the flag itself is still refused (tested).
  Chosen over `alter table … disable trigger` inside the function, which takes an
  `ACCESS EXCLUSIVE` lock and fails on pending trigger events.

## Verified

- DB suite: 639 checks (608 before; 31 new — `22_audit_erasure_test.sql`, and Ivy,
  who redeemed and acted, deleted in `21_…`).
- `@pam/config` 719 tests (claims 16, numbering 9), `@pam/ui` 79, `@pam/web` 48;
  `copy:status` says all languages are in step after `copy:ack`.
- The claim script against a synthetic remote: next number after another session's
  file and a branch's old-table bump; refuses on `main`; amendment, migration,
  changelog and session names; two claims of the same title get different numbers.
  Run once for real on this repository (D-442, D-443 pushed).
- The migration lint: a stamped migration with `drop column` and no `-- contract:`
  fails; with it passes; the word `drop` in a comment alone passes.
- Full Playwright on the final tree (built after the privacy sentence was added): 837 passed in 8.4 minutes, at 320 light and dark and iPhone SE. Storybook green on the branch.

## Left undone

- **Not applied, not merged:** the two audit migrations, the privacy sentence, and the
  coordination tooling (all on this branch). Will's word needed for each (`CLAUDE.md`).
- **Points ledger blocks deleting a member who has points.** Decision for Will.
- **No routine for the Pam team** that deletes everything (profile, email, invites,
  messages, photos, points) in one tested call.
- **`pam-site` on Vercel fails on every push to `main`** (its production deploy for
  `0220ae0` is ERROR) because the site lives on `claude/compassionate-bohr-mzrchf`, not
  on `main`. It is the Public website lane's question (that session is waiting on Will:
  should `main` contain the site?). Not caused by this work.
- **`STATUS.md` row 36** (merge of `claude/gallant-clarke-0dhizj`, "waiting for Will's
  word") is out of date — the branch is on `main` since `8dee5d4`. It is the languages
  lane's row; not edited here.
- Other open branches (`gallant-clarke`, `amazing-archimedes`, `compassionate-bohr`,
  `pam-assign-and-limit`) predate the new rules and will conflict on
  `docs/allocations.md` and `CLAUDE.md`; `D-442` says what to do.

## Needs a human

- Will: say "apply and merge" for the audit migrations + privacy sentence (and run the
  one `drop constraint` line in the SQL editor if the connector hangs), and "merge" for
  the tooling; decide the points ledger; read the new privacy sentence; rename the
  sessions (`docs/lanes.md` has the titles).
