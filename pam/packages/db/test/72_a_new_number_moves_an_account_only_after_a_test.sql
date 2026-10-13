-- a new number moves an account only after a person checks it (test 72).
--
-- Claimed 2026-10-13 on `claude/pam-new-number` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
