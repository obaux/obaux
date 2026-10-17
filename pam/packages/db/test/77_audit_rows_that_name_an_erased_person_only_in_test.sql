-- audit rows that name an erased person only in meta are purged (test 77).
--
-- Claimed 2026-10-17 on `claude/messages-audit-meta-purge` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
