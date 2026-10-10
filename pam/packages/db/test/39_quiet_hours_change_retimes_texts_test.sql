-- Changing quiet hours re-times the day-before texts already queued
-- (20261010133227). Also pinned in test 36 as gap 1b.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set uma  '99999999-0000-0000-0000-000000001001'
\set vic  '99999999-0000-0000-0000-000000001002'
\set pl   '88888888-0000-0000-0000-000000001001'

create or replace function test.philly(days integer, hour integer)
returns timestamptz language sql stable as $$
  select (date_trunc('day', now() at time zone 'America/New_York')
          + make_interval(days => days, hours => hour)) at time zone 'America/New_York';
$$;
grant execute on function test.philly(integer, integer) to authenticated, anon, service_role;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'uma', '12675558871'), (:'vic', '12675558872');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'uma', 'member', 'Uma', :'region_north', '+12675558871', 'active'),
  (:'vic', 'member', 'Vic', :'region_north', '+12675558872', 'active');
-- Uma has texts on and no quiet hours at all; Vic never agreed to texts.
insert into public.notification_preferences (member_id, sms_enabled, quiet_hours_start, quiet_hours_end)
values (:'uma', true, 0, 0), (:'vic', false, 0, 0);
insert into public.services (id, name, category, address, source, needs_review, is_active)
values (:'pl', 'Retime Test Center', 'workforce', '9 Retime St, Philadelphia, PA 19107', 'manual', false, true);

set role authenticated;
select set_config('request.jwt.claim.sub', :'uma', false);
select public.book_trip(:'pl', test.philly(5, 21) + interval '30 minutes', 'evening');
select public.book_trip(:'pl', test.philly(6, 10), 'morning');
select public.cancel_trip((select id from public.appointments where member_id = :'uma'::uuid and note = 'morning')); 
select public.book_trip(:'pl', test.philly(7, 10), 'ten');
select set_config('request.jwt.claim.sub', :'vic', false);
select public.book_trip(:'pl', test.philly(5, 21) + interval '30 minutes', 'vic evening');
reset role;
select set_config('request.jwt.claim.sub', '', false);

create or replace function test.send_off_by(who uuid, label text, expected timestamptz)
returns bigint language sql as $$
  select coalesce(
    (select abs(extract(epoch from (o.send_at - expected)))::bigint
     from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
     where a.member_id = who and a.note = label and o.status = 'scheduled'),
    999999)
$$;

select test.check('no quiet hours: the 21:30 visit is texted at 21:30 the evening before',
  test.send_off_by(:'uma', 'evening', test.philly(4, 21) + interval '30 minutes'), 0);

-- ===========================================================================
\echo ''
\echo '--- A window set after planning moves the queued text ---'
-- ===========================================================================
update public.notification_preferences set quiet_hours_start = 21, quiet_hours_end = 7 where member_id = :'uma';
select test.check('the 21:30 visit''s text moves to 20:55 the evening before',
  test.send_off_by(:'uma', 'evening', test.philly(4, 20) + interval '55 minutes'), 0);
select test.check('a mid-morning visit''s text does not move',
  test.send_off_by(:'uma', 'ten', test.philly(6, 10)), 0);
select test.check('still one scheduled text a trip',
  (select count(*) from public.outbound_messages where member_id = :'uma'::uuid and status = 'scheduled'), 2::bigint);

update public.notification_preferences set quiet_hours_start = 22, quiet_hours_end = 6 where member_id = :'uma';
select test.check('widening the other way moves it again: 21:30 is outside 22-06, so the plain mark',
  test.send_off_by(:'uma', 'evening', test.philly(4, 21) + interval '30 minutes'), 0);

update public.notification_preferences set push_enabled = false where member_id = :'uma';
select test.check('changing another preference touches nothing',
  test.send_off_by(:'uma', 'evening', test.philly(4, 21) + interval '30 minutes'), 0);

select test.check('a cancelled trip is not brought back',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
   where a.note = 'morning' and o.status = 'scheduled'), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- Nobody who has not agreed to texts is queued ---'
-- ===========================================================================
update public.notification_preferences set quiet_hours_start = 21, quiet_hours_end = 7 where member_id = :'vic';
select test.check('changing quiet hours does not queue a text for someone who said no',
  (select count(*) from public.outbound_messages where member_id = :'vic'::uuid and status = 'scheduled'), 0::bigint);

\echo ''
\echo 'quiet hours re-time the texts: all checks passed'
