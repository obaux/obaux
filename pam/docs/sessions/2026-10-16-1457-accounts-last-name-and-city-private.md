# 2026-10-16 — accounts last name and city private

**Branch:** `claude/pam-last-name-city-private` · **Lane:** Accounts & invites

## What changed

- This is build 1 of Mira's three privacy builds from Lena's privacy guard (D-587). Migration `20261016145411`
  revokes select on `profiles.last_name` and `profiles.home_city` from `anon` and `authenticated` (D-588).
- Test 74: a case manager, an accepted buddy and a reader of a public mentor still see the row, but cannot select
  either column, not even through `select *` or a filter on the city. Nor can the person, nor anyone signed out.
  The person's own update still saves, and nobody else's does. No non-definer function reads either column.
- Test 04 read the approved person's last name as the super admin, signed in. It now checks it as the server.
- `data-collected.ts`: the last-name-and-city entry says who reads them.

## What was wrong, and what missed it

- I ran `pnpm claim decision` twice, because the first output was hidden by a grep, and both claims were pushed.
  D-588 is the decision, and D-589 is marked unused. Next time, read the claim's whole output.

## Decisions made

- D-588: no own-row reader, because nothing reads them back. Why, and when to add one, is in the file.

## Verified

- Every reader was checked. The app selects neither column from `profiles` anywhere (the full grep is in the
  migration's header). About you does not prefill them. Every SQL function that reads them is a definer.
- `pnpm --filter @pam/db test`: all database checks passed, test 74 included.
- `pnpm --filter @pam/config test`: 1319 passed, the privacy guard included.
- No app code changed, so no e2e spec was touched.

## Left undone

- The migration is not applied. Mira applies it live after `list_migrations`.

## Needs a human

- Nothing.
