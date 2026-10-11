-- a lead and a member cannot write an appointment directly, and the lead's card shows three things (test 69).
--
-- Claimed 2026-10-11 on `claude/lena-no-direct-appointment-writes` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
