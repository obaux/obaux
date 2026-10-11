-- a member who has only written to a program is not linked to it (test 68).
--
-- Claimed 2026-10-11 on `claude/lena-a-message-is-not-a-link` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
