-- 0083 — Messages, read in your own language (Will, 9 October 2026: "programs
-- and case managers may use english or spanish, but let's use Uber's approach
-- where the user sees the messenger's message in their language translated,
-- labeled translated, but there's a link under it to show the original").
-- D-414.
--
-- This is the cache behind that. A message is only ever written in the
-- language its sender typed; what a reader sees, in their language, is a
-- translation made when they open the conversation and kept here, so the
-- same message is not sent to the translation service twice, and a message
-- somebody reads again on a slow connection appears at once.
--
--   * One row per (message, language read in). `source_locale` is the
--     language the service found the message to be in; `body` is the
--     translation. A message already in the reader's language has a row with
--     a NULL `body` — "nothing to translate" is an answer worth keeping, or
--     every Spanish message would be asked about again by every Spanish
--     reader.
--   * Written only by the `translate-messages` function, with the service
--     role. Nobody signed in can insert, change or delete one: a translation
--     is a machine's reading of somebody's words, not something a person
--     gets to put in their mouth.
--   * Read by the people in the conversation, and nobody else — the same test
--     as the message itself (`in_conversation`). There is deliberately no
--     admin policy, as there is none on `messages` (§4.1: admins never read
--     message bodies). A reported message reaches reviewers as it was
--     written; its translation does not travel with it.
--   * Gone when the message is (`on delete cascade`), so deleting an account
--     deletes the translations of everything it said.
--   * Languages are the ones the app offers (0082), spelled the way the app
--     spells them. `source_locale` is whatever the service reports — a BCP 47
--     tag, or 'und' when it could not tell — and is only ever shown, never
--     matched against the list.
--
-- Nothing calls this until `MESSAGE_TRANSLATION` is switched on in
-- packages/config and the function has its key; shipping this migration
-- changes nothing a member sees. test/19_message_translations_test.sql
-- attacks it.

create table if not exists public.message_translations (
  message_id    uuid not null references public.messages (id) on delete cascade,
  target_locale text not null,
  source_locale text not null,
  -- NULL: the message is already in `target_locale`; there is nothing to show.
  body          text,
  -- Who made it ('anthropic:claude-haiku-5-5'): kept so a bad translation can
  -- be traced to the service and the model, and so a model change can re-run
  -- only what an older one wrote.
  provider      text not null,
  created_at    timestamptz not null default now(),

  primary key (message_id, target_locale),

  constraint message_translations_target_supported
    check (target_locale in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar')),
  constraint message_translations_source_tag
    check (source_locale = 'und' or source_locale ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  -- A translation is no longer than the longest message (4,000 characters is
  -- the app's limit) by much; a row far past it is a runaway, not a message.
  constraint message_translations_body_size
    check (body is null or char_length(body) between 1 and 8000),
  constraint message_translations_has_provider
    check (char_length(provider) between 1 and 80)
);

comment on table public.message_translations is
  'A message, translated into the language one of its readers uses. Written '
  'only by the translate-messages function (service role); read by the people '
  'in the conversation. No admin policy, as on messages.';

alter table public.message_translations enable row level security;
alter table public.message_translations force row level security;

revoke all on public.message_translations from anon, authenticated;
grant select on public.message_translations to authenticated;

drop policy if exists message_translations_select_conversation_member on public.message_translations;
create policy message_translations_select_conversation_member on public.message_translations
  for select to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_translations.message_id
        and public.in_conversation(m.conversation_id)
    )
  );
