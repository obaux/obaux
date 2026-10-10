-- a member signs a program's policy once, and only they and the program see it (test 46).
--
-- Claimed 2026-10-10 on `claude/places-programs-policies-p2` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
