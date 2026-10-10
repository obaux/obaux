-- The day-before reminder, rehearsed from planning the trip to the text leaving
-- the database (D-473). Pam's north star is the message that reminds a person
-- before a visit; the day Will says go it has to work the first time. This is
-- everything on the database side of that day: the trip queues the reminder
-- for the right person, at the right time, with the right words' ingredients;
-- the claim hands it over only when it is due and allowed; and a reminder for
-- a trip that is gone, or for somebody who said STOP or never said yes, never
-- leaves. The other half — the words, in seven languages, and the call to
-- Twilio — is packages/config/test/dispatch-sms.test.ts.
--
-- Sections marked KNOWN GAP pin a behaviour that is wrong today and reported to
-- the merge desk. They pass on today's behaviour on purpose: whoever fixes the
-- gap will see exactly that check go red and flips it.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

-- Texts are held until the day (app_settings.texts_live, D-481); this test is about what is sent once they are on.
update public.app_settings set value = 'on' where key = 'texts_live';

\set region_north '11111111-0000-0000-0000-000000000001'
-- Ids end in d0x (renamed at merge, 10 October): 35, written at the same time, took c0x for
-- its own member and place, and the two files run one after the other on one database.
\set ana   '99999999-0000-0000-0000-000000000d01'
\set ben   '99999999-0000-0000-0000-000000000d02'
\set cora  '99999999-0000-0000-0000-000000000d03'
\set dee   '99999999-0000-0000-0000-000000000d04'
\set eli   '99999999-0000-0000-0000-000000000d05'
\set long_place  '88888888-0000-0000-0000-000000000d01'
\set no_address  '88888888-0000-0000-0000-000000000d02'
\set svc   '77777777-0000-0000-0000-000000000d01'

-- A time on a given day (Philadelphia clock), N days from today.
create or replace function test.philly_at(days integer, hh integer, mm integer default 0)
returns timestamptz language sql stable as $$
  select (date_trunc('day', now() at time zone 'America/New_York')
          + make_interval(days => days, hours => hh, mins => mm)) at time zone 'America/New_York';
$$;
grant execute on function test.philly_at(integer, integer, integer) to authenticated, anon, service_role;

-- Words and yes/no answers, which test.check (a count) does not take.
create or replace function test.check_text(label text, actual text, expected text)
returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception E'FAIL  %\n        got %, expected %', label, coalesce(actual, '(nothing)'), expected;
  end if;
  raise notice 'ok    %', label;
end;
$$;
grant execute on function test.check_text(text, text, text) to authenticated, anon, service_role;

-- One call for what the dispatcher does every minute.
create or replace function test.claim_all()
returns setof public.outbound_messages language sql as $$
  select o.* from public.claim_outbound_messages(100) c join public.outbound_messages o on o.id = c.id;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'ana', '12675559101'), (:'ben', '12675559102'), (:'cora', '12675559103'),
  (:'dee', '12675559104'), (:'eli', '12675559105');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, preferred_language) values
  (:'ana',  'member', 'Ana',  :'region_north', '+12675559101', 'active', 'es'),
  (:'ben',  'member', 'Ben',  :'region_north', '+12675559102', 'active', 'en'),
  (:'cora', 'member', 'Cora', :'region_north', '+12675559103', 'active', 'zh-CN'),
  (:'dee',  'member', 'Dee',  :'region_north', '+12675559104', 'active', 'en'),
  (:'eli',  'member', 'Eli',  :'region_north', '+12675559105', 'active', 'ar');
insert into public.services (id, name, category, address, source, needs_review, is_active) values
  (:'long_place', 'Philadelphia Works Career Center at the Northeast Regional Library', 'education',
   '2600 Benjamin Franklin Parkway Building A, Philadelphia, PA 19130', 'manual', false, true),
  (:'no_address', 'Center for Employment Opportunities Philadelphia', 'education', null, 'manual', false, true);
insert into public.program_services (id, service_id, name) values (:'svc', :'long_place', 'Resume help');

-- Who agreed: Ana, Ben and Cora said yes. Dee and Eli were never asked (no row).
-- Quiet hours off for the agreed three unless a section sets them, so the time
-- of day the suite runs at does not matter.
insert into public.notification_preferences (member_id, sms_enabled, quiet_hours_start, quiet_hours_end) values
  (:'ana', true, 0, 0), (:'ben', true, 0, 0), (:'cora', true, 0, 0);

