-- who can write enrollments (test 64).
--
-- Claimed 2026-10-11 on `claude/messages-program-before-booking` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
