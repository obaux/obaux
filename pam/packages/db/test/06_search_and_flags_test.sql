-- 0066: search with typo tolerance, reported places for reviewers only, and
-- a program's name beside a program admin in a conversation.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set admin_north   '33333333-0000-0000-0000-00000000000a'
\set marcus        '33333333-0000-0000-0000-00000000000c'
\set tanya         '33333333-0000-0000-0000-00000000000d'
\set root          '33333333-0000-0000-0000-000000000020'
\set ged           '44444444-0000-0000-0000-000000000011'
\set warehouse     '44444444-0000-0000-0000-000000000012'

-- Two places of this file's own: the seed's are flagged, removed and
-- restored by 03_invariants.sql, so their state by now is that file's, not
-- the seed's. Published, walk-in, with a point (City Hall, roughly).
reset role;
insert into public.services (id, org_id, name, category, subcategory, address, is_active, needs_review, is_walk_in, geo)
values
  (:'ged', '22222222-0000-0000-0000-000000000001', 'Riverside GED Classes', 'education', 'ged_high_school',
   '100 Market St', true, false, true,
   extensions.st_setsrid(extensions.st_makepoint(-75.1652, 39.9526), 4326)::extensions.geography),
  (:'warehouse', '22222222-0000-0000-0000-000000000002', 'Southside Job Training', 'workforce', 'job_training',
   '200 Warehouse Row', true, false, true,
   extensions.st_setsrid(extensions.st_makepoint(-75.16, 39.95), 4326)::extensions.geography);

-- ===========================================================================
\echo ''
\echo '--- Searching a place by name tolerates a typo (0066) ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'marcus');

select test.check('an exact word finds the place',
  (select count(*) from public.services_search('GED', 39.9526, -75.1652) where id = :'ged'), 1);
select test.check('a misspelling still finds it',
  (select count(*) from public.services_search('ged clases', 39.9526, -75.1652) where id = :'ged'), 1);
select test.check('...and does not drag in an unrelated place',
  (select count(*) from public.services_search('ged clases', 39.9526, -75.1652) where id = :'warehouse'), 0);
select test.check('a word from the address matches too',
  (select count(*) from public.services_search('warehouse', 39.9526, -75.1652) where id = :'warehouse'), 1);
select test.check('a blank query returns nothing rather than everything',
  (select count(*) from public.services_search('   ', 39.9526, -75.1652)), 0);
select test.check('a member never sees the unreviewed import row through search',
  (select count(*) from public.services_search('Unreviewed', 39.9526, -75.1652)), 0);

-- ===========================================================================
\echo ''
\echo '--- Reported places are for reviewers only (0066) ---'
-- ===========================================================================
-- Tanya flags the warehouse; it leaves the public list and lands on the
-- reviewers' one.
select test.as_user(:'tanya');
select (public.flag_service(:'warehouse', 'moved', 'Sign on the door')).id as flag_id \gset

select test.check('the member who flagged it does not get the reviewers'' list',
  (select count(*) from public.flagged_services()), 0);

select test.as_user(:'marcus');
select test.check('...and neither does any other member',
  (select count(*) from public.flagged_services()), 0);

select test.as_user(:'admin_north');
select test.check('a case manager sees the reported place, with its reason',
  (select count(*) from public.flagged_services() where id = :'warehouse' and reason = 'moved' and flag_id = :'flag_id'), 1);

select test.as_user(:'root');
select test.check('a super admin sees it too',
  (select count(*) from public.flagged_services() where id = :'warehouse'), 1);

-- Resolving takes it off the reviewers' list (and, for "keep", back on the public one).
select public.resolve_service_flag(:'flag_id', 'keep', 'Phoned them, same address');
select test.check('once decided, it is no longer reported',
  (select count(*) from public.flagged_services() where id = :'warehouse'), 0);

-- ===========================================================================
\echo ''
\echo '--- A program admin''s organisation is named beside them (0066) ---'
-- ===========================================================================
select test.as_user(:'marcus');
select test.check('the program admin in a member''s conversation carries the org name',
  (select count(*) from public.conversation_partners()
   where role = 'provider' and program_name = 'Riverside Learning Center'), 1);
select test.check('a case manager in a member''s conversation carries none',
  (select count(*) from public.conversation_partners() where role = 'admin' and program_name is not null), 0);
select test.check('...and still no activity info or contact details',
  (select count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'conversation_partners'
     and column_name in ('last_active_at', 'phone')), 0);

reset role;
