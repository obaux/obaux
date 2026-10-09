-- A case manager reaches the people assigned to them, and no one else (0082,
-- D-415). Will, 9 October 2026: "only people assigned to that case manager,
-- and it would also narrow who can read points and badges."
--
-- The attack is a second case manager in the *same* city with nobody assigned:
-- before 0082 `admin_covers()` let them read Marcus, his points and badges,
-- and limit him, because the region matched. 02_rls_test.sql already proves
-- the other-city case; this file proves the same-city one, and that an
-- assignment is what moves access, in both directions.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana         '33333333-0000-0000-0000-00000000000a'
\set marcus       '33333333-0000-0000-0000-00000000000c'
\set tanya        '33333333-0000-0000-0000-00000000000d'
\set erin         '33333333-0000-0000-0000-0000000000ee'
\set region_north '11111111-0000-0000-0000-000000000001'

reset role;
-- Erin: a case manager in Dana's city (North) with an empty caseload.
insert into auth.users (id) values (:'erin');
insert into public.profiles (id, role, first_name, region_id, access_status)
values (:'erin', 'admin', 'Erin', :'region_north', 'active');
-- Marcus has earned a badge, so there is something besides points to reach for.
insert into public.member_badges (member_id, badge_id)
select :'marcus', id from public.badges where key = 'first_visit';

-- ===========================================================================
\echo ''
\echo '--- The assigned case manager still reaches their person ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'dana');
select test.check('Dana reads Marcus, who is on her caseload',
  (select count(*) from public.profiles where id = :'marcus'), 1);
select test.check('Dana reads Marcus''s points',
  (select (count(*) > 0)::int from public.points_ledger where member_id = :'marcus'), 1);
select test.check('Dana reads Marcus''s balance',
  (select (public.member_points(:'marcus') is not null)::int), 1);
select test.check('Dana reads Marcus''s badges',
  (select count(*) from public.member_badges where member_id = :'marcus'), 1);

-- ===========================================================================
\echo ''
\echo '--- ...and not the unassigned member in the same city ---'
-- ===========================================================================
select test.check('Dana cannot read Tanya, who is in her city but not assigned',
  (select count(*) from public.profiles where id = :'tanya'), 0);
select test.check('Dana gets no balance for Tanya',
  (select (public.member_points(:'tanya') is not null)::int), 0);
select test.check_raises('Dana cannot limit Tanya',
  format($$select public.admin_set_access_status(%L, 'limited', 'testing')$$, :'tanya'));

-- ===========================================================================
\echo ''
\echo '--- A second case manager in the same city reaches nobody ---'
-- ===========================================================================
select test.as_user(:'erin');
select test.check('Erin cannot read Marcus, though they share a city',
  (select count(*) from public.profiles where id = :'marcus'), 0);
select test.check('Erin cannot read Tanya either',
  (select count(*) from public.profiles where id = :'tanya'), 0);
select test.check('Erin cannot read Marcus''s points',
  (select count(*) from public.points_ledger where member_id = :'marcus'), 0);
select test.check('Erin gets no balance for Marcus',
  (select (public.member_points(:'marcus') is not null)::int), 0);
select test.check('Erin cannot read Marcus''s badges',
  (select count(*) from public.member_badges where member_id = :'marcus'), 0);
select test.check('Erin cannot read Marcus''s enrollments',
  (select count(*) from public.enrollments where member_id = :'marcus'), 0);
select test.check_raises('Erin cannot limit Marcus',
  format($$select public.admin_set_access_status(%L, 'limited', 'testing')$$, :'marcus'));
select test.check_raises('Erin cannot switch a feature off for Marcus',
  format($$select public.admin_set_feature_access(%L, 'map', false, 'testing', 'testing')$$, :'marcus'));

-- ===========================================================================
\echo ''
\echo '--- An assignment is what moves access, in both directions ---'
-- ===========================================================================
reset role;
update public.admin_assignments set ended_at = now()
 where admin_id = :'dana' and member_id = :'marcus' and ended_at is null;
insert into public.admin_assignments (admin_id, member_id) values (:'erin', :'marcus');
set role authenticated;

select test.as_user(:'dana');
select test.check('once Marcus is reassigned, Dana no longer reads him',
  (select count(*) from public.profiles where id = :'marcus'), 0);
select test.check('...nor his points',
  (select count(*) from public.points_ledger where member_id = :'marcus'), 0);

select test.as_user(:'erin');
select test.check('...and Erin, now assigned, does',
  (select count(*) from public.profiles where id = :'marcus'), 1);
select test.check('...with his points',
  (select (public.member_points(:'marcus') is not null)::int), 1);
select test.check('...and his badges',
  (select count(*) from public.member_badges where member_id = :'marcus'), 1);

-- Put the fixture back exactly as 01_seed.sql left it.
reset role;
delete from public.admin_assignments where admin_id = :'erin' and member_id = :'marcus';
update public.admin_assignments set ended_at = null
 where admin_id = :'dana' and member_id = :'marcus';
delete from public.member_badges where member_id = :'marcus';
set role authenticated;
