-- a program lead cannot read a visit row (test 65).
--
-- Claimed 2026-10-11 on `claude/places-programs-im-here` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set tanya  '33333333-0000-0000-0000-00000000000d'
\set lead1  'cccccccc-0000-0000-0000-000000006502'
\set lead2  'cccccccc-0000-0000-0000-000000006503'
\set org1   'dddddddd-0000-0000-0000-000000006501'
\set org2   'dddddddd-0000-0000-0000-000000006502'
\set prog1  'eeeeeeee-0000-0000-0000-000000006501'

-- A lead reads visits at their program through my_program_visits (first name, time, service, whether there) and never from the
-- appointments table: its rows carry how a visit was marked, a check-in code and a place (a63).
reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'lead1', '12675558652'), (:'lead2', '12675558653');
insert into public.orgs (id, name, type, region_id) values
  (:'org1', 'No Direct Read Org One', 'program', '11111111-0000-0000-0000-000000000001'),
  (:'org2', 'No Direct Read Org Two', 'program', '11111111-0000-0000-0000-000000000001');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'lead1', 'provider', 'Lou', null, '11111111-0000-0000-0000-000000000001', '+12675558652', 'active', :'org1'),
  (:'lead2', 'provider', 'Lee', null, '11111111-0000-0000-0000-000000000001', '+12675558653', 'active', :'org2');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'No Direct Read Program', 'workforce', '1 Read St', 'manual', false, true);
-- one visit at their program, and one the lead booked themselves (provider_id), both marked by the member
insert into public.appointments (id, member_id, service_id, provider_id, starts_at, status, location_text, check_in_code, checked_in_at, attendance_method) values
  ('aaaaaaaa-0000-0000-0000-000000006501', :'tanya', :'prog1', null, now() - interval '1 day', 'attended', '1 Read St', 'NDR501', now() - interval '1 day', 'geofence'),
  ('aaaaaaaa-0000-0000-0000-000000006502', :'tanya', :'prog1', :'lead1', now() - interval '2 days', 'attended', '1 Read St', 'NDR502', now() - interval '2 days', 'sms_reply');

\echo ''
\echo '--- A program lead reads no appointment row directly ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('a lead sees no row of a member''s visit in the table (so not how it was marked, its code or its place)',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000006501'), 0::bigint);
select test.check('...nor one they booked themselves',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000006502'), 0::bigint);
select test.check('...nor attendance_method by any route',
  (select count(*) from public.appointments where attendance_method is not null and member_id = :'tanya'), 0::bigint);
select test.check('the function still shows both visits to the lead of that program, as attended',
  (select count(*) from public.my_program_visits() where appointment_id::text like 'aaaaaaaa-0000-0000-0000-00000000650%' and status = 'attended'), 2::bigint);
select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check('a lead of another program sees none, by table or function',
  (select count(*) from public.appointments where member_id = :'tanya') + (select count(*) from public.my_program_visits() where appointment_id::text like 'aaaaaaaa-0000-0000-0000-00000000650%'), 0::bigint);
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check('a member still reads their own visits',
  (select count(*) from public.appointments where id in ('aaaaaaaa-0000-0000-0000-000000006501', 'aaaaaaaa-0000-0000-0000-000000006502')), 2::bigint);
reset role;

\echo ''
\echo 'no direct read: all checks passed'
