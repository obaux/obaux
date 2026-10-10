# Numbers that more than one session hands out

This page used to hold a table of "next free" numbers that every session bumped.
Two or three sessions work at once, each sees only its own branch, and the
numbers collided five times in two days (three sessions took D-404; two took
migration 0082; two took A22; D-435 and D-426 twice). It is replaced.

**A number is now a file, and the file existing on a pushed branch is the claim.**
Read `docs/lanes.md`, "Claiming a number". In short:

```
pnpm claim decision  "short title"    # docs/decisions/D-442-short-title.md
pnpm claim amendment "short title"    # docs/amendments/A26-short-title.md
pnpm claim migration "what it does"   # packages/db/migrations/<day and time>_what_it_does.sql
pnpm claim changelog "what a person notices"
pnpm claim session   "lane and job"
pnpm claim status                     # what is claimed, and on which branch
```

- A decision or an amendment takes the next number after looking at `main` **and
  every other pushed branch**, then commits that one file and pushes.
- A migration, a changelog fragment and a session log are named by the day and
  time (UTC, to the second). They have no number, so they cannot collide.
- Never reuse a number a branch has already pushed, even if the branch looks
  abandoned. Ask Will.
- A merge that brings in a branch that still used the old table (it bumped a
  "Next free" row below) is read by the script too, so the numbers they claimed
  are not handed out again.

`packages/config/test/numbering.test.ts` fails on a duplicate number or version in
a tree, on a decision file whose heading is not its own number, on a migration
stamp that is not a real date, and on a stamped migration that removes something
without saying why (`-- contract:`).

Live migrations are numbered by what is *applied* in the Supabase ledger
(`list_migrations`), which is not the same order as the files. Before applying
one, diff that ledger against `packages/db/migrations/` (`CLAUDE.md`). A live
migration with no file, or a file never applied, is drift: stop and tell Will.
