-- More languages (0082, D-413): Brazilian Portuguese, Simplified and
-- Traditional Chinese, Russian, Arabic.
--
-- One column decides which languages an account can hold. These check that
-- each new code is allowed by every way the app writes a language — signing
-- up with it, and switching to it later the way the Language screen does —
-- and that nothing else slipped through with them: not a bare 'pt' or 'zh',
-- not 'pt-br', not another language, not an empty string. English and Spanish
-- keep working.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set ana '33333333-0000-0000-0000-000000000581'

reset role;
insert into auth.users (id, phone) values (:'ana', '12675550501');

-- ===========================================================================
\echo ''
\echo '--- Signing up in Portuguese ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'ana');

do $$
declare
  p public.profiles;
begin
  p := public.start_membership('Ana', 'Souza', 'north', 'pt-BR');
  if p.preferred_language <> 'pt-BR' then
    raise exception 'FAIL  signing up in Portuguese stored %', p.preferred_language;
  end if;
  raise notice 'ok    signing up with pt-BR stores pt-BR';
end;
$$;

-- ===========================================================================
\echo ''
\echo '--- Switching language later, as the Language screen does ---'
-- ===========================================================================
-- The app writes `profiles.preferred_language` with an ordinary update on the
-- person's own row (useChooseLanguage), so this is that, as that person.
update public.profiles set preferred_language = 'es' where id = :'ana';
select test.check('Spanish still works',
  (select count(*) from public.profiles where id = :'ana' and preferred_language = 'es'), 1);
update public.profiles set preferred_language = 'en' where id = :'ana';
select test.check('English still works',
  (select count(*) from public.profiles where id = :'ana' and preferred_language = 'en'), 1);
update public.profiles set preferred_language = 'pt-BR' where id = :'ana';
select test.check('switching to Portuguese is kept',
  (select count(*) from public.profiles where id = :'ana' and preferred_language = 'pt-BR'), 1);
update public.profiles set preferred_language = 'zh-CN' where id = :'ana';
select test.check('switching to Simplified Chinese is kept',
  (select count(*) from public.profiles where id = :'ana' and preferred_language = 'zh-CN'), 1);
update public.profiles set preferred_language = 'zh-HK' where id = :'ana';
select test.check('switching to Traditional Chinese is kept',
  (select count(*) from public.profiles where id = :'ana' and preferred_language = 'zh-HK'), 1);
update public.profiles set preferred_language = 'ru' where id = :'ana';
select test.check('switching to Russian is kept',
  (select count(*) from public.profiles where id = :'ana' and preferred_language = 'ru'), 1);
update public.profiles set preferred_language = 'ar' where id = :'ana';
select test.check('switching to Arabic is kept',
  (select count(*) from public.profiles where id = :'ana' and preferred_language = 'ar'), 1);
update public.profiles set preferred_language = 'pt-BR' where id = :'ana';

-- ===========================================================================
\echo ''
\echo '--- Nothing else comes in with it ---'
-- ===========================================================================
select test.check_raises('a bare "zh" is refused: Simplified or Traditional, not "Chinese"',
  format($$update public.profiles set preferred_language = 'zh' where id = %L$$, :'ana'));
select test.check_raises('Taiwan Chinese is not offered as its own language',
  format($$update public.profiles set preferred_language = 'zh-TW' where id = %L$$, :'ana'));
select test.check_raises('"ar-EG" is refused: one Arabic',
  format($$update public.profiles set preferred_language = 'ar-EG' where id = %L$$, :'ana'));
select test.check_raises('a bare "pt" is refused',
  format($$update public.profiles set preferred_language = 'pt' where id = %L$$, :'ana'));
select test.check_raises('"pt-br" is refused: one spelling only',
  format($$update public.profiles set preferred_language = 'pt-br' where id = %L$$, :'ana'));
select test.check_raises('European Portuguese is not offered',
  format($$update public.profiles set preferred_language = 'pt-PT' where id = %L$$, :'ana'));
select test.check_raises('another language is refused',
  format($$update public.profiles set preferred_language = 'fr' where id = %L$$, :'ana'));
select test.check_raises('an empty language is refused',
  format($$update public.profiles set preferred_language = '' where id = %L$$, :'ana'));
select test.check('and the refused ones changed nothing',
  (select count(*) from public.profiles where id = :'ana' and preferred_language = 'pt-BR'), 1);

reset role;
