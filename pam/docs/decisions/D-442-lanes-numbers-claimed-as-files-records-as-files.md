# D-442 — Lanes, numbers claimed as files, records as files

**Date:** 2026-10-10 · **Branch:** `claude/affectionate-goldberg-tvu4sz`

Will, 10 October 2026, asking how three sessions can work at once without
interfering: "Is there a better system to create a network of branches that don't
interfere with each other?" Then, shown the plan: "Let's do all of them, and give
me a list of sessions by topics in a way that keeps us organized. Also using dates
may not be the best, what if things are changed on the same date. Wouldn't day +
time be better? Go ahead and skip Supabase's per branch test for now."

## What was wrong

Almost no trouble came from two sessions editing the same code. It came from the
places every session writes to at the end, and from long branches:

- **Numbers.** Decision numbers collided five times in two days (D-404 three
  ways, D-426, D-435 twice, D-439). The fix each time was renumbering by hand,
  `sed` over every cross-reference, a note in `DECISIONS.md`, and a message to the
  other session. The old protocol ("fetch, read `docs/allocations.md` on every
  branch, bump the row, push the line") needed each session to remember a
  five-step ritual under the pressure of finishing.
- **Shared record files.** `DECISIONS.md` (11,500 lines), `CHANGELOG.md` and
  `STATUS.md` were appended to or edited at the same place by every session.
- **Order-sensitive deploys.** 0086 had to be applied and the app merged in the
  same sitting because the old app's staff invites broke the moment it ran.
- **Long branches.** The languages branch reached 19 commits and touches every
  locale file, so every other branch waits on it.

## What was decided

1. **Lanes** (`docs/lanes.md`): seven topics, one builder session per lane at a
   time, plus a merge desk (PAM Agent 1) that merges to main, applies migrations
   and cuts releases in the order Will says. Sessions are named
   `PAM · <Lane> · <job>`. The usual three are the merge desk and two builders in
   different lanes.
2. **Numbers are files.** `pnpm claim decision|amendment "<title>"` reads `main`
   and every other pushed branch (and the old allocations table on branches that
   still bump it), takes the next number, commits only that file and pushes, then
   checks once more for a same-moment claim. The claim is the file existing on a
   pushed branch; there is no shared table to conflict on. New decisions are
   `docs/decisions/D-<n>-<words>.md` and new amendments `docs/amendments/A<n>-…`;
   everything up to D-441 / A25 stays where it is.
3. **Day and time, not date, for things that need no number.** Migrations are
   `YYYYMMDDHHMMSS_name.sql` (UTC, to the second — the same shape as Supabase's
   own versions and the Supabase CLI's expectation), changelog fragments
   `YYYYMMDDHHMMSS-title.md`, session logs `YYYY-MM-DD-HHMM-<lane>-<job>.md`. Two
   things made on one day sort in the order made; two made in the same second
   differ by their words. The earlier migrations (0001–0086) keep four-digit names; a
   stamped name always sorts after them (`0` < `2`). Will's point was right: a
   date alone would have collided and sorted ambiguously.
4. **Changelog entries are fragments** in `docs/changelog/unreleased/`, with no
   version. `pnpm records:release <version>` (the merge desk) folds them into
   `CHANGELOG.md`, so the version number is chosen once.
5. **Database changes go in two steps** — expand (the live app keeps working),
   switch the app, contract in its own migration. A stamped migration that
   removes or tightens something (a `drop`, a rename, `set not null`, a type
   change, `truncate`) must carry a `-- contract: <release>` line or
   `numbering.test.ts` fails.
6. **Short branches**: one job, a day or two, merge main at start and finish; a
   branch waiting on Will gets no new work.
7. **STATUS.md** stays one file, edited only in the lane's own section.

## Skipped on purpose

- **Supabase branching** (a throwaway database per branch). Will: "skip Supabase's
  per branch test for now." It costs extra and 1–7 remove most of the pain.
- **A merge queue / required pull requests.** CI runs on pushes; Will approves
  merges; the merge desk does them. Revisit if the merge desk becomes the
  bottleneck.
- **Splitting `STATUS.md` into one file per lane.** Considered; it is a 1,250-line
  narrative that others link into, and the sections already exist. If section
  edits still conflict, split it then.

## Consequences a later session should know

- A branch that predates this still bumps the table in `docs/allocations.md`
  (now deleted here). It will conflict on that file when it merges: take this
  branch's version, claim the number again with `pnpm claim` (the script reads the
  old table too, so it will not hand out a number that branch claimed), and merge.
- The live ledger (`list_migrations`) records the time a migration was *applied*,
  not the file's stamp; the name after the stamp is what matches. That is how it
  has always been for the four-digit ones.
- `pnpm claim` needs git and a network to see other sessions' claims. Offline,
  `--no-push` writes the file and says so; claim again online before relying on
  the number.
- Not enforced anywhere: that a builder stays in its lane. It is a convention in
  `CLAUDE.md` and `docs/lanes.md`, like the others.
