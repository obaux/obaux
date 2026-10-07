-- One account, two roles: member and program (0078, D-374, D-375).
--
-- Jo is a member in the North who now works at Riverside (Alice's program).
-- One phone, one account. These attack the promises the design makes:
-- acting as a member reaches no program data; switching only to a role
-- given; never a member of their own program, so never in its lists; still a
-- member to everybody else (points, their case manager); only member +
-- program together, only in the same city; nobody's role changes from the
-- API but through switch_role.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set admin_north   '33333333-0000-0000-0000-00000000000a'
\set marcus        '33333333-0000-0000-0000-00000000000c'
\set alice         '33333333-0000-0000-0000-00000000000f'
\set southside     '33333333-0000-0000-0000-000000000010'
\set jo            '33333333-0000-0000-0000-0000000000e1'
\set org_north     '22222222-0000-0000-0000-000000000001'
\set region_north  '11111111-0000-0000-0000-000000000001'
\set riverside_svc '44444444-0000-0000-0000-000000000001'
\set southside_svc '44444444-0000-0000-0000-000000000002'

reset role;
insert into auth.users (id, phone) values (:'jo', '12675550401');
insert into public.profiles (id, role, first_name, region_id, phone, access_status)
values (:'jo', 'member', 'Jo', :'region_north', '+12675550401', 'active');
-- Jo's case manager, and a place Jo saved before working anywhere.
insert into public.admin_assignments (admin_id, member_id) values (:'admin_north', :'jo');
insert into public.enrollments (member_id, service_id, status) values (:'jo', :'southside_svc', 'interested');

-- ===========================================================================
\echo ''
\echo '--- Every account holds the role it was made with ---'
-- ===========================================================================
select test.check('a new profile holds its role',
  (select count(*) from public.profile_roles where profile_id = :'jo' and role = 'member'), 1);
select test.check('everybody already in Pam was given their role',
  (select count(*) from public.profiles p
    where not exists (select 1 from public.profile_roles r where r.profile_id = p.id and r.role = p.role)), 0);
select test.check_raises('only member and program go together',
  format($$insert into public.profile_roles (profile_id, role) values (%L, 'admin')$$, :'jo'));

-- ===========================================================================
\echo ''
\echo '--- Adding a program role from an invite for Jo''s number ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'alice');
select (public.create_invite('provider', '267-555-0401', null, 'Jo')).code as jo_code \gset
select test.as_user(:'admin_north');
select (public.create_invite('admin', '267-555-0401', null, 'Jo')).code as jo_cm_code \gset
select test.as_user(:'southside');
select (public.create_invite('provider', '267-555-0401', null, 'Jo')).code as jo_south_code \gset

-- The newest waiting invite is the South one: another city, so not addable.
select test.as_user(:'jo');
select test.check('an invite from another city cannot be added (both roles in one city)',
  (select count(*) from public.pending_invite_for_me() where has_account and not can_add), 1);
select test.check_raises('...and adding it is refused',
  format($$select public.add_role_from_invite(%L)$$, :'jo_south_code'));
select test.check_raises('a case manager invite cannot be added to a member',
  format($$select public.add_role_from_invite(%L)$$, :'jo_cm_code'));

reset role;
update public.invites set status = 'revoked' where code in (:'jo_south_code', :'jo_cm_code');
set role authenticated;
select test.as_user(:'jo');
select test.check('the program invite from Jo''s own city can be added',
  (select count(*) from public.pending_invite_for_me() where code = :'jo_code' and has_account and can_add), 1);

select test.as_user(:'marcus');
select test.check_raises('somebody else cannot use Jo''s invite',
  format($$select public.add_role_from_invite(%L)$$, :'jo_code'));

select test.as_user(:'jo');
select (public.add_role_from_invite(:'jo_code')).role as jo_acting \gset
select test.check('Jo now holds both roles',
  (select count(*) from public.profile_roles where profile_id = :'jo'), 2);
select test.check('...and starts acting as the program, having just said yes to it',
  (select count(*) from (select 1 where :'jo_acting' = 'provider') x), 1);

-- Jo's program is set up (Add a program does this in the app).
reset role;
update public.profiles set org_id = :'org_north' where id = :'jo';

-- ===========================================================================
\echo ''
\echo '--- Acting as the program, then as a member ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'jo');
select test.check('acting as the program, Jo sees the program''s enrollments',
  (select count(*) from public.enrollments where service_id = :'riverside_svc'), 1);

select (public.switch_role('member')).role as jo_now \gset
select test.check('switch_role moves Jo to the member side',
  (select count(*) from (select 1 where :'jo_now' = 'member') x), 1);
select test.check('acting as a member, no program data is reachable',
  (select count(*) from public.enrollments where service_id = :'riverside_svc'), 0);
select test.check('...the program''s own listing is not editable',
  (select count(*) from public.services where org_id = :'org_north' and public.my_org() is not null), 0);
select test.check('...but Jo''s own enrollment is still Jo''s',
  (select count(*) from public.enrollments where member_id = :'jo'), 1);

select test.check_raises('nobody switches to a role they were not given',
  $$select public.switch_role('admin')$$);
select test.check_raises('the role cannot be changed through the API',
  format($$update public.profiles set role = 'provider' where id = %L$$, :'jo'));

-- ===========================================================================
\echo ''
\echo '--- Never a member of their own program ---'
-- ===========================================================================
select test.check_raises('Jo cannot sign up for their own program as a member',
  format($$insert into public.enrollments (member_id, service_id) values (%L, %L)$$, :'jo', :'riverside_svc'));

select test.as_user(:'alice');
select test.check_raises('a colleague cannot book Jo into their own program',
  format($$insert into public.appointments (member_id, service_id, starts_at) values (%L, %L, now() + interval '1 day')$$,
         :'jo', :'riverside_svc'));
select test.check('Jo is not in Riverside''s activity list',
  (select count(*) from public.people_activity() where profile_id = :'jo'), 0);

-- Joining as staff where the member side is already enrolled is refused
-- until that enrollment ends.
reset role;
select test.check_raises('Jo cannot be made staff of Southside while enrolled there',
  format($$update public.profiles set org_id = '22222222-0000-0000-0000-000000000002' where id = %L$$, :'jo'));
set role authenticated;

-- ===========================================================================
\echo ''
\echo '--- Still a member to everybody else ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'jo');
select (public.switch_role('provider')).role as jo_back \gset

reset role;
insert into public.saved_places (member_id, service_id) values (:'jo', :'southside_svc');
select test.check('acting as the program, Jo still earns member points',
  (select count(*) from public.points_ledger where member_id = :'jo' and reason = 'save_place'), 1);

set role authenticated;
select test.as_user(:'admin_north');
select test.check('Jo''s case manager still sees Jo''s activity while Jo acts as a program',
  (select count(*) from public.people_activity() where profile_id = :'jo'), 1);
reset role;
select test.check('...and can still message Jo',
  (select count(*) from (select 1 where public.can_message(:'admin_north', :'jo')) x), 1);
