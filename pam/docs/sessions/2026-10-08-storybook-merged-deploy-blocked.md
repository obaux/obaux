# 2026-10-08 — `pam-storybook` merged; 0075–0078 deploy confirmed blocked

**Phase:** Phase 1 (member-facing product), pre-launch · **Sessions so far:** many

## What changed

Merged `claude/pam-storybook` to `main` (fast-forward, `81c3b26`) — `main`
was already an ancestor of the branch (PR #27 had merged an earlier point on
it; four more commits landed on the branch afterward), so this was a clean
merge with nothing to reconcile.

Attempted to apply migrations 0075–0078 to the live Supabase project, at
Will's direct request. Did not finish: isolated and confirmed the exact
blocker rather than working around it. See D-387 for the full account.

## What was wrong, and what missed it

Nothing was *wrong* here in the sense of a bug slipping past a test — this
is a deploy-tooling limit, not a code defect, and it had already been found
twice before (D-345, D-346) without being fully characterized. What this
session added: proof that the block is keyed to the DDL statement itself
(`DROP TRIGGER`), not to whether the target object exists or what tool
issues it. That distinction matters for whoever picks this up next, since
it rules out "wait for the object to exist first" or "use a different MCP
tool" as fixes.

## Decisions

- D-387 — the `pam-storybook` merge, and the confirmed, not-worked-around
  deploy block on 0075–0078, with the exact repro and what's safely live as
  a side effect.

## Verified

| Check | Result |
|---|---|
| `git merge-base --is-ancestor origin/main origin/claude/pam-storybook` | Yes — clean fast-forward, no divergence |
| `mcp__Supabase__list_migrations` vs `packages/db/migrations/` | No drift: live matched the repo exactly through `0074` before this session touched anything |
| `mcp__Supabase__apply_migration` (0075, full text) | Timed out, 60s |
| `mcp__Supabase__execute_sql`, `CREATE FUNCTION`/`COMMENT`/`REVOKE` statements | All instant |
| `mcp__Supabase__execute_sql`, `DROP TRIGGER IF EXISTS` (on a trigger that didn't exist) | Timed out, reproducibly, twice |
| `mcp__Supabase__execute_sql`, `CREATE TRIGGER` (same name, right after) | Instant |
| `mcp__Supabase__get_advisors` (security), after the partial live change | Clean — no new findings |

No code changed this session — this was a merge plus a deploy attempt plus
documentation.

## Left undone

- 0075 (the rest of it), 0076, 0077, 0078 — all still local-only on `main`,
  not live. The order to apply them in, once the gate is cleared, is in
  D-387 and `docs/before-launch.md`.
- Everything already on the backlog as of the 7 October sessions is still
  on the backlog, unchanged by this one.

## Needs a human

- **Will needs to clear the DROP-statement approval gate directly in the
  Supabase dashboard** (project `shobqzuhicoiymtumiaz`) for 0075–0078 to
  go live. No tool available in a Claude Code session — `apply_migration`
  or raw `execute_sql` — can get past it; both were tried and both hit the
  same wall. Once it's clear, the four migrations can be applied in order
  (0075, 0076, 0077, 0078) and verified with `get_advisors` same as every
  other deploy this project has done.
