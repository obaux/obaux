-- a program lead reads the visits at their own program (test 56).
--
-- Claimed 2026-10-11 on `claude/places-programs-attendance-a-visits` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