-- ===========================================================================
\echo ''
\echo '--- Planning a trip queues the day-before reminder, once, for the right person ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
select public.book_trip_at_service(:'long_place', test.philly_at(3, 10), :'svc', 'bring ID');

reset role;
select test.check('one reminder is queued for Ana, and only one',
  (select count(*) from public.outbound_messages where member_id = :'ana'), 1::bigint);
select test.check('...it is the day-before text',
  (select count(*) from public.outbound_messages where member_id = :'ana' and template_key = 'appointment_24h' and status = 'scheduled'), 1::bigint);
select test.check('...it goes out exactly 24 hours before the visit',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where o.member_id = :'ana' and o.send_at = a.starts_at - interval '24 hours'), 1::bigint);
select test.check('...and it belongs to that trip',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where o.member_id = :'ana' and a.member_id = :'ana'), 1::bigint);
select test.check_text('the time is the visit''s own, on the Philadelphia clock',
  (select vars->>'time' from public.outbound_messages where member_id = :'ana'), '10:00 AM');
-- Since 20261010130831 (gap 3, Piper) the street is passed whole; the renderer cuts it at a word
-- to fit the signed text (dispatch-sms.test.ts holds the limit).
select test.check_text('the place is the street only, passed whole: the renderer cuts it at a word',
  (select vars->>'address' from public.outbound_messages where member_id = :'ana'), '2600 Benjamin Franklin Parkway Building A');
select test.check_text('the link is the Trips screen',
  (select vars->>'link' from public.outbound_messages where member_id = :'ana'),
  (select value from public.app_settings where key = 'app_url') || '/trips/');
select test.check('naming a program service adds nothing to the text: the signed wording has no room for one (reported to the merge desk)',
  (select count(*) from public.outbound_messages where member_id = :'ana' and (vars - 'time' - 'address' - 'link') <> '{}'::jsonb), 0::bigint);

-- A place with no street falls back to its name, cut to the same room.
set role authenticated;
select public.book_trip(:'no_address', test.philly_at(4, 15, 30));
reset role;
select test.check_text('a place with no address is named instead, passed whole, not cut mid-word (gap 3, fixed)',
  (select vars->>'address' from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where o.member_id = :'ana' and a.service_id = :'no_address'), 'Center for Employment Opportunities Philadelphia');
select test.check_text('...and a half-past time reads as one',
  (select vars->>'time' from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where o.member_id = :'ana' and a.service_id = :'no_address'), '3:30 PM');

-- ===========================================================================
\echo ''
\echo '--- The claim hands it over at the right time, once, in the right language ---'
-- ===========================================================================
set role service_role;
select test.check('before it is due, the claim hands over nothing',
  (select count(*) from test.claim_all()), 0::bigint);
reset role;

-- Time passes: the 10:00 reminder becomes due. (The suite cannot wait a day.)
update public.outbound_messages set send_at = now() - interval '1 minute'
where member_id = :'ana' and vars->>'time' = '10:00 AM';

set role service_role;
create temp table claimed as select * from public.claim_outbound_messages(100);
select test.check('once due, the claim hands over exactly that reminder',
  (select count(*) from claimed), 1::bigint);
select test.check('...for Ana, to her number, in Spanish',
  (select count(*) from claimed where member_id = :'ana' and phone = '+12675559101' and locale = 'es'), 1::bigint);
select test.check('...with the day-before wording and its three ingredients',
  (select count(*) from claimed where template_key = 'appointment_24h'
     and vars ? 'time' and vars ? 'address' and vars ? 'link'), 1::bigint);
select test.check('...and marks it sent so a second run cannot send it again',
  (select count(*) from public.claim_outbound_messages(100)), 0::bigint);
reset role;
select test.check('the later trip''s reminder is still waiting',
  (select count(*) from public.outbound_messages where member_id = :'ana' and status = 'scheduled'), 1::bigint);
select test.check('the language is the one on the profile today, not the one when the trip was planned',
  (select count(*) from (
     select 1 from public.profiles where id = :'ana' and preferred_language = 'es') x), 1::bigint);
