-- the counter cannot be used to see who opened a screen (test 71).
--
-- Claimed 2026-10-13 on `claude/lena-counter-pins` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
