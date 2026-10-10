-- The four approved text alerts are queued when the thing they say happens
-- (20261010134429, D-478): somebody wrote to you, a visit was booked, a visit was
-- moved or cancelled, and somebody on a case manager's list planned a visit.
-- Attacks: each person's own switch decides; consent, STOP and quiet hours still
-- apply through the claim; nobody is texted about their own action; a moved
-- visit is one text, however many times and however many people made the change;
-- and the texts carry no word of their own — the template and a link.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set org1  '55555555-0000-0000-0000-0000000a7701'
\set org2  '55555555-0000-0000-0000-0000000a7702'
\set mem   '99999999-0000-0000-0000-0000000a7701'
\set mem2  '99999999-0000-0000-0000-0000000a7702'
\set cm    '99999999-0000-0000-0000-0000000a7703'
\set lead1 '99999999-0000-0000-0000-0000000a7704'
\set lead2 '99999999-0000-0000-0000-0000000a7705'
\set other '99999999-0000-0000-0000-0000000a7706'
\set place '88888888-0000-0000-0000-0000000a7701'
\set place2 '88888888-0000-0000-0000-0000000a7702'

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

create or replace function test.waiting(who uuid, k text)
returns bigint language sql as $$
  select count(*) from public.outbound_messages where member_id = who and template_key = k and status = 'scheduled';
$$;
create or replace function test.philly_day(days integer, hh integer)
returns timestamptz language sql stable as $$
  select (date_trunc('day', now() at time zone 'America/New_York') + make_interval(days => days, hours => hh)) at time zone 'America/New_York';
$$;
grant execute on function test.philly_day(integer, integer) to authenticated, anon, service_role;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'mem', '12675559301'), (:'mem2', '12675559302'), (:'cm', '12675559303'),
  (:'lead1', '12675559304'), (:'lead2', '12675559305'), (:'other', '12675559306');
insert into public.orgs (id, name, verified, region_id) values
  (:'org1', 'Alpha Program', true, :'region_north'), (:'org2', 'Beta Program', true, :'region_north');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, org_id) values
  (:'mem',   'member',   'Mia',  :'region_north', '+12675559301', 'active', null),
  (:'mem2',  'member',   'Max',  :'region_north', '+12675559302', 'active', null),
  (:'cm',    'admin',    'Cora', :'region_north', '+12675559303', 'active', null),
  (:'lead1', 'provider', 'Lia',  :'region_north', '+12675559304', 'active', :'org1'),
  (:'lead2', 'provider', 'Leo',  :'region_north', '+12675559305', 'active', :'org1'),
  (:'other', 'provider', 'Olu',  :'region_north', '+12675559306', 'active', :'org2');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'place',  :'org1', 'Alpha Center', 'education', '1 Elm St', 'manual', false, true),
  (:'place2', :'org2', 'Beta Center',  'education', '2 Elm St', 'manual', false, true);
insert into public.admin_assignments (admin_id, member_id) values (:'cm', :'mem');
-- Members are texted nothing about their own visits here; their own switch is for messages.
-- Everyone has said yes to texts and has quiet hours off, so the time of day does not matter.
insert into public.notification_preferences
  (member_id, sms_enabled, quiet_hours_start, quiet_hours_end, alert_message, alert_booked, alert_changed, alert_trip) values
  (:'mem',   true, 0, 0, true,  false, false, false),
  (:'mem2',  true, 0, 0, false, false, false, false),
  (:'cm',    true, 0, 0, true,  false, false, true),
  (:'lead1', true, 0, 0, true,  true,  true,  false),
  (:'lead2', true, 0, 0, false, true,  false, false),
  (:'other', true, 0, 0, true,  true,  true,  false);

-- Earlier tests leave their own queued texts behind; this one counts only its own.
delete from public.outbound_messages;

-- ===========================================================================
\echo ''
\echo '--- A visit is booked: the program and the case manager hear that something happened ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select public.book_trip(:'place', test.philly_day(3, 10));
reset role;
select test.check('the program''s lead with "booked" on is told',
  test.waiting(:'lead1', 'visit_booked'), 1::bigint);
