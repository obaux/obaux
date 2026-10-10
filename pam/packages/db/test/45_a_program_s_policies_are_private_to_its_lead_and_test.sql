-- a program's policies are private to its lead and the people it asks (test 45).
--
-- Claimed 2026-10-10 on `claude/places-programs-policies-p1` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
