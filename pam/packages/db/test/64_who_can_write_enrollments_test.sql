-- who can write enrollments (test 64).
--
-- Claimed 2026-10-11 on `claude/messages-program-before-booking` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set member  'cccccccc-0000-0000-0000-000000006401'
\set other   'cccccccc-0000-0000-0000-000000006402'
\set lead_a  'cccccccc-0000-0000-0000-000000006403'
\set lead_b  'cccccccc-0000-0000-0000-000000006404'
\set org_a   'dddddddd-0000-0000-0000-000000006401'
\set org_b   'dddddddd-0000-0000-0000-000000006402'
\set svc_a   'eeeeeeee-0000-0000-0000-000000006401'
\set svc_b   'eeeeeeee-0000-0000-0000-000000006402'
\set region_north '11111111-0000-0000-0000-000000000001'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'member', '12675558641'), (:'other', '12675558642'),
  (:'lead_a', '12675558643'), (:'lead_b', '12675558644');
insert into public.orgs (id, name, type, region_id) values
  (:'org_a', 'Write Org A', 'program', :'region_north'),
  (:'org_b', 'Write Org B', 'program', :'region_north');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, org_id) values
  (:'member', 'member', 'Mo', :'region_north', '+12675558641', 'active', null),
  (:'other',  'member', 'Ola', :'region_north', '+12675558642', 'active', null),
  (:'lead_a', 'provider', 'Ana', :'region_north', '+12675558643', 'active', :'org_a'),
  (:'lead_b', 'provider', 'Bea', :'region_north', '+12675558644', 'active', :'org_b');
insert into public.services (id, org_id, name, category, address, source, source_ref, needs_review, is_active) values
  (:'svc_a', :'org_a', 'Write Program A', 'workforce', '1 Write St', 'manual', null, false, true),
  (:'svc_b', :'org_b', 'Write Program B', 'workforce', '2 Write St', 'manual', null, false, true);
-- The server (postgres) seeds the row; nothing a signed-in person holds can.
insert into public.enrollments (member_id, service_id, status) values (:'member', :'svc_a', 'interested');

\echo ''
\echo '--- Who can write enrollments ---'
set role authenticated;

select test.as_user(:'member');
select test.check('a member can read their own enrollment',
  (select count(*) from public.enrollments where member_id = :'member'), 1::bigint);
select test.check_raises('a member cannot enrol themselves at any program (A)',
  format($$insert into public.enrollments (member_id, service_id) values (%L, %L)$$, :'member', :'svc_b'));
select test.check_raises('...nor at the other program',
  format($$insert into public.enrollments (member_id, service_id) values (%L, %L)$$, :'member', :'svc_a'));
select test.check_raises('a member cannot change their own enrollment',
  format($$update public.enrollments set status = 'enrolled' where member_id = %L$$, :'member'));
select test.check_raises('a member cannot delete their own enrollment',
  format($$delete from public.enrollments where member_id = %L$$, :'member'));

select test.as_user(:'other');
select test.check('another member sees none of it',
  (select count(*) from public.enrollments where member_id = :'member'), 0::bigint);

select test.as_user(:'lead_a');
select test.check_raises('a lead cannot repoint a row at another member',
  format($$update public.enrollments set member_id = %L where member_id = %L$$, :'other', :'member'));
select test.check_raises('a lead cannot repoint a row at another program',
  format($$update public.enrollments set service_id = %L where member_id = %L$$, :'svc_b', :'member'));
select test.check_raises('a lead cannot create an enrollment',
  format($$insert into public.enrollments (member_id, service_id) values (%L, %L)$$, :'other', :'svc_a'));
update public.enrollments set status = 'enrolled', notes = 'came to the intro' where member_id = :'member';
select test.check('a lead can still change status and notes on their own program''s row',
  (select count(*) from public.enrollments where member_id = :'member' and status = 'enrolled' and notes = 'came to the intro'), 1::bigint);

select test.as_user(:'lead_b');
update public.enrollments set status = 'completed' where member_id = :'member';
reset role;
select test.check('a lead of another program changes nothing here',
  (select count(*) from public.enrollments where member_id = :'member' and status = 'enrolled'), 1::bigint);

set role anon;
select test.check_raises('someone signed out cannot write one',
  format($$insert into public.enrollments (member_id, service_id) values (%L, %L)$$, :'member', :'svc_b'));
reset role;

\echo ''
\echo 'who can write enrollments: all checks passed'