select test.check('...and so is the other lead of the same program who has it on',
  test.waiting(:'lead2', 'visit_booked'), 1::bigint);
select test.check('a lead of another program is not',
  test.waiting(:'other', 'visit_booked'), 0::bigint);
select test.check('the member''s case manager is told somebody on their list planned a visit',
  test.waiting(:'cm', 'trip_planned'), 1::bigint);
select test.check('...and not the one for a program (they are not a program)',
  test.waiting(:'cm', 'visit_booked'), 0::bigint);
select test.check('the member is not texted about their own visit',
  (select count(*) from public.outbound_messages where member_id = :'mem' and template_key in ('visit_booked', 'trip_planned', 'booking_changed')), 0::bigint);
select test.check_text('the text is the signed template and a link, nothing else in it',
  (select string_agg(distinct k, ',') from public.outbound_messages o, jsonb_object_keys(o.vars) k
    where o.template_key in ('visit_booked', 'trip_planned')), 'link');
select test.check('...which is due to go out now',
  (select count(*) from public.outbound_messages where template_key in ('visit_booked', 'trip_planned') and send_at <= now()), 3::bigint);

-- ===========================================================================
\echo ''
\echo '--- A person''s own switch decides ---'
-- ===========================================================================
select test.check('a lead with "booked" off is not told',
  (select count(*) from public.outbound_messages o where o.member_id = :'lead2' and o.template_key = 'booking_changed'), 0::bigint);
-- Max (switches all off) plans a visit at the other program: nothing to its lead with changes off; the case manager is not his.
update public.notification_preferences set alert_booked = false where member_id = :'other';
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem2', false);
select public.book_trip(:'place2', test.philly_day(4, 10));
reset role;
select test.check('booked switched off: no text',
  test.waiting(:'other', 'visit_booked'), 0::bigint);
select test.check('a member with no case manager tells nobody on a list',
  (select count(*) from public.outbound_messages where template_key = 'trip_planned'), 1::bigint);
update public.notification_preferences set alert_booked = true where member_id = :'other';

-- ===========================================================================
\echo ''
\echo '--- The claim still applies consent, STOP and quiet hours ---'
-- ===========================================================================
-- STOP: Lia replied STOP after switching on. Her text is cancelled, not sent.
set role service_role;
select public.record_sms_stop('+12675559304');
select test.check('a lead who replied STOP is handed nothing, switch or not',
  (select count(*) from public.claim_outbound_messages(100) where member_id = :'lead1'), 0::bigint);
reset role;
select test.check_text('...the text is cancelled and says why',
  (select failure_reason from public.outbound_messages where member_id = :'lead1' and template_key = 'visit_booked'), 'member stopped texts');
-- Lia, stopped, is not queued a new one either.
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select public.book_trip(:'place', test.philly_day(5, 10));
reset role;
select test.check('a stopped lead is not queued a text for the next visit',
  test.waiting(:'lead1', 'visit_booked'), 0::bigint);

-- Quiet hours: Leo's window covers now, so the text is held, not lost.
update public.notification_preferences
set quiet_hours_start = extract(hour from now() at time zone 'America/New_York')::int,
    quiet_hours_end   = (extract(hour from now() at time zone 'America/New_York')::int + 2) % 24
where member_id = :'lead2';
set role service_role;
select test.check('inside quiet hours, nothing is handed over to Leo',
  (select count(*) from public.claim_outbound_messages(100) where member_id = :'lead2'), 0::bigint);
reset role;
select test.check('...his text is still waiting',
  test.waiting(:'lead2', 'visit_booked'), 1::bigint);
update public.notification_preferences set quiet_hours_start = 0, quiet_hours_end = 0 where member_id = :'lead2';
set role service_role;
select test.check('after quiet hours it goes',
  (select count(*) from public.claim_outbound_messages(100) where member_id = :'lead2' and template_key = 'visit_booked'), 1::bigint);
