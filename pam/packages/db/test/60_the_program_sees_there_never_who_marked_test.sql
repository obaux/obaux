-- the program sees there or not, never who marked it (test 60).
--
-- Claimed 2026-10-11 on `claude/places-programs-im-here` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set lead1  'cccccccc-0000-0000-0000-000000006002'
\set org1   'dddddddd-0000-0000-0000-000000006001'
\set prog1  'eeeeeeee-0000-0000-0000-000000006001'

-- The program's view says only whether a visit was marked as there, never who marked it or how
-- (D-535). A visit the member marked themselves looks exactly like one the lead marked.
reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'lead1', '12675558602');
insert into public.orgs (id, name, type, region_id) values (:'org1', 'Own Marks Org One', 'program', :'region_north');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'lead1', 'provider', 'Lou', null, :'region_north', '+12675558602', 'active', :'org1');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Own Marks Program One', 'workforce', '1 Mark St', 'manual', false, true);
insert into public.appointments (id, member_id, service_id, starts_at, status, created_at) values
  ('aaaaaaaa-0000-0000-0000-000000006001', :'tanya', :'prog1', now() - interval '1 day', 'scheduled', now() - interval '3 days'),
  ('aaaaaaaa-0000-0000-0000-000000006002', :'tanya', :'prog1', now() - interval '2 days', 'scheduled', now() - interval '3 days'),
  ('aaaaaaaa-0000-0000-0000-000000006003', :'tanya', :'prog1', now() - interval '3 days', 'scheduled', now() - interval '4 days');
update public.appointments set status = 'attended', checked_in_at = starts_at, attendance_method = 'geofence' where id = 'aaaaaaaa-0000-0000-0000-000000006001';
update public.appointments set status = 'attended', checked_in_at = starts_at, attendance_method = 'sms_reply' where id = 'aaaaaaaa-0000-0000-0000-000000006002';
update public.appointments set status = 'attended', checked_in_at = starts_at, attendance_method = 'provider_checkin' where id = 'aaaaaaaa-0000-0000-0000-000000006003';

\echo ''
\echo '--- The program sees there or not, never who marked it ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('the visit list has no column that says who marked a visit or how',
  (select count(*) from information_schema.parameters p join information_schema.routines r on r.specific_name = p.specific_name
   where r.routine_name = 'my_program_visits' and p.parameter_mode = 'OUT'
     and p.parameter_name not in ('appointment_id', 'member_id', 'first_name', 'starts_at', 'ends_at', 'status', 'service_name', 'checked_in_at')), 0::bigint);
select test.check('all three marked visits look the same to the lead: attended, with a time',
  (select count(*) from public.my_program_visits() where appointment_id::text like 'aaaaaaaa-0000-0000-0000-00000000600%' and status = 'attended' and checked_in_at is not null), 3::bigint);
select test.check('undoing a visit the member marked by position changes nothing and says nothing',
  (select points from public.undo_check_in('aaaaaaaa-0000-0000-0000-000000006001')), 0);
select test.check('...by word',
  (select points from public.undo_check_in('aaaaaaaa-0000-0000-0000-000000006002')), 0);
reset role;
select test.check('...both are still attended, by the member',
  (select count(*) from public.appointments where id in ('aaaaaaaa-0000-0000-0000-000000006001', 'aaaaaaaa-0000-0000-0000-000000006002') and status = 'attended' and attendance_method in ('geofence', 'sms_reply')), 2::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('undoing the lead''s own mark does undo it',
  (select status::text = 'scheduled' from public.undo_check_in('aaaaaaaa-0000-0000-0000-000000006003'))::int, 1);
reset role;

\echo ''
\echo 'own marks: all checks passed'
