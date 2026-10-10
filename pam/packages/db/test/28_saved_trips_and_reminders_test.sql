-- A planned trip is saved, and its day-before reminder is queued
-- (20261010074045, D-454).
--
-- The promise on the done screen is "We will remind you the day before if text
-- reminders are on". These attack both halves of it: a trip is really saved,
-- for its own member only; and the one text that goes with it is queued ONLY
-- for somebody who turned reminders on — never for someone never asked (the
-- dispatcher's claim does not stop that case, 0039/0042), someone who said no,
-- or someone who sent STOP — follows the trip when it moves, and is cancelled
-- when the trip is.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north  '11111111-0000-0000-0000-000000000001'
\set yes           '99999999-0000-0000-0000-000000000801'
\set never         '99999999-0000-0000-0000-000000000802'
\set off           '99999999-0000-0000-0000-000000000803'
\set stopped       '99999999-0000-0000-0000-000000000804'
\set lead          '99999999-0000-0000-0000-000000000805'
\set place         '88888888-0000-0000-0000-000000000801'
\set hidden_place  '88888888-0000-0000-0000-000000000802'

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

-- A moment N days from today at a local (Philadelphia) hour, whatever the
-- clocks are doing: 10:00 there is "10:00 AM" in the text all year.
create or replace function test.philly(days integer, hour integer)
returns timestamptz
language sql
stable
as $$
  select (date_trunc('day', now() at time zone 'America/New_York')
          + make_interval(days => days, hours => hour)) at time zone 'America/New_York';
$$;
grant execute on function test.philly(integer, integer) to authenticated, anon, service_role;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'yes', '12675559801'), (:'never', '12675559802'), (:'off', '12675559803'),
  (:'stopped', '12675559804'), (:'lead', '12675559805');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'yes', 'member', 'Yara', :'region_north', '+12675559801', 'active'),
  (:'never', 'member', 'Nell', :'region_north', '+12675559802', 'active'),
  (:'off', 'member', 'Otis', :'region_north', '+12675559803', 'active'),
  (:'stopped', 'member', 'Stan', :'region_north', '+12675559804', 'active'),
  (:'lead', 'provider', 'Lia', :'region_north', '+12675559805', 'active');
-- "never" has no preferences row at all: nobody has asked them yet.
insert into public.notification_preferences (member_id, sms_enabled, sms_stopped_at) values
  (:'yes', true, null), (:'off', false, null), (:'stopped', true, now());
insert into public.services (id, name, category, address, source, needs_review, is_active) values
  (:'place', 'Riverside Job Center', 'workforce', '1234 Market St, Philadelphia, PA 19107', 'manual', false, true),
  (:'hidden_place', 'Not Yet Reviewed', 'workforce', '9 Elm St', 'manual', true, true);

-- ===========================================================================
\echo ''
\echo '--- A trip is saved, for its own member ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'yes', false);

do $$
declare
  trip public.appointments;
begin
  trip := public.book_trip('88888888-0000-0000-0000-000000000801', test.philly(3, 10), '  bring my ID  ');
  if trip.member_id <> '99999999-0000-0000-0000-000000000801'::uuid or trip.status <> 'scheduled' then
    raise exception 'FAIL  the trip is not the caller''s, scheduled';
  end if;
  if trip.note <> 'bring my ID' or trip.location_text <> '1234 Market St, Philadelphia, PA 19107' then
    raise exception 'FAIL  the note or the place''s address was not kept';
  end if;
  raise notice 'ok    a member plans a trip and it is saved with the place''s address and their note';
end;
$$;

select test.check('they can read it back, with the place and a note',
  (select count(*) from public.my_trips() where place_name = 'Riverside Job Center' and note = 'bring my ID'), 1);

select set_config('request.jwt.claim.sub', :'never', false);
select test.check('nobody else reads it', (select count(*) from public.my_trips()), 0);

select test.check_raises_like('a trip in the past is refused',
  $$select public.book_trip('88888888-0000-0000-0000-000000000801', now() - interval '1 hour')$$, '%TRIP_IN_THE_PAST%');
select test.check_raises_like('a place that does not exist is refused',
  $$select public.book_trip('88888888-0000-0000-0000-0000000008ff', test.philly(3, 10))$$, '%PLACE_NOT_FOUND%');
select test.check_raises_like('a place Pam has not approved is refused',
  $$select public.book_trip('88888888-0000-0000-0000-000000000802', test.philly(3, 10))$$, '%PLACE_NOT_FOUND%');