reset role;

-- A person who never said yes to texts has switches that send nothing.
update public.notification_preferences set sms_enabled = false where member_id = :'cm';
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select public.book_trip(:'place', test.philly_day(6, 10));
reset role;
select test.check('a case manager who has not said yes to texts is not queued one, whatever their switch',
  test.waiting(:'cm', 'trip_planned'), 0::bigint);   -- the earlier one was handed over above
update public.notification_preferences set sms_enabled = true where member_id = :'cm';
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select public.book_trip(:'place', test.philly_day(7, 10));
reset role;
select test.check('...and once they say yes, the next visit queues it',
  test.waiting(:'cm', 'trip_planned'), 1::bigint);

-- ===========================================================================
\echo ''
\echo '--- A change is one text, not one per edit, per field or per person ---'
-- ===========================================================================
delete from public.outbound_messages;
update public.notification_preferences set alert_changed = true where member_id in (:'lead2');
-- (Lia is stopped for the rest of this test.)
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select public.book_trip(:'place', test.philly_day(8, 9));
reset role;
select test.check('booking queues the "booked" text for the one lead who is not stopped',
  test.waiting(:'lead2', 'visit_booked'), 1::bigint);
-- Moved while "booked" still waits: they will see the visit as it is.
select id as trip_id from public.appointments where member_id = :'mem' and starts_at = test.philly_day(8, 9) \gset
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select public.move_trip(:'trip_id', test.philly_day(9, 9));
reset role;
select test.check('moved while the "booked" text still waits: no second text',
  test.waiting(:'lead2', 'booking_changed'), 0::bigint);
-- Now the "booked" text goes out.
set role service_role;
select test.check('the booked text goes',
  (select count(*) from public.claim_outbound_messages(100) where member_id = :'lead2' and template_key = 'visit_booked'), 1::bigint);
reset role;
-- With "changed" off, a move texts nobody.
update public.notification_preferences set alert_changed = false where member_id = :'lead2';
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select public.move_trip(:'trip_id', test.philly_day(10, 9));
reset role;
select test.check('a lead with "changed" off, not stopped, is told nothing of a move',
  test.waiting(:'lead2', 'booking_changed'), 0::bigint);
update public.notification_preferences set alert_changed = true where member_id = :'lead2';
-- Three changes in a row: one text.
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select public.move_trip(:'trip_id', test.philly_day(11, 9));
select public.cancel_trip(:'trip_id');
reset role;
select test.check('moved twice and then cancelled: one text waiting, not three',
  test.waiting(:'lead2', 'booking_changed'), 1::bigint);
select test.check('...nor anyone at the other program',
  (select count(*) from public.outbound_messages where member_id = :'other'), 0::bigint);
select test.check('the case manager hears about a visit planned, not about its changes',
  (select count(*) from public.outbound_messages where member_id = :'cm' and template_key <> 'trip_planned'), 0::bigint);

-- A change of something else (the note) is not a change anyone is texted about.
delete from public.outbound_messages;
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select public.book_trip(:'place', test.philly_day(12, 9), 'bring ID') ;
reset role;
update public.outbound_messages set status = 'sent', sent_at = now() where status = 'scheduled';
update public.appointments set note = 'bring two forms of ID' where member_id = :'mem' and starts_at = test.philly_day(12, 9);
select test.check('editing a note texts nobody',
  (select count(*) from public.outbound_messages where status = 'scheduled'), 0::bigint);

-- Nobody is texted about their own action.
delete from public.outbound_messages;
select set_config('request.jwt.claim.sub', :'lead2', false);
insert into public.appointments (member_id, service_id, starts_at, timezone, status)
values (:'mem', :'place', test.philly_day(13, 9), 'America/New_York', 'scheduled');
select set_config('request.jwt.claim.sub', '', false);
select test.check('a lead who makes the booking is not texted about it',
  test.waiting(:'lead2', 'visit_booked'), 0::bigint);
select test.check('...the case manager still is',
  test.waiting(:'cm', 'trip_planned'), 1::bigint);
