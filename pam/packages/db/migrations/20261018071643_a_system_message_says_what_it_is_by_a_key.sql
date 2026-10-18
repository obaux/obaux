-- a_system_message_says_what_it_is_by_a_key — the columns and the rule that go with a null sender (D-605, D-606).
--
-- Claimed 2026-10-18 07:16:43 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
-- Runs after `a_message_can_come_from_pam_itself`, which made `sender_id` nullable.
--
-- EXPAND. Two nullable columns and one check; every existing row has a sender and no key, so it satisfies the check.
--
--   system_key   which sentence to draw: 'pam.welcome', 'pam.away'. The app turns the key into words in the READER's own
--                language, so the welcome and the out-of-hours reply are in all seven and follow a change of language.
--   system_vars  what the sentence needs (for the reply, when Pam is next here, as a timestamp the app formats). Never
--                a name, never a phone number.
--
-- The rule: a message has an author OR a key, never both and never neither. So a person cannot write a message that
-- looks like it came from Pam (a key with their own id on it), and a message with no author always says what it is.
-- Nothing a client can send writes either column: `messages_insert_sender` requires `sender_id = auth.uid()`, which
-- is never null, and the check then forbids a key. Only functions that run as the database write system messages.
--
-- A system message's `body` is the empty string, not null: `messages_has_content` (body or attachment) stays as it is,
-- which keeps this migration to additions. Readers draw the key, not the body.

alter table public.messages add column if not exists system_key text;
alter table public.messages add column if not exists system_vars jsonb;

alter table public.messages
  add constraint messages_author_or_key check ((sender_id is null) = (system_key is not null));

comment on column public.messages.system_key is
  'Set only on a message written by no person (Pam''s welcome and out-of-hours reply): which sentence the app draws, in the reader''s language (D-605).';
comment on column public.messages.system_vars is
  'What system_key''s sentence needs, such as when Pam is next here. Never a name or a number (D-605).';
