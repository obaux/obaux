-- a member says I'm here or I went (test 59).
--
-- Claimed 2026-10-11 on `claude/places-programs-im-here` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set mem1  'cccccccc-0000-0000-0000-000000005911'
\set mem2  'cccccccc-0000-0000-0000-000000005912'
\set lead1 'cccccccc-0000-0000-0000-000000005902'
\set org1  'dddddddd-0000-0000-0000-000000005901'
\set prog1 'eeeeeeee-0000-0000-0000-000000005901'
\set prog2 'eeeeeeee-0000-0000-0000-000000005902'

create or replace function test.check_raises_like(label text, stmt text, pattern text)
returns void
language plpgsql
as $$
begin
  begin
    execute stmt;
  exception when others then
    if sqlerrm like pattern then
      raise notice 'ok    % (%)', label, left(sqlerrm, 40);
      return;
    end if;
    raise exception E'FAIL  %\n        raised "%", expected like "%"', label, sqlerrm, pattern;
  end;
  raise exception 'FAIL  % — the statement was allowed and should not have been', label;
end;
$$;
grant execute on function test.check_raises_like(text, text, text) to authenticated, anon, service_role;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'mem1', '12675558591'), (:'mem2', '12675558592'), (:'lead1', '12675558593');
insert into public.orgs (id, name, type, region_id) values (:'org1', 'Here Org One', 'program', :'region_north');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'mem1', 'member', 'Mia', null, :'region_north', '+12675558591', 'active', null),
  (:'mem2', 'member', 'Max', null, :'region_north', '+12675558592', 'active', null),
  (:'lead1', 'provider', 'Lou', null, :'region_north', '+12675558593', 'active', :'org1');
