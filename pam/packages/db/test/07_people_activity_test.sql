-- People activity (0067): a case manager or a program admin learns that a
-- member on their list saved a new place, and when — never which one, never
-- the last day they used PAM, and never for anybody who is not on their list.
-- The one narrowing of D-166, and the line D-199 added to the contract.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set admin_north   '33333333-0000-0000-0000-00000000000a'
\set admin_south   '33333333-0000-0000-0000-00000000000b'
\set marcus        '33333333-0000-0000-0000-00000000000c'
\set tanya         '33333333-0000-0000-0000-00000000000d'
\set alice         '33333333-0000-0000-0000-00000000000f'
\set bob           '33333333-0000-0000-0000-000000000010'
\set root          '33333333-0000-0000-0000-000000000020'
\set ged           '44444444-0000-0000-0000-000000000001'
\set warehouse     '44444444-0000-0000-0000-000000000002'

-- ===========================================================================
\echo ''
\echo '--- Fixture: Marcus (on Dana''s caseload, enrolled with Alice''s org) and Tanya (region only) each save a place ---'
-- ===========================================================================
reset role;
set role authenticated;
select test.as_user(:'marcus');
insert into public.saved_places (member_id, service_id, saved_at)
values (:'marcus', :'ged', now() - interval '2 days')
on conflict do nothing;
insert into public.saved_places (member_id, service_id, saved_at)
values (:'marcus', :'warehouse', now() - interval '1 hour')
on conflict do nothing;

select test.as_user(:'tanya');
insert into public.saved_places (member_id, service_id, saved_at)
values (:'tanya', :'ged', now() - interval '3 hours')
on conflict do nothing;

-- ===========================================================================
\echo ''
\echo '--- The function returns a time and an id, and nothing that could name a place ---'
-- ===========================================================================
reset role;
-- information_schema.columns does not list a function's output columns, so
-- ask pg_proc directly: the `t` (table) arguments are the result shape.
select test.check('people_activity() has exactly two columns',
  (select count(*) from pg_proc p, unnest(p.proargnames, p.proargmodes) as a(n, m)
   where p.proname = 'people_activity' and p.pronamespace = 'public'::regnamespace and m = 't'), 2);
select test.check('...profile_id and last_saved_at, nothing else',
  (select count(*) from pg_proc p, unnest(p.proargnames, p.proargmodes) as a(n, m)
   where p.proname = 'people_activity' and p.pronamespace = 'public'::regnamespace and m = 't'
     and n in ('profile_id', 'last_saved_at')), 2);
select test.check('...so no service id, place name, or last_active_at can ever come out of it',
  (select count(*) from pg_proc p, unnest(p.proargnames, p.proargmodes) as a(n, m)
   where p.proname = 'people_activity' and p.pronamespace = 'public'::regnamespace and m = 't'
     and (n like '%service%' or n like '%name%' or n = 'last_active_at')), 0);
select test.check('anon cannot call it',
  (select count(*) from (select 1 where has_function_privilege('anon', 'public.people_activity()', 'execute')) x), 0);
select test.check('authenticated can',
  (select count(*) from (select 1 where has_function_privilege('authenticated', 'public.people_activity()', 'execute')) x), 1);

-- ===========================================================================
\echo ''
\echo '--- A case manager: their caseload, not their region ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'admin_north');
select test.check('a case manager sees when a member on their caseload last saved a place',
  (select count(*) from public.people_activity() where profile_id = :'marcus'), 1);
select test.check('...and it is the newest save, not the first',
  (select count(*) from public.people_activity()
   where profile_id = :'marcus' and last_saved_at > now() - interval '2 hours'), 1);
select test.check('...but nothing for a member who only shares their region',
  (select count(*) from public.people_activity() where profile_id = :'tanya'), 0);
select test.check('...and still cannot read saved_places itself',
  (select count(*) from public.saved_places), 0);

select test.as_user(:'admin_south');
select test.check('a case manager in another region sees nobody',
  (select count(*) from public.people_activity()), 0);

-- ===========================================================================
\echo ''
\echo '--- A program admin: only members enrolled with their organisation ---'
-- ===========================================================================
select test.as_user(:'alice');
select test.check('a program admin sees when an enrolled member last saved a place',
  (select count(*) from public.people_activity() where profile_id = :'marcus'), 1);
select test.check('...and nobody who is not enrolled with them',
  (select count(*) from public.people_activity() where profile_id <> :'marcus'), 0);
select test.check('...and still cannot read saved_places itself',
  (select count(*) from public.saved_places), 0);

select test.as_user(:'bob');
select test.check('a program admin with no enrolled members sees nobody',
  (select count(*) from public.people_activity()), 0);

-- ===========================================================================
\echo ''
\echo '--- A member and a super admin get nothing ---'
-- ===========================================================================
select test.as_user(:'marcus');
select test.check('a member gets zero rows, not even their own',
  (select count(*) from public.people_activity()), 0);

select test.as_user(:'root');
select test.check('a super admin gets zero rows (D-171)',
  (select count(*) from public.people_activity()), 0);

-- ===========================================================================
\echo ''
\echo '--- Tidy: the fixture saves come back out ---'
-- ===========================================================================
reset role;
delete from public.saved_places
 where (member_id, service_id) in ((:'marcus', :'ged'), (:'marcus', :'warehouse'), (:'tanya', :'ged'));

reset role;
