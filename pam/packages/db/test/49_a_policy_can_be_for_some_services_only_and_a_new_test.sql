-- a policy can be for some services only, and a new version keeps that (test 49).
--
-- Claimed 2026-10-10 on `claude/places-programs-policies-p4` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