update public.profiles set preferred_language = 'pt-BR' where id = :'ana';
update public.outbound_messages set send_at = now() - interval '1 minute' where member_id = :'ana' and status = 'scheduled';
set role service_role;
select test.check_text('...a member who changes language before the send is texted in the new one',
  (select locale from public.claim_outbound_messages(100)), 'pt-BR');
reset role;
update public.profiles set preferred_language = 'es' where id = :'ana';

-- ===========================================================================
\echo ''
\echo '--- Quiet hours hold it, and it goes out after them ---'
-- ===========================================================================
-- Ben's window is the two hours that contain this moment, so he is quiet now.
set role authenticated;
select set_config('request.jwt.claim.sub', :'ben', false);
select public.book_trip(:'long_place', test.philly_at(3, 10));
reset role;
update public.notification_preferences
set quiet_hours_start = extract(hour from now() at time zone 'America/New_York')::int,
    quiet_hours_end   = (extract(hour from now() at time zone 'America/New_York')::int + 2) % 24
where member_id = :'ben';
update public.outbound_messages set send_at = now() - interval '1 minute' where member_id = :'ben';

set role service_role;
select test.check('inside quiet hours a due reminder is not handed over',
  (select count(*) from test.claim_all() where member_id = :'ben'), 0::bigint);
reset role;
select test.check('...and it is still waiting, not lost',
  (select count(*) from public.outbound_messages where member_id = :'ben' and status = 'scheduled'), 1::bigint);

update public.notification_preferences set quiet_hours_start = 0, quiet_hours_end = 0 where member_id = :'ben';
-- Changing the window re-times a queued text (20261010133227); this test is about the dispatcher, so it
-- makes the text due again by hand, as it did above.
update public.outbound_messages set send_at = now() - interval '1 minute' where member_id = :'ben';
set role service_role;
select test.check('once quiet hours are over it goes out',
  (select count(*) from test.claim_all() where member_id = :'ben' and template_key = 'appointment_24h'), 1::bigint);
reset role;

-- ===========================================================================
\echo ''
\echo '--- STOP before the send cancels it ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'cora', false);
select public.book_trip(:'long_place', test.philly_at(3, 11));
reset role;
select test.check('Cora''s reminder is queued',
  (select count(*) from public.outbound_messages where member_id = :'cora' and status = 'scheduled'), 1::bigint);
set role service_role;
select test.check('her STOP reply, as sms-inbound records it, finds her by number',
  (select case when public.record_sms_stop('+12675559103') then 1 else 0 end)::bigint, 1::bigint);
reset role;
update public.outbound_messages set send_at = now() - interval '1 minute' where member_id = :'cora';
set role service_role;
select test.check('a reminder due after STOP is not handed over',
  (select count(*) from test.claim_all() where member_id = :'cora'), 0::bigint);
reset role;
select test.check_text('...it is cancelled, and says why',
  (select failure_reason from public.outbound_messages where member_id = :'cora'), 'member stopped texts');
set role authenticated;
select public.book_trip(:'long_place', test.philly_at(5, 11));
reset role;
select test.check('a trip planned after STOP queues nothing',
  (select count(*) from public.outbound_messages where member_id = :'cora' and status = 'scheduled'), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- Somebody never asked gets nothing ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'dee', false);
select public.book_trip(:'long_place', test.philly_at(3, 10));
reset role;
select test.check('a member with no texts choice queues no reminder',
  (select count(*) from public.outbound_messages where member_id = :'dee'), 0::bigint);

-- ...and if something else queued one anyway, the claim is the last line.
insert into public.outbound_messages (member_id, template_key, vars, send_at)
values (:'dee', 'appointment_24h', '{"time":"10:00 AM","address":"1 Main St","link":"https://x.test/trips/"}', now() - interval '1 minute');
set role service_role;
select test.check('a reminder queued by mistake for somebody who never agreed is not handed over',
  (select count(*) from test.claim_all() where member_id = :'dee'), 0::bigint);
reset role;
select test.check_text('...it is cancelled, and says why',
  (select failure_reason from public.outbound_messages where member_id = :'dee'), 'never agreed to texts');

