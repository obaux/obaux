# SQL for the Supabase SQL editor

Files here are **not** migrations. They are the same SQL as a migration, in one
transaction with a check before and a check after, for the cases the live
connector cannot apply: it hangs on a `drop` (D-387). Each file says how to run
it at the top.

## `2026-10-09-language-where-there-is-no-profile.sql`

Migration 0085: the language a person asked in, kept on staff requests and fresh
invite links, so the text that answers a staff request and the email with a new
link are written in it, and an approved account opens in it. It replaces two
functions, so it drops the old shape first.

**Nothing waits on it.** The app asks with the language and, if the database has
no such parameter yet, asks again without (`apps/web/src/lib/rpcLanguage.ts`).
Run it whenever convenient; from then on the language is recorded.

- It refuses to run unless 0078 and 0084 are in the ledger.
- It checks its own work (old signatures gone, new ones there with the right
  grants, both columns present) and rolls back if anything is off.
- It records 0085 in `supabase_migrations.schema_migrations`.
- Running it again changes nothing.

Proved on a database shaped like the live one (every migration except 0085): run
twice, one ledger row; refused on a database without 0084; and, with the old
invite-link signature left in place on purpose, rolled back leaving no columns and
no ledger row.

**If 0085 changes before it is run, rebuild the file** (the migration goes between
the pre-flight check and the self-check) **and re-prove it.**
`packages/config/test/manual-sql.test.ts` fails until you do.

## History

The first version of this folder held a four-in-one file (0079 + 0080 + 0081 +
0085). On 9 October 2026 0079–0081 were applied through the connector instead,
each without its `drop ... if exists` guards (no-ops on objects that did not
exist yet; the hang is on those statements), and 0085 timed out on its real
`drop function` and left nothing behind. That is what this file is left for.
