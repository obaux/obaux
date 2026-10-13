-- screen opens are counted without knowing who (test 70).
--
-- Claimed 2026-10-13 on `claude/messages-screen-open-counter` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