select set_config('request.jwt.claim.sub', :'cm', false);
delete from public.outbound_messages;
insert into public.appointments (member_id, service_id, starts_at, timezone, status)
values (:'mem', :'place', test.philly_day(14, 9), 'America/New_York', 'scheduled');
select set_config('request.jwt.claim.sub', '', false);
select test.check('a case manager who plans the visit for their member is not texted about it',
  test.waiting(:'cm', 'trip_planned'), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- Somebody wrote to you ---'
-- ===========================================================================
delete from public.outbound_messages;
insert into public.conversations (id, kind) values ('44444444-0000-0000-0000-0000000a7701', 'direct');
insert into public.conversation_members (conversation_id, profile_id) values
  ('44444444-0000-0000-0000-0000000a7701', :'mem'), ('44444444-0000-0000-0000-0000000a7701', :'cm');
insert into public.messages (conversation_id, sender_id, body) values ('44444444-0000-0000-0000-0000000a7701', :'mem', 'one');
select test.check('the person written to, with "messages" on, is told',
  test.waiting(:'cm', 'message_waiting'), 1::bigint);
select test.check('...the writer is not',
  test.waiting(:'mem', 'message_waiting'), 0::bigint);
insert into public.messages (conversation_id, sender_id, body) values
  ('44444444-0000-0000-0000-0000000a7701', :'mem', 'two'), ('44444444-0000-0000-0000-0000000a7701', :'mem', 'three');
select test.check('three messages before it is sent: one text',
  test.waiting(:'cm', 'message_waiting'), 1::bigint);
select test.check_text('the text names nobody and nothing: only the link',
  (select string_agg(distinct k, ',') from public.outbound_messages o, jsonb_object_keys(o.vars) k where o.template_key = 'message_waiting'), 'link');
-- It goes; another message ten minutes later is not another text; half an hour later it is.
set role service_role;
select count(*) from public.claim_outbound_messages(100);
reset role;
insert into public.messages (conversation_id, sender_id, body) values ('44444444-0000-0000-0000-0000000a7701', :'mem', 'four');
select test.check('a message soon after the text went adds none',
  test.waiting(:'cm', 'message_waiting'), 0::bigint);
update public.outbound_messages set sent_at = now() - interval '31 minutes' where template_key = 'message_waiting';
insert into public.messages (conversation_id, sender_id, body) values ('44444444-0000-0000-0000-0000000a7701', :'mem', 'five');
select test.check('half an hour later the next message is another',
  test.waiting(:'cm', 'message_waiting'), 1::bigint);
-- The other way: Mia has "messages" on; the case manager writes back.
insert into public.messages (conversation_id, sender_id, body) values ('44444444-0000-0000-0000-0000000a7701', :'cm', 'reply');
select test.check('and the member with "messages" on is told of the reply',
  test.waiting(:'mem', 'message_waiting'), 1::bigint);
-- Switch off: nothing.
delete from public.outbound_messages;
update public.notification_preferences set alert_message = false where member_id in (:'mem', :'cm');
insert into public.messages (conversation_id, sender_id, body) values ('44444444-0000-0000-0000-0000000a7701', :'cm', 'six');
insert into public.messages (conversation_id, sender_id, body) values ('44444444-0000-0000-0000-0000000a7701', :'mem', 'seven');
select test.check('with the switch off, a message texts nobody',
  (select count(*) from public.outbound_messages), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- The switches are the person''s own ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
update public.notification_preferences set alert_message = true where member_id = :'mem';
select test.check('a person turns their own switch on',
  (select count(*) from public.notification_preferences where member_id = :'mem' and alert_message), 1::bigint);
select test.check('...but cannot read or change anyone else''s',
  (select count(*) from public.notification_preferences where member_id <> :'mem'), 0::bigint);
select test.check_raises('...nor reach the queue helper',
  $$select public.queue_text_alert('99999999-0000-0000-0000-0000000a7703', 'trip_planned', 'x')$$);
reset role;
select 'done' as done;
