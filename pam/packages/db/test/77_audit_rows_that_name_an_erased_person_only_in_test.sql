-- An erased account's six months also cover audit rows that name it only in meta
-- (D-599). purge_erased_audit() used to look at actor_id and target_id alone, so a
-- 'conversation.open' row with the erased person in meta 'with', or a deletion row
-- with an erased admin in meta 'by', stayed past the six months p3 promises.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set vera          '55555555-0000-0000-0000-000000000771'
\set wade          '55555555-0000-0000-0000-000000000772'
\set xena          '55555555-0000-0000-0000-000000000773'
\set region_north  '11111111-0000-0000-0000-000000000001'

reset role;
insert into auth.users (id, phone) values
  (:'vera', '12675550771'), (:'wade', '12675550772'), (:'xena', '12675550773');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'vera', 'member', 'Vera', :'region_north', '+12675550771', 'active'),
  (:'wade', 'member', 'Wade', :'region_north', '+12675550772', 'active'),
  (:'xena', 'member', 'Xena', :'region_north', '+12675550773', 'active');

-- Wade opened a conversation with Vera: Vera is named only in meta 'with'.
-- Xena opened one with Wade: nothing to do with Vera.
-- Another row names Vera inside a nested value, which the purge does not read.
insert into public.audit_log (actor_id, action, target_type, target_id, meta) values
  (:'wade', 'test.conversation_open_vera', 'conversation', null, jsonb_build_object('with', :'vera')),
  (:'wade', 'test.program_message_vera',   'conversation', null, jsonb_build_object('lead', :'vera', 'service', 'x')),
  (:'xena', 'test.conversation_open_wade', 'conversation', null, jsonb_build_object('with', :'wade')),
  (:'xena', 'test.other_meta',             'conversation', null, jsonb_build_object('with', 'not-an-id')),
  (:'xena', 'test.meta_is_an_array',       'conversation', null, '[]'::jsonb);

-- Vera is erased, and her deletion is more than six months old.
delete from auth.users where id = :'vera';
alter table public.audit_log disable trigger audit_log_append_only;
update public.audit_log set created_at = now() - interval '6 months 1 day'
  where action = 'account.delete' and target_id = :'vera';
alter table public.audit_log enable trigger audit_log_append_only;

-- ===========================================================================
\echo ''
\echo '--- Named only in meta, six months on, the row goes ---'
-- ===========================================================================
select test.check('Vera is in meta on two rows before the purge',
  (select count(*) from public.audit_log where meta @> jsonb_build_object('with', :'vera')
     or meta @> jsonb_build_object('lead', :'vera')), 2);
-- (Other tests in the suite leave old erasures behind, so the count it returns is
-- not ours alone; what matters is which rows are gone.)
select test.check('the purge runs and removes at least those three rows',
  (select case when public.purge_erased_audit() >= 3 then 1 else 0 end), 1);
select test.check('...the deletion row is gone too',
  (select count(*) from public.audit_log where action = 'account.delete' and target_id = :'vera'), 0);
select test.check('no row names Vera in meta any more',
  (select count(*) from public.audit_log where meta::text like '%' || :'vera' || '%'), 0);
select test.check('...nor as actor or target',
  (select count(*) from public.audit_log where actor_id = :'vera' or target_id = :'vera'), 0);

-- ===========================================================================
\echo ''
\echo '--- Somebody else''s rows stay ---'
-- ===========================================================================
select test.check('a row that names Wade in meta stays',
  (select count(*) from public.audit_log where action = 'test.conversation_open_wade'), 1);
select test.check('a row with some other meta value stays',
  (select count(*) from public.audit_log where action = 'test.other_meta'), 1);
select test.check('a row whose meta is not an object does not break the purge and stays',
  (select count(*) from public.audit_log where action = 'test.meta_is_an_array'), 1);
select test.check('Wade, not erased, has no deletion row',
  (select count(*) from public.audit_log where action = 'account.delete' and target_id = :'wade'), 0);

-- ===========================================================================
\echo ''
\echo '--- Six months have to have passed, and the guard is back on ---'
-- ===========================================================================
delete from auth.users where id = :'xena';
insert into public.audit_log (actor_id, action, target_type, meta)
  values (:'wade', 'test.names_xena', 'conversation', jsonb_build_object('with', :'xena'));
select test.check('the purge runs again', (select case when public.purge_erased_audit() >= 0 then 1 else 0 end), 1);
select test.check('Xena, deleted just now, is not purged: the row naming her stays',
  (select count(*) from public.audit_log where action = 'test.names_xena'), 1);
select test.check('the append-only guard is back on',
  (select count(*) from pg_trigger where tgname = 'audit_log_append_only' and tgenabled = 'O'), 1);
