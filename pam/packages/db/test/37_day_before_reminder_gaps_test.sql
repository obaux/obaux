-- The day-before reminder: evening visits, texts turned on later, whole place
-- names (20261010130831, D-473). Each attacks one gap found by the rehearsal.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set ola  '99999999-0000-0000-0000-000000000f01'
\set pim  '99999999-0000-0000-0000-000000000f02'
\set quin '99999999-0000-0000-0000-000000000f03'
\set sid  '99999999-0000-0000-0000-000000000f04'
\set rae  '99999999-0000-0000-0000-000000000f05'
\set p1   '88888888-0000-0000-0000-000000000f01'
\set p2   '88888888-0000-0000-0000-000000000f02'

create or replace function test.philly(days integer, hour integer)
returns timestamptz language sql stable as $$
  select (date_trunc('day', now() at time zone 'America/New_York')
          + make_interval(days => days, hours => hour)) at time zone 'America/New_York';
$$;
grant execute on function test.philly(integer, integer) to authenticated, anon, service_role;

-- How far the one queued text for a trip is from the moment expected, in seconds.
create or replace function test.text_off_by(who uuid, label text, expected timestamptz)
returns bigint language sql as $$
  select coalesce(
    (select abs(extract(epoch from (o.send_at - expected)))::bigint
     from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
     where a.member_id = who and a.note = label and o.status = 'scheduled'),
    999999)
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'ola', '12675558891'), (:'pim', '12675558892'), (:'quin', '12675558893'),
  (:'sid', '12675558894'), (:'rae', '12675558895');
insert into public.profiles (id, role, first_name, region_id, phone, access_status)
select id, 'member', n, :'region_north', ph, 'active'
from (values (:'ola'::uuid, 'Ola', '+12675558891'), (:'pim', 'Pim', '+12675558892'), (:'quin', 'Quin', '+12675558893'),
             (:'sid', 'Sid', '+12675558894'), (:'rae', 'Rae', '+12675558895')) v(id, n, ph);
insert into public.notification_preferences (member_id, sms_enabled, sms_stopped_at, quiet_hours_start, quiet_hours_end) values
  (:'ola', true, null, 21, 7), (:'pim', true, null, 22, 6), (:'sid', true, now(), 21, 7), (:'rae', true, null, 21, 7);
-- quin has no row at all: nobody has asked.
insert into public.services (id, name, category, address, source, needs_review, is_active) values
  (:'p1', 'Gap Test Center', 'workforce', '77 Gap St, Philadelphia, PA 19107', 'manual', false, true),
  (:'p2', 'Philadelphia Workforce Development Opportunities Center', 'workforce', '', 'manual', false, true);

-- ===========================================================================
\echo ''
\echo '--- (a) Evening visits: the reminder is on the day before ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'ola', false);
select public.book_trip(:'p1', test.philly(4, 10), 'ten');
select public.book_trip(:'p1', test.philly(5, 21) + interval '30 minutes', 'half past nine');
select public.book_trip(:'p1', test.philly(6, 22), 'ten at night');
select public.book_trip(:'p1', test.philly(7, 6), 'six in the morning');
select public.book_trip(:'p1', test.philly(8, 21), 'nine at night');
select set_config('request.jwt.claim.sub', :'pim', false);
select public.book_trip(:'p1', test.philly(4, 22) + interval '30 minutes', 'late');
select public.book_trip(:'p1', test.philly(5, 5), 'early');
select public.book_trip(:'p1', test.philly(6, 21) + interval '30 minutes', 'before their quiet hours');
reset role;
select set_config('request.jwt.claim.sub', '', false);

select test.check('a mid-morning visit: the text at the 24-hour mark, as before',
  test.text_off_by(:'ola', 'ten', test.philly(3, 10)), 0);
select test.check('a 21:30 visit: 20:55 the evening before, not 07:00 the morning of',
  test.text_off_by(:'ola', 'half past nine', test.philly(4, 20) + interval '55 minutes'), 0);
select test.check('a 22:00 visit: 20:55 the evening before',
  test.text_off_by(:'ola', 'ten at night', test.philly(5, 20) + interval '55 minutes'), 0);
select test.check('a 21:00 visit: 20:55 the evening before',
  test.text_off_by(:'ola', 'nine at night', test.philly(7, 20) + interval '55 minutes'), 0);
