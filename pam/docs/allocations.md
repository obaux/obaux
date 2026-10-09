# Numbers that more than one session hands out

Decisions (`D-nnn`), SOP amendments (`Ann`), migrations (`nnnn_…`) and
changelog versions are numbered by whoever writes them next. Will regularly runs
two or three sessions on PAM at once, on separate branches, and each of them
sees only its own branch's last number. Found the hard way on 9 October 2026:
three sessions each took D-404, two took migration 0082, and two took A22. Every
collision was found by a person at merge time, and renumbering after the fact
meant rewriting every cross-reference.

## The rule

1. **Before you take a number, `git fetch` and read the table below *on
   `origin/main` and on every other `claude/*` branch you can see***
   (`git log --all`, then `git show origin/<branch>:pam/docs/allocations.md`).
   Take the highest number anywhere, plus one.
2. **Claim it here first.** Bump the row, commit and push that one line before
   you write the entry. Two sessions that both bump the same row make a merge
   conflict on this file, which is the point: the conflict *is* the collision,
   found in a diff instead of in production.
3. **Never reuse a number a branch has already pushed**, even if you think that
   branch is abandoned. Ask Will.
4. A merge that brings two sessions' numbers together renumbers **the branch
   that merges second**, with a script that touches only its own lines, and
   says so in `DECISIONS.md` (see the note under D-422).
5. `packages/config/test/numbering.test.ts` fails on a duplicate number in any
   of the four ledgers, and on a row below that is behind the repo. It cannot
   see another branch; the rule above is how you do.

## Next free

Update the number in the second column when you claim it, and name the branch.

| Ledger | Next free | Where it lives | Last claimed by |
|---|---|---|---|
| Decision | **D-430** | `DECISIONS.md` (`### D-nnn — …`) | `claude/gallant-clarke-0dhizj` (D-422–D-426, D-428); `claude/affectionate-goldberg-tvu4sz` (D-427, D-429) |
| SOP amendment | **A26** | `docs/sop-amendments.md` (`## Ann — …`) | `claude/gallant-clarke-0dhizj` (A24, A25) |
| Migration | **0086** | `packages/db/migrations/nnnn_name.sql` | `claude/gallant-clarke-0dhizj` (0083, 0084 live; 0085 written, not applied — by hand, nothing waits on it) |
| Changelog | **0.51.1** or **0.52.0** | `CHANGELOG.md` (`## [x.y.z] — …`) | `claude/gallant-clarke-0dhizj` (0.50.1, 0.51.0) |

Live but numbered out of order: **0082** (`admin_reaches_assigned_only`) was applied
first, then 0083 and 0084, then 0079, 0080 and 0081 (photos, documents, link
previews — `claude/pam-storybook`), all on 9 October; the ledger lists them by
the time they were applied and that is expected. **0085** is written and tested but
not applied (`packages/db/manual/`).

## Live project

Migrations are also numbered by what is *applied*, in the Supabase ledger
(`list_migrations`). Before applying one, diff that ledger against
`packages/db/migrations/` (`pam/CLAUDE.md`). A live migration with no file, or a
file never applied, is drift: stop and tell Will.
