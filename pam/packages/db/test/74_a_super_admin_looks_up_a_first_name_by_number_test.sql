-- a super admin looks up a first name by number (test 74).
--
-- Claimed 2026-10-15 on `claude/messages-answer-by-text-context` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