select set_config('request.jwt.claim.sub', :'lead', false);
select test.check_raises_like('a program lead is not planning a trip',
  $$select public.book_trip('88888888-0000-0000-0000-000000000801', test.philly(3, 10))$$, '%NOT_A_MEMBER%');

reset role;
set role anon;
select test.check_raises('nobody signed in plans a trip',
  $$select public.book_trip('88888888-0000-0000-0000-000000000801', test.philly(3, 10))$$);

-- ===========================================================================
\echo ''
\echo '--- The day-before text: only for someone who turned reminders on ---'
-- ===========================================================================
reset role;
select set_config('request.jwt.claim.sub', '', false);

do $$
declare
  o public.outbound_messages;
  n integer;
begin
  select count(*) into n from public.outbound_messages
  where member_id = '99999999-0000-0000-0000-000000000801' and template_key = 'appointment_24h';
  if n <> 1 then
    raise exception 'FAIL  a member with reminders on has % day-before texts queued, expected 1', n;
  end if;
  select * into o from public.outbound_messages
  where member_id = '99999999-0000-0000-0000-000000000801' and template_key = 'appointment_24h';
  if o.status <> 'scheduled' or o.appointment_id is null then
    raise exception 'FAIL  the text is not a scheduled one tied to its trip';
  end if;
  if abs(extract(epoch from (o.send_at - (test.philly(3, 10) - interval '24 hours')))) > 1 then
    raise exception 'FAIL  the text is not queued for 24 hours before the visit (%)', o.send_at;
  end if;
  if o.vars->>'time' <> '10:00 AM' or o.vars->>'address' <> '1234 Market St' then
    raise exception 'FAIL  the text carries % / %, expected 10:00 AM / 1234 Market St', o.vars->>'time', o.vars->>'address';
  end if;
  if o.vars->>'link' not like '%/trips/' then
    raise exception 'FAIL  the text''s link is %', o.vars->>'link';
  end if;
  raise notice 'ok    one day-before text is queued: 24 hours ahead, local time, street only, a link to Trips';
end;
$$;

-- Someone never asked, someone who said no, and someone who sent STOP.
set role authenticated;
select set_config('request.jwt.claim.sub', :'never', false);
select public.book_trip(:'place', test.philly(3, 10));
select set_config('request.jwt.claim.sub', :'off', false);
select public.book_trip(:'place', test.philly(3, 10));
select set_config('request.jwt.claim.sub', :'stopped', false);
select public.book_trip(:'place', test.philly(3, 10));
reset role;
select set_config('request.jwt.claim.sub', '', false);

select test.check('never asked: the trip is saved and no text is queued',
  (select count(*) from public.appointments a where a.member_id = :'never')
  * 10 + (select count(*) from public.outbound_messages where member_id = :'never'), 10);
select test.check('said no: the trip is saved and no text is queued',
  (select count(*) from public.appointments a where a.member_id = :'off')
  * 10 + (select count(*) from public.outbound_messages where member_id = :'off'), 10);
select test.check('sent STOP: the trip is saved and no text is queued',
  (select count(*) from public.appointments a where a.member_id = :'stopped')
  * 10 + (select count(*) from public.outbound_messages where member_id = :'stopped'), 10);

-- A visit less than a day away is saved, with no day-before text.
set role authenticated;
select set_config('request.jwt.claim.sub', :'yes', false);
select public.book_trip(:'place', now() + interval '6 hours');
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('a visit less than a day away is saved with no day-before text',
  (select count(*) from public.outbound_messages
   where member_id = :'yes' and template_key = 'appointment_24h' and status = 'scheduled'), 1);

-- ===========================================================================
\echo ''
\echo '--- Moving and cancelling follow the text ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'never', false);
select test.check_raises_like('nobody moves somebody else''s trip',
  format($f$select public.move_trip(%L, test.philly(5, 10))$f$,
         (select id from public.appointments where member_id = '99999999-0000-0000-0000-000000000801' and starts_at > now() + interval '2 days' limit 1)),
  '%TRIP_NOT_FOUND%');
select test.check_raises_like('nobody cancels somebody else''s trip',
  format($f$select public.cancel_trip(%L)$f$,
         (select id from public.appointments where member_id = '99999999-0000-0000-0000-000000000801' and starts_at > now() + interval '2 days' limit 1)),
  '%TRIP_NOT_FOUND%');

select set_config('request.jwt.claim.sub', :'yes', false);
do $$
declare
  trip_id uuid;
