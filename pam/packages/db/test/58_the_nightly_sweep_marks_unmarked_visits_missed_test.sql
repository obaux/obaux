-- the nightly sweep marks unmarked visits missed (test 58).
--
-- Claimed 2026-10-11 on `claude/places-programs-attendance-c-missed` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set lead1  'cccccccc-0000-0000-0000-000000005802'
\set leadp  'cccccccc-0000-0000-0000-000000005804'
\set org1   'dddddddd-0000-0000-0000-000000005801'
\set org2   'dddddddd-0000-0000-0000-000000005802'
\set prog1  'eeeeeeee-0000-0000-0000-000000005801'
\set prog2  'eeeeeeee-0000-0000-0000-000000005802'
\set prog3  'eeeeeeee-0000-0000-0000-000000005803'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'lead1', '12675558582'), (:'leadp', '12675558584');
insert into public.orgs (id, name, type, region_id) values
  (:'org1', 'Sweep Org One', 'program', :'region_north'), (:'org2', 'Sweep Org Two', 'program', :'region_north');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'lead1', 'provider', 'Lou', null, :'region_north', '+12675558582', 'active', :'org1'),
  (:'leadp', 'provider', 'Pax', null, :'region_north', '+12675558584', 'limited', :'org2');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Sweep Program One', 'workforce', '1 Sweep St', 'manual', false, true),
  (:'prog2', :'org2', 'Sweep Program Two (lead paused)', 'education', '2 Sweep St', 'manual', false, true),
  (:'prog3', null, 'Sweep Place Three (no lead)', 'education', '3 Sweep St', 'manual', false, true);
-- 1 ended 2 days ago at a place with a lead; 2 ended 20 hours ago; 3 ended 2 days ago but cancelled;
-- 4 ended 2 days ago and attended; 5 two days ago at a paused lead; 6 two days ago at a place with no lead;
-- 7 no end time, started 2 days ago; 8 starts in 2 days.
insert into public.appointments (id, member_id, service_id, starts_at, ends_at, status) values
  ('aaaaaaaa-0000-0000-0000-000000005801', :'tanya', :'prog1', now() - interval '2 days 1 hour', now() - interval '2 days', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005802', :'tanya', :'prog1', now() - interval '21 hours', now() - interval '20 hours', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005803', :'tanya', :'prog1', now() - interval '2 days 1 hour', now() - interval '2 days', 'cancelled'),
  ('aaaaaaaa-0000-0000-0000-000000005804', :'tanya', :'prog1', now() - interval '2 days 1 hour', now() - interval '2 days', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005805', :'tanya', :'prog2', now() - interval '2 days 1 hour', now() - interval '2 days', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005806', :'tanya', :'prog3', now() - interval '2 days 1 hour', now() - interval '2 days', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005807', :'tanya', :'prog1', now() - interval '2 days', null, 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005808', :'tanya', :'prog1', now() + interval '2 days', now() + interval '2 days 1 hour', 'scheduled');
update public.appointments set status = 'attended', attendance_method = 'provider_checkin', checked_in_at = starts_at
  where id = 'aaaaaaaa-0000-0000-0000-000000005804';
create temp table before_points as select coalesce(sum(delta), 0) as total from public.points_ledger where member_id = :'tanya';
create temp table before_texts as select (select count(*) from public.reminders) + (select count(*) from public.notifications) as total;

\echo ''
\echo '--- The sweep ---'
set role service_role;
select public.sweep_missed_visits() as swept \gset
select test.check('it marks at least our two visits at the program with a lead (others in the database may be marked too)',
  (select :swept >= 2)::int, 1);
reset role;
select test.check('...the one that ended two days ago',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005801' and status = 'missed'), 1::bigint);
select test.check('...and the one with no end time, a day after it would have ended',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005807' and status = 'missed'), 1::bigint);
select test.check('one that ended 20 hours ago is not missed yet',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005802' and status = 'scheduled'), 1::bigint);
select test.check('a cancelled visit stays cancelled',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005803' and status = 'cancelled'), 1::bigint);
select test.check('an attended visit stays attended',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005804' and status = 'attended'), 1::bigint);
select test.check('a visit at a program whose lead is paused stays scheduled',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005805' and status = 'scheduled'), 1::bigint);
select test.check('a visit at a place with no lead on Pam stays scheduled',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005806' and status = 'scheduled'), 1::bigint);
select test.check('a visit still to come stays scheduled',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005808' and status = 'scheduled'), 1::bigint);
select test.check('no point moved',
  (select coalesce(sum(delta), 0) - (select total from before_points) from public.points_ledger where member_id = :'tanya'), 0::bigint);
select test.check('no reminder and no notification was made for it',
  (select (select count(*) from public.reminders) + (select count(*) from public.notifications) - (select total from before_texts)), 0::bigint);
select test.check('a second night finds nothing more',
  (select public.sweep_missed_visits() from (select 1) x), 0);

\echo ''
\echo '--- The lead can still mark a missed visit, and it pays ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('within 14 days the lead''s here turns a missed visit to attended and pays 100',
  (select points from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005801')), 100);
reset role;
select test.check('...attended',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005801' and status = 'attended'), 1::bigint);

\echo ''
\echo '--- Who can run it ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check_raises('a signed-in lead cannot run the sweep', $f$select public.sweep_missed_visits()$f$);
reset role;
set role anon;
select test.check_raises('nobody signed out can', $f$select public.sweep_missed_visits()$f$);
reset role;

\echo ''
\echo 'sweep: all checks passed'
