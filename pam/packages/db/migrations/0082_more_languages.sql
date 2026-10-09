-- 0082 — More languages (Will, 9 October 2026: "Let's also add a Brazilian
-- portuguese language", then "Chinese (including Mandarin and Cantonese),
-- Russian, Arabic"). D-413.
--
-- The whole database change: `profiles.preferred_language` may now hold
--   'en', 'es'                 (as before)
--   'pt-BR'                    Brazilian Portuguese
--   'zh-CN'                    Simplified Chinese, for Mandarin readers
--   'zh-HK'                    Traditional Chinese, for Cantonese readers
--   'ru', 'ar'                 Russian, Arabic
-- The codes are BCP 47 tags, written the way the app writes them (capital BR,
-- CN, HK, hyphen), because the app passes them straight to `Intl`, to the
-- page's `lang` and to the speech recogniser. The check is case-sensitive on
-- purpose, so 'pt-br', a bare 'pt' or 'zh' are refused rather than stored as
-- a second spelling of the same language.
--
-- Nothing else in the schema limits a language: the signup and invite
-- functions only pass it through (`coalesce(..., 'en')`), and the text-message
-- queue's `locale` columns are free text. So the one constraint is the whole
-- change, and until it is live a person who picks Portuguese gets a failed
-- save — this migration goes live before, or together with, the app that
-- offers the choice.
--
-- Safe to run twice. Existing rows can only hold 'en' or 'es' (the old check
-- said so), so re-adding the check cannot fail on data.
--
-- test/18_more_languages_test.sql attacks it.

alter table public.profiles drop constraint if exists profiles_language_supported;
alter table public.profiles
  add constraint profiles_language_supported
  check (preferred_language in ('en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'));