select test.check('a 06:00 visit: 07:00 the day before, the end of quiet hours',
  test.text_off_by(:'ola', 'six in the morning', test.philly(6, 7)), 0);
select test.check('their own quiet hours (22-06): a 22:30 visit is texted at 21:55',
  test.text_off_by(:'pim', 'late', test.philly(3, 21) + interval '55 minutes'), 0);
select test.check('...a 05:00 visit at 06:00 the day before',
  test.text_off_by(:'pim', 'early', test.philly(4, 6)), 0);
select test.check('...and a 21:30 visit is outside their quiet hours: the plain mark',
  test.text_off_by(:'pim', 'before their quiet hours', test.philly(5, 21) + interval '30 minutes'), 0);
select test.check('none of the evening texts is left for the morning of the visit',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
   where a.member_id = :'ola'::uuid and o.status = 'scheduled'
     and (o.send_at at time zone 'America/New_York')::date = (a.starts_at at time zone 'America/New_York')::date), 0::bigint);
select test.check('a visit planned under a day ahead has no moment on the day before: today''s rule (the mark, already past)',
  (case when public.reminder_moment(:'ola', now() + interval '2 hours', 'America/New_York') <= now() then 1 else 0 end)::bigint, 1::bigint);

-- ===========================================================================
\echo ''
\echo '--- (b) Texts turned on after planning ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'quin', false);
select public.book_trip(:'p1', test.philly(4, 10), 'first');
select public.book_trip(:'p1', test.philly(6, 14), 'second');
select public.book_trip(:'p1', test.philly(7, 11), 'cancelled one');
select public.cancel_trip((select id from public.appointments where member_id = :'quin'::uuid and note = 'cancelled one'));
select public.book_trip(:'p1', now() + interval '5 hours', 'soon');
select set_config('request.jwt.claim.sub', :'sid', false);
select public.book_trip(:'p1', test.philly(5, 9), 'stopped trip');
reset role;
select set_config('request.jwt.claim.sub', '', false);

select test.check('never asked: no text for either trip',
  (select count(*) from public.outbound_messages where member_id = :'quin'::uuid and status = 'scheduled'), 0::bigint);
select test.check('sent STOP: no text for the trip',
  (select count(*) from public.outbound_messages where member_id = :'sid'::uuid and status = 'scheduled'), 0::bigint);

insert into public.notification_preferences (member_id, sms_enabled, sms_stopped_at) values (:'quin', true, null);
select test.check('texts turned on: both future trips get their text',
  (select count(*) from public.outbound_messages where member_id = :'quin'::uuid and status = 'scheduled'), 2::bigint);
select test.check('...at the right moments',
  test.text_off_by(:'quin', 'first', test.philly(3, 10)) + test.text_off_by(:'quin', 'second', test.philly(5, 14)), 0);
select test.check('...none for the trip whose reminder moment has passed',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
   where a.note = 'soon' and a.member_id = :'quin'::uuid), 0::bigint);
select test.check('...nor for the trip that was cancelled',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
   where a.note = 'cancelled one' and a.member_id = :'quin'::uuid and o.status = 'scheduled'), 0::bigint);

update public.notification_preferences set quiet_hours_start = 20 where member_id = :'quin';
select test.check('changing another preference queues nothing twice',
  (select count(*) from public.outbound_messages where member_id = :'quin'::uuid and template_key = 'appointment_24h'), 2::bigint);
update public.notification_preferences set sms_enabled = false where member_id = :'quin';
update public.notification_preferences set sms_enabled = true where member_id = :'quin';
select test.check('turning them off and on again still leaves one text a trip',
  (select count(*) from public.outbound_messages where member_id = :'quin'::uuid and status = 'scheduled'), 2::bigint);

update public.notification_preferences set sms_stopped_at = null where member_id = :'sid';
select test.check('a STOP cleared by START: the trip gets its text',
  test.text_off_by(:'sid', 'stopped trip', test.philly(4, 9)), 0);

-- ===========================================================================
\echo ''
\echo '--- (c) The whole place name ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'rae', false);
select public.book_trip(:'p2', test.philly(4, 10), 'long name');
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('a long place name is passed whole, not cut at 34 characters',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
   where a.note = 'long name' and o.vars->>'address' = 'Philadelphia Workforce Development Opportunities Center'), 1::bigint);

\echo ''
\echo 'reminder gaps: all checks passed'
