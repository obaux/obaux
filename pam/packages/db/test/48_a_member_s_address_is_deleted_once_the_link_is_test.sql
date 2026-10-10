-- a member's address is deleted once the link is sent (test 48).
--
-- Claimed 2026-10-10 on `claude/messages-member-address-deleted` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;
