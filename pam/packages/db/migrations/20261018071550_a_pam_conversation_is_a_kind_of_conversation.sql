-- a_pam_conversation_is_a_kind_of_conversation — `conversation_kind` gains 'support' (D-605, D-606).
--
-- Claimed 2026-10-18 07:15:50 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
-- The file name is the order: migrations run oldest first.
--
-- EXPAND. One enum value. Nothing that is live reads or writes it; nothing is created with it until the
-- switch (`app_settings.pam_messaging_live`, migration 20261018071553) is on and the build that creates it
-- is applied. Its own file because a new enum value cannot be used in the transaction that adds it.
--
-- A 'support' conversation is a person's one conversation with Pam: one member, the person; the Pam team
-- reaches it through policies scoped to this kind (the Message Pam build, slice 1, migration 4). Plan:
-- docs/design/plans/2026-10-18-message-pam.md and ...-slices.md.

alter type public.conversation_kind add value if not exists 'support';