begin
  select id into trip_id from public.appointments
  where member_id = '99999999-0000-0000-0000-000000000801' and starts_at > now() + interval '2 days';
  perform public.move_trip(trip_id, test.philly(6, 14));
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '', false);

do $$
declare
  n integer;
  o public.outbound_messages;
begin
  select count(*) into n from public.outbound_messages
  where member_id = '99999999-0000-0000-0000-000000000801' and template_key = 'appointment_24h' and status = 'scheduled';
  if n <> 1 then
    raise exception 'FAIL  moving a trip left % scheduled texts, expected 1', n;
  end if;
  select * into o from public.outbound_messages
  where member_id = '99999999-0000-0000-0000-000000000801' and template_key = 'appointment_24h' and status = 'scheduled';
  if abs(extract(epoch from (o.send_at - (test.philly(6, 14) - interval '24 hours')))) > 1
     or o.vars->>'time' <> '2:00 PM' then
    raise exception 'FAIL  the moved trip''s text was not re-timed (% / %)', o.send_at, o.vars->>'time';
  end if;
  raise notice 'ok    moving a trip re-times its one text, and the time in it';
end;
$$;

-- Moved to less than a day away: the text is cancelled, and says why.
set role authenticated;
select set_config('request.jwt.claim.sub', :'yes', false);
do $$
declare
  trip_id uuid;
begin
  select id into trip_id from public.appointments
  where member_id = '99999999-0000-0000-0000-000000000801' and starts_at > now() + interval '5 days';
  perform public.move_trip(trip_id, now() + interval '5 hours');
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('moved to less than a day away: its text is cancelled',
  (select count(*) from public.outbound_messages
   where member_id = :'yes' and status = 'cancelled' and failure_reason = 'the visit is less than a day away'), 1);

-- Moved back out: queued again. Cancelled: cancelled.
set role authenticated;
select set_config('request.jwt.claim.sub', :'yes', false);
do $$
declare
  trip_id uuid;
begin
  select id into trip_id from public.appointments
  where member_id = '99999999-0000-0000-0000-000000000801' and starts_at < now() + interval '6 hours' and starts_at > now();
  perform public.move_trip(trip_id, test.philly(4, 9));
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('moved back out: it is queued again, once',
  (select count(*) from public.outbound_messages
   where member_id = :'yes' and template_key = 'appointment_24h' and status = 'scheduled'), 1);

set role authenticated;
select set_config('request.jwt.claim.sub', :'yes', false);
do $$
declare
  trip_id uuid;
begin
  select id into trip_id from public.appointments
  where member_id = '99999999-0000-0000-0000-000000000801' and starts_at > now() + interval '3 days';
  perform public.cancel_trip(trip_id);
end;
$$;
select test.check('a cancelled trip leaves their list', (select count(*) from public.my_trips() where starts_at > now() + interval '3 days'), 0);
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('...and its text is cancelled',
  (select count(*) from public.outbound_messages
   where member_id = :'yes' and template_key = 'appointment_24h' and status = 'scheduled'), 0);

-- Turned on after planning: the next change to the trip queues it.
reset role;
update public.notification_preferences set sms_enabled = true where member_id = :'off';
set role authenticated;
select set_config('request.jwt.claim.sub', :'off', false);
do $$
declare
  trip_id uuid;
begin
  select id into trip_id from public.appointments where member_id = '99999999-0000-0000-0000-000000000803';
  perform public.move_trip(trip_id, test.philly(4, 11));
end;
$$;
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('reminders turned on after planning: the next change to the trip queues its text',
  (select count(*) from public.outbound_messages
   where member_id = :'off' and template_key = 'appointment_24h' and status = 'scheduled'), 1);

-- ===========================================================================
\echo ''
\echo '--- Nobody writes a trip another way ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'never', false);
select test.check_raises('a member cannot save a trip for somebody else straight to the table',
  format($f$insert into public.appointments (member_id, service_id, starts_at) values (%L, %L, now() + interval '3 days')$f$,
         '99999999-0000-0000-0000-000000000801', '88888888-0000-0000-0000-000000000801'));
select test.check_raises('a member cannot mark their own trip attended',
  $$update public.appointments set status = 'attended', attendance_method = 'sms_reply' where member_id = auth.uid()$$);
select test.check('...and a trip stays exactly as it was after the attempt',
  (select count(*) from public.appointments where member_id = auth.uid() and status = 'attended'), 0);
