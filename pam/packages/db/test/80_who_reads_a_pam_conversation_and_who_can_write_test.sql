-- who reads a pam conversation and who can write in it (test 80).
--
-- Claimed 2026-10-18 on `claude/messages-pam-s0-s1a` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