-- Said no, which is not the same as never asked.
insert into public.notification_preferences (member_id, sms_enabled) values (:'eli', false);
set role authenticated;
select set_config('request.jwt.claim.sub', :'eli', false);
select public.book_trip(:'long_place', test.philly_at(3, 10));
reset role;
select test.check('a member who turned texts off queues no reminder',
  (select count(*) from public.outbound_messages where member_id = :'eli'), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- A trip that is cancelled or moved does not text the old plan ---'
-- ===========================================================================
-- The appointment trigger is Piper's. This is what must stay true of it.
reset role;
update public.notification_preferences set quiet_hours_start = 0, quiet_hours_end = 0, sms_enabled = true where member_id = :'ana';
delete from public.outbound_messages where member_id = :'ana' and status = 'scheduled';
delete from public.appointments where member_id = :'ana' and status = 'scheduled';

set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
select public.book_trip(:'long_place', test.philly_at(6, 9));
select public.book_trip(:'long_place', test.philly_at(7, 9));
reset role;
select test.check('two trips, two reminders',
  (select count(*) from public.outbound_messages where member_id = :'ana' and status = 'scheduled'), 2::bigint);

-- Cancel the first.
set role authenticated;
select public.cancel_trip((select id from public.appointments where member_id = :'ana' and starts_at = test.philly_at(6, 9)));
reset role;
select test.check_text('cancelling a trip cancels its reminder, and says why',
  (select failure_reason from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.member_id = :'ana' and a.starts_at = test.philly_at(6, 9)), 'the visit is no longer planned');
select test.check('...and leaves the other trip''s reminder alone',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.member_id = :'ana' and a.starts_at = test.philly_at(7, 9) and o.status = 'scheduled'), 1::bigint);
-- The test that matters: even when the old time arrives, nothing is sent.
update public.outbound_messages set send_at = now() - interval '1 minute' where member_id = :'ana' and status in ('scheduled', 'cancelled');
-- Scoped to this file's members (at merge, 10 October): 35 leaves a cancelled trip whose text was
-- already sent, on purpose (a sent text is history), and the files share one database.
select test.check('a cancelled trip''s reminder is not due: nothing for it is still scheduled',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.status = 'cancelled' and o.status = 'scheduled'
      and a.member_id in (:'ana', :'ben', :'cora', :'dee', :'eli')), 0::bigint);
set role service_role;
select test.check('...so when its time comes the claim hands over only the trip that is still on',
  (select count(*) from test.claim_all() where member_id = :'ana'), 1::bigint);
reset role;
select test.check('...and no cancelled trip has a reminder marked sent',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.status = 'cancelled' and o.status = 'sent'
      and a.member_id in (:'ana', :'ben', :'cora', :'dee', :'eli')), 0::bigint);

-- Move a trip: the reminder follows, with the new time in its words.
set role authenticated;
select public.book_trip(:'long_place', test.philly_at(8, 9));
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
select public.move_trip((select id from public.appointments where member_id = :'ana' and starts_at = test.philly_at(8, 9)), test.philly_at(9, 14));
reset role;
select test.check('moving a trip moves its reminder to a day before the new time',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.starts_at = test.philly_at(9, 14) and o.status = 'scheduled' and o.send_at = a.starts_at - interval '24 hours'), 1::bigint);
select test.check_text('...with the new time in the words',
  (select o.vars->>'time' from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.starts_at = test.philly_at(9, 14) and o.status = 'scheduled'), '2:00 PM');
select test.check('...and the old time has no reminder left',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.member_id = :'ana' and a.starts_at = test.philly_at(8, 9)), 0::bigint);
select test.check('a moved trip still has exactly one reminder waiting',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.id = (select id from public.appointments where starts_at = test.philly_at(9, 14) and member_id = :'ana') and o.status = 'scheduled'), 1::bigint);

-- Moved to under a day away: there is no "tomorrow" to remind of.
set role authenticated;
select public.move_trip((select id from public.appointments where member_id = :'ana' and starts_at = test.philly_at(9, 14)), now() + interval '5 hours');
reset role;
select test.check('moved to less than a day away, the reminder is cancelled rather than sent late',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.member_id = :'ana' and a.starts_at <= now() + interval '6 hours' and o.status = 'scheduled'), 0::bigint);