-- The place sits at 39.95262, -75.16521. prog2 has no stored location.
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active, geo) values
  (:'prog1', :'org1', 'Here Program One', 'workforce', '1 Here St', 'manual', false, true,
   extensions.st_setsrid(extensions.st_makepoint(-75.16521, 39.95262), 4326)::extensions.geography);
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog2', :'org1', 'Here Program Two (no location)', 'education', '2 Here St', 'manual', false, true);
-- Visits, planned a day ago unless said: under way now.
insert into public.appointments (id, member_id, service_id, starts_at, ends_at, status, created_at) values
  ('aaaaaaaa-0000-0000-0000-000000005901', :'mem1', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000005902', :'mem1', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000005903', :'mem1', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled', now() - interval '1 hour'),
  ('aaaaaaaa-0000-0000-0000-000000005904', :'mem1', :'prog1', now() + interval '3 days', now() + interval '3 days 1 hour', 'scheduled', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000005905', :'mem1', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'cancelled', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000005906', :'mem1', :'prog2', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000005907', :'mem2', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000005908', :'mem2', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-000000005909', :'mem2', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-00000000590a', :'mem2', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled', now() - interval '1 day'),
  ('aaaaaaaa-0000-0000-0000-00000000590b', :'mem2', :'prog1', now() - interval '6 hours', now() - interval '5 hours', 'scheduled', now() - interval '1 day');
create function pg_temp.pts(m uuid) returns bigint language sql as $$
  select coalesce(sum(delta), 0) from public.points_ledger where member_id = m and subject_id::text like 'aaaaaaaa-0000-0000-0000-0000000059%'
$$;

\echo ''
\echo '--- I''m here: the phone''s position, once, on a tap ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem1', false);
-- 160 m north of the place (0.001439 degrees) is too far; 140 m (0.001259) is near enough.
select test.check('160 m away is not there yet',
  (select (there::int) from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005901', 39.95262 + 0.001439, -75.16521)), 0);
reset role;
select test.check('...and nothing was written: still scheduled, no points, no audit row',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005901' and status = 'scheduled' and checked_in_at is null)
  + (select count(*) from public.points_ledger where subject_id = 'aaaaaaaa-0000-0000-0000-000000005901')
  + (select count(*) from public.audit_log where target_id = 'aaaaaaaa-0000-0000-0000-000000005901'), 1::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem1', false);
select test.check('140 m away is there, and pays 100',
  (select points from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005901', 39.95262 + 0.001259, -75.16521)), 100);
select test.check('tapping again pays nothing more',
  (select points from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005901', 39.95262, -75.16521)), 0);
reset role;
select test.check('...attended by position, with one ledger row of 100',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005901' and status = 'attended' and attendance_method = 'geofence')
  + (select count(*) from public.points_ledger where subject_id = 'aaaaaaaa-0000-0000-0000-000000005901' and delta = 100 and reason = 'attend_appointment_verified'), 2::bigint);
select test.check('NO POSITION WAS KEPT: no audit row or ledger row holds the numbers sent',
  (select count(*) from public.audit_log where meta::text ~ '39\.95|75\.16') + (select count(*) from public.points_ledger where reason ~ '39\.95|75\.16'), 0::bigint);
select test.check('...the audit row says only the points',
  (select count(*) from public.audit_log where action = 'visit.i_am_here' and target_id = 'aaaaaaaa-0000-0000-0000-000000005901' and meta = '{"points": 100}'::jsonb), 1::bigint);
select test.check('...and the visit''s own location is untouched',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005901' and geo is null), 1::bigint);

\echo ''
\echo '--- Who cannot, and when ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem2', false);
select test.check_raises_like('another member cannot mark this member''s visit',
  $f$select * from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005902', 39.95262, -75.16521)$f$, '%VISIT_NOT_FOUND%');
select test.check_raises_like('...or say they went',
  $f$select * from public.i_went('aaaaaaaa-0000-0000-0000-000000005902')$f$, '%VISIT_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check_raises_like('a lead cannot say a member is here by position',
  $f$select * from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005902', 39.95262, -75.16521)$f$, '%VISIT_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'mem1', false);
select test.check_raises_like('a visit planned less than 2 hours before it started is refused',
  $f$select * from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005903', 39.95262, -75.16521)$f$, '%PLANNED_TOO_LATE%');
select test.check_raises_like('...for I went too',
  $f$select * from public.i_went('aaaaaaaa-0000-0000-0000-000000005903')$f$, '%PLANNED_TOO_LATE%');
select test.check_raises_like('a visit days away is refused',
  $f$select * from public.i_went('aaaaaaaa-0000-0000-0000-000000005904')$f$, '%OUTSIDE_THE_VISIT_WINDOW%');
select test.check_raises_like('a cancelled visit is refused',
  $f$select * from public.i_went('aaaaaaaa-0000-0000-0000-000000005905')$f$, '%VISIT_CANCELLED%');
select test.check_raises_like('a place with no stored location cannot check a position',
  $f$select * from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005906', 39.95262, -75.16521)$f$, '%NO_PLACE_LOCATION%');
select test.check_raises_like('a position that is not on Earth is refused',
  $f$select * from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005902', 200, -75.16521)$f$, '%BAD_POSITION%');
select test.check_raises_like('no position at all is refused',
  $f$select * from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005902', null, null)$f$, '%BAD_POSITION%');
select test.check('...but a place with no location still takes "I went" (60)',
  (select points from public.i_went('aaaaaaaa-0000-0000-0000-000000005906')), 60);
reset role;
set role anon;
select test.check_raises('nobody signed out can', $f$select * from public.i_am_here('aaaaaaaa-0000-0000-0000-000000005902', 39.95262, -75.16521)$f$);
select test.check_raises('...or say they went', $f$select * from public.i_went('aaaaaaaa-0000-0000-0000-000000005902')$f$);
reset role;

\echo ''
\echo '--- I went: no position, 60, and at most 3 in 7 days ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem2', false);
select test.check('I went pays 60', (select points from public.i_went('aaaaaaaa-0000-0000-0000-000000005907')), 60);
select test.check('...once', (select points from public.i_went('aaaaaaaa-0000-0000-0000-000000005907')), 0);
select test.check('a second pays 60', (select points from public.i_went('aaaaaaaa-0000-0000-0000-000000005908')), 60);
select test.check('a third pays 60', (select points from public.i_went('aaaaaaaa-0000-0000-0000-000000005909')), 60);
select test.check_raises_like('a fourth in the week is refused',
  $f$select * from public.i_went('aaaaaaaa-0000-0000-0000-00000000590a')$f$, '%SELF_REPORT_LIMIT%');
select test.check('...but by position it still pays (the cap is for the word, not the phone)',
  (select points from public.i_am_here('aaaaaaaa-0000-0000-0000-00000000590a', 39.95262, -75.16521)), 100);
reset role;
select test.check('the visit is self-reported and no position is kept',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005907' and status = 'attended' and attendance_method = 'sms_reply'), 1::bigint);

\echo ''
\echo '--- The lead after the member''s own word ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('the lead''s here after a self-report pays the 40 that is missing',
  (select points from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005907')), 40);
reset role;
select test.check('...so the visit is worth 100, by the lead',
  pg_temp.pts(:'mem2') - 60 - 60 - 100, 100::bigint);
select test.check('...and its method is the lead''s',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005907' and attendance_method = 'provider_checkin'), 1::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('undo takes back the lead''s 40 only',
  (select points from public.undo_check_in('aaaaaaaa-0000-0000-0000-000000005907')), -40);
reset role;
select test.check('...the member''s own word stands: attended, self-reported',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005907' and status = 'attended' and attendance_method = 'sms_reply'), 1::bigint);
select test.check('...worth 60 again', (select coalesce(sum(delta), 0) from public.points_ledger where subject_id = 'aaaaaaaa-0000-0000-0000-000000005907'), 60::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('undo now has nothing of the lead''s to take back: it changes nothing and raises nothing',
  (select points from public.undo_check_in('aaaaaaaa-0000-0000-0000-000000005907')), 0);
select test.check('marking again restores the 40 once',
  (select points from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005907')), 40);
select test.check('a lead''s mark on a visit the phone already proved pays nothing more',
  (select points from public.check_in_visit('aaaaaaaa-0000-0000-0000-00000000590a')), 0);
select test.check('...and an undo of the member''s own proof changes nothing and raises nothing',
  (select points from public.undo_check_in('aaaaaaaa-0000-0000-0000-00000000590a')), 0);
reset role;
select test.check('the lead''s mark on the proven visit changed nothing about how it was marked',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-00000000590a' and attendance_method = 'geofence'), 1::bigint);

\echo ''
\echo 'i am here: all checks passed'
