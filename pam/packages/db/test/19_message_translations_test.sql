-- Messages, read in your own language (0084, D-423): the cache of
-- translations behind "Translated · Show original".
--
-- The promises: only the two people in a conversation can read a translation
-- of its messages; nobody signed in can write, change or delete one;
-- no staff member outside the conversation (and no super admin) reads one;
-- only the languages the app offers are stored; a message translated is
-- cleaned up with it. Runs after 15 and 16, whose conversation (Marcus and
-- Alice) it uses; Dana is Marcus's case manager and is NOT in it.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana   '33333333-0000-0000-0000-00000000000a'
\set marcus '33333333-0000-0000-0000-00000000000c'
\set alice  '33333333-0000-0000-0000-00000000000f'
\set root   '33333333-0000-0000-0000-000000000020'
\set convo  '66666666-0000-0000-0000-000000000001'

\echo ''
\echo '--- Messages, read in your own language (0084) ---'

-- Marcus writes Alice a line in Spanish. (As the app does: an ordinary insert.)
reset role;
set role authenticated;
select test.as_user(:'marcus');
insert into public.messages (conversation_id, sender_id, body)
values (:'convo', :'marcus', 'Llego a las diez, gracias.');
select id as msg from public.messages where body = 'Llego a las diez, gracias.' \gset

-- The function, as the service role (here: the owner, which bypasses RLS as the
-- service role does), keeps its two answers: the translation for an English
-- reader, and "already Spanish" for a Spanish one.
reset role;
insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
values (:'msg', 'en', 'es', 'I arrive at ten, thank you.', 'test:fake'),
       (:'msg', 'es', 'es', null, 'test:fake');

-- ---------------------------------------------------------------------------
\echo ''
\echo '--- Who can read one ---'
set role authenticated;

select test.as_user(:'alice');
select test.check('the other person in the conversation reads the translation',
  (select count(*) from public.message_translations where message_id = :'msg' and target_locale = 'en'
     and body = 'I arrive at ten, thank you.'), 1);
select test.check('...and the note that a message needed none',
  (select count(*) from public.message_translations where message_id = :'msg' and target_locale = 'es' and body is null), 1);

select test.as_user(:'marcus');
select test.check('the sender reads it too',
  (select count(*) from public.message_translations where message_id = :'msg'), 2);

select test.as_user(:'dana');
select test.check('a case manager outside the conversation reads none',
  (select count(*) from public.message_translations), 0);

select test.as_user(:'root');
select test.check('a super admin reads none (no admin policy, as on messages)',
  (select count(*) from public.message_translations), 0);

reset role;
set role anon;
select test.check_raises('somebody not signed in cannot read translations',
  'select count(*) from public.message_translations');

-- ---------------------------------------------------------------------------
\echo ''
\echo '--- Nobody signed in can write one ---'
set role authenticated;

select test.as_user(:'marcus');
select test.check_raises('the sender cannot add a translation of their own message',
  format($q$insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
            values (%L, 'ru', 'es', 'Я приеду в десять.', 'me')$q$, :'msg'));

select test.as_user(:'alice');
select test.check_raises('the reader cannot add one either',
  format($q$insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
            values (%L, 'ru', 'es', 'Я приеду в десять.', 'me')$q$, :'msg'));
select test.check_raises('the reader cannot reword the translation they were given',
  format($q$update public.message_translations set body = 'Something else' where message_id = %L$q$, :'msg'));
select test.check_raises('the reader cannot delete one',
  format($q$delete from public.message_translations where message_id = %L$q$, :'msg'));

reset role;
select test.check('...and the translation is as the function wrote it',
  (select count(*) from public.message_translations where message_id = :'msg' and target_locale = 'en'
     and body = 'I arrive at ten, thank you.'), 1);

-- ---------------------------------------------------------------------------
\echo ''
\echo '--- What may be stored ---'
select test.check_raises('only the languages the app offers (French is not one)',
  format($q$insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
            values (%L, 'fr', 'es', 'J''arrive à dix heures.', 'test:fake')$q$, :'msg'));
select test.check_raises('a language is spelled the way the app spells it (pt-br is not pt-BR)',
  format($q$insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
            values (%L, 'pt-br', 'es', 'Chego às dez.', 'test:fake')$q$, :'msg'));
select test.check_raises('a translation is not an empty string (nothing to show is NULL)',
  format($q$insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
            values (%L, 'ru', 'es', '', 'test:fake')$q$, :'msg'));
select test.check_raises('a source language is a language tag, not free text',
  format($q$insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
            values (%L, 'ru', 'Spanish, I think', 'x', 'test:fake')$q$, :'msg'));
select test.check_raises('one translation per message per language',
  format($q$insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
            values (%L, 'en', 'es', 'Again', 'test:fake')$q$, :'msg'));
select test.check_raises('a translation of a message that does not exist',
  $q$insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
     values (gen_random_uuid(), 'en', 'es', 'Hello', 'test:fake')$q$);

insert into public.message_translations (message_id, target_locale, source_locale, body, provider)
values (:'msg', 'ru', 'und', 'Я приеду в десять.', 'test:fake'),
       (:'msg', 'zh-HK', 'es', '我十點到，多謝。', 'test:fake');
select test.check('every language the app offers can be stored, and "could not tell" is a source',
  (select count(*) from public.message_translations where message_id = :'msg'), 4);

-- ---------------------------------------------------------------------------
\echo ''
\echo '--- Deleting the message deletes what was made from it ---'
delete from public.messages where id = :'msg';
select test.check('its translations go with it',
  (select count(*) from public.message_translations where message_id = :'msg'), 0);