-- A visit marked as missed or attended does not text either.
set role authenticated;
select public.book_trip(:'long_place', test.philly_at(10, 9));
reset role;
update public.appointments set status = 'missed' where member_id = :'ana' and starts_at = test.philly_at(10, 9);
select test.check('a visit that is no longer scheduled has no reminder waiting',
  (select count(*) from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.starts_at = test.philly_at(10, 9) and o.status = 'scheduled'), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- The gaps the rehearsal found (1, 2 and 3 fixed by Piper''s 20261010130831, flipped at merge) ---'
-- ===========================================================================
-- 1. An evening visit (9 pm or later) has its 24-hour mark inside quiet hours. It used to be held
--    until 7 am, the morning of the visit itself, while the signed text says "tomorrow". Fixed:
--    it goes five minutes before quiet hours begin, the evening before.
reset role;
-- Ana's window was off for this suite; give her the default, 9 pm to 7 am, before she plans it.
update public.notification_preferences set quiet_hours_start = 21, quiet_hours_end = 7 where member_id = :'ana';
set role authenticated;
select set_config('request.jwt.claim.sub', :'ana', false);
select public.book_trip(:'long_place', test.philly_at(12, 21, 30));
reset role;
select test.check_text('an evening visit (21:30) is reminded at 20:55 the evening before, outside quiet hours (gap 1, fixed)',
  (select to_char(o.send_at at time zone 'America/New_York', 'YYYY-MM-DD HH24:MI')
     from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.member_id = :'ana' and a.starts_at = test.philly_at(12, 21, 30) and o.status = 'scheduled'),
  to_char(test.philly_at(11, 20, 55) at time zone 'America/New_York', 'YYYY-MM-DD HH24:MI'));
select test.check_text('...and it is not in her quiet hours',
  (select public.in_quiet_hours(:'ana', o.send_at)::text
     from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.member_id = :'ana' and a.starts_at = test.philly_at(12, 21, 30) and o.status = 'scheduled'), 'false');

-- 1b. Quiet hours changed AFTER a trip is planned re-time its reminder (fixed by 20261010133227;
--     was a KNOWN GAP): she plans the 21:30 visit with no quiet hours, then sets the usual window,
--     and the text moves from 21:30 the evening before to 20:55.
update public.notification_preferences set quiet_hours_start = 0, quiet_hours_end = 0 where member_id = :'ana';
set role authenticated;
select public.book_trip(:'long_place', test.philly_at(13, 21, 30));
reset role;
update public.notification_preferences set quiet_hours_start = 21, quiet_hours_end = 7 where member_id = :'ana';
select test.check_text('a window set after planning moves the reminder to 20:55 the evening before (gap 1b, fixed)',
  (select to_char(o.send_at at time zone 'America/New_York', 'HH24:MI')
     from public.outbound_messages o join public.appointments a on a.id = o.appointment_id
    where a.member_id = :'ana' and a.starts_at = test.philly_at(13, 21, 30) and o.status = 'scheduled'), '20:55');

-- 2. Turning texts on after planning a trip used to queue nothing for trips already planned.
--    Fixed: a real turn-on queues the reminder for every future scheduled trip.
reset role;
insert into public.notification_preferences (member_id, sms_enabled) values (:'dee', true);
select test.check('a trip planned before the member said yes gets its reminder when they do (gap 2, fixed)',
  (select count(*) from public.outbound_messages where member_id = :'dee' and status = 'scheduled'), 1::bigint);

-- (Gap 4, a late reminder going out after its visit, is fixed by 20261010130754 and
-- tested below as a plain check; the full set of lateness rules is test 38.)
reset role;
insert into public.appointments (member_id, service_id, starts_at, timezone, status)
values (:'ben', :'long_place', now() - interval '2 hours', 'America/New_York', 'scheduled');
insert into public.outbound_messages (member_id, template_key, vars, send_at, appointment_id)
select :'ben', 'appointment_24h', '{"time":"1:00 PM","address":"1 Main St","link":"https://x.test/trips/"}', now() - interval '26 hours', id
from public.appointments where member_id = :'ben' and starts_at < now();
set role service_role;
select test.check('a reminder for a visit that has already started is not handed over, however late',
  (select count(*) from test.claim_all() where member_id = :'ben' and template_key = 'appointment_24h'), 0::bigint);
reset role;
select test.check_text('...it is cancelled, and says why',
  (select failure_reason from public.outbound_messages where member_id = :'ben' and appointment_id in (select id from public.appointments where starts_at < now())), 'the visit has already started');

select 'rehearsal done' as done;
