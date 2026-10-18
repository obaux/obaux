-- a_message_can_come_from_pam_itself — `messages.sender_id` may be null (D-605, D-606).
--
-- Claimed 2026-10-18 07:15:52 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
--
-- EXPAND (it loosens a column; no reader or writer that is live today can notice). ALONE IN ITS FILE ON PURPOSE:
-- the connector may hang on a statement that contains DROP (D-387). If it refuses this one, do not work around it:
-- Will pastes it through the SQL editor, as before. The next file (20261018071643) adds what makes a null sender mean
-- something; until it runs, nothing can write a null sender anyway, because `messages_insert_sender` requires
-- `sender_id = auth.uid()`.
--
-- Why. Pam's welcome message and its out-of-hours reply are written by no person. A message row needs somewhere to
-- say that, and a fake sender would be a fake account. A null sender says "nobody wrote this, the system did".

alter table public.messages alter column sender_id drop not null;
