-- the pam team sees which places are missing details (test 89).
--
-- Claimed 2026-10-31 on `claude/pam-program-stats` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
