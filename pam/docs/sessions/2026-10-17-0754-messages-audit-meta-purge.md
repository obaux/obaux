# 2026-10-17 — messages audit meta purge

**Branch:** `claude/messages-audit-meta-purge` · **Lane:** Messages & notifications (Nico)

## What changed

- Migration `20261017075451`: `purge_erased_audit()` also deletes a row when a top-level `meta` value equals the erased profile's id (D-599). Security definer, search path, flag and guard as they were. Writers untouched.
- Test 77, the decision D-599.

## What was wrong, and what missed it

- D-541's two writers put the other person only in `meta` `with`; D-443's purge looked at `actor_id` and `target_id` alone. Lena's sweep found it; my D-541 tests checked that the audit row was written, not what the six months do to it.

## Decisions made

- D-599. Writers left as they are (live rows exist; the purge has to cover them anyway).

## Verified

- Test 77 fails on main (removes 1 row, not 3) and passes with the migration; full `packages/db` suite passes. The first full run caught my test using phones and ids another test already uses; changed.

## Left undone

- Ids nested below the top level of `meta` are not covered; nothing writes one.

## Needs a human

- Mira applies the migration (after `list_migrations`).
