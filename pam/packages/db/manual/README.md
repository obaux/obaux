# SQL for the Supabase SQL editor

Files here are **not** migrations. They are the same SQL as some migrations, in
one transaction, for the cases the live connector cannot apply (it stops at a
`drop`; D-387). Each one says how to run it at the top.

## `2026-10-09-photos-documents-links-and-languages.sql`

0079 (photos) + 0080 (documents) + 0081 (link previews) + 0085 (the language a
person asked in). **Run it once**, in the Supabase dashboard's SQL editor, on the
`pam` project, **before** the branch that sends photos is merged to `main`
(migration first, app second).

- It refuses to run unless 0078 and 0084 are in the ledger.
- It checks its own work (three private buckets, six storage policies, no open
  link-preview table, no old function signatures) and rolls back if anything is
  off.
- It records the four migrations in `supabase_migrations.schema_migrations`.
- Running it again changes nothing.

Proved on a database shaped like the live one (0001–0078 and 0082–0084): run
twice, then the whole policy suite (546 checks). Proved to refuse a database
without 0084 (nothing left behind) and to roll back when its own check fails
(no buckets, no functions, no ledger rows left).

**If a migration it stands in for changes before it is run, rebuild the file**
(concatenate the four migrations, in order, between the pre-flight check and the
self-check) **and re-prove it.** `packages/config/test/manual-sql.test.ts` fails
until you do.
