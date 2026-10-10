-- Nothing but an account text leaves Pam until `texts_live` is on (20261010141859, D-481).
-- Off: a reminder and every alert stay scheduled and the dispatcher is handed none; the account
-- texts (a sign-in code, a decision on a request, the notice that parts of Pam are off, the two
-- invitations) go exactly as before. On: both go. Off again: held again. Default: off.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set ivo '99999999-0000-0000-0000-0000000a7801'

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

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'ivo', '12675559401');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'ivo', 'member', 'Ivo', :'region_north', '+12675559401', 'active');
insert into public.notification_preferences (member_id, sms_enabled, quiet_hours_start, quiet_hours_end)
values (:'ivo', true, 0, 0);
delete from public.outbound_messages;

-- ===========================================================================
\echo ''
\echo '--- The switch starts off, and a fresh database is held ---'
-- ===========================================================================
-- The migration inserted it 'off'; earlier tests turned it on to test sending, so put it back.
update public.app_settings set value = 'off' where key = 'texts_live';
select test.check('there is exactly one texts_live setting',
  (select count(*) from public.app_settings where key = 'texts_live'), 1::bigint);
select test.check_text('...and off is how it ships',
  (select value from public.app_settings where key = 'texts_live'), 'off');

insert into public.outbound_messages (member_id, template_key, vars, send_at) values
  (:'ivo', 'appointment_24h',  '{"time":"10:00 AM","address":"1 Main St","link":"https://x.test/trips/"}', now() - interval '1 minute'),
  (:'ivo', 'saved_place_closed', '{"reason":"closed","link":"https://x.test/"}', now() - interval '1 minute'),
  (:'ivo', 'message_waiting',  '{"link":"https://x.test/messages/"}', now() - interval '1 minute'),
  (:'ivo', 'visit_booked',     '{"link":"https://x.test/"}', now() - interval '1 minute'),
  (:'ivo', 'booking_changed',  '{"link":"https://x.test/"}', now() - interval '1 minute'),
  (:'ivo', 'trip_planned',     '{"link":"https://x.test/"}', now() - interval '1 minute'),
  (:'ivo', 'attendance_check', '{}', now() - interval '1 minute'),
  (:'ivo', 'verify_code',      '{"code":"123456"}', now() - interval '1 minute'),
  (:'ivo', 'invite_member',    '{"link":"https://x.test/"}', now() - interval '1 minute'),
  (:'ivo', 'access_limited_notice', '{"supportPhone":"555-0100"}', now() - interval '1 minute'),
  (:'ivo', 'staff_request_approved', '{"link":"https://x.test/"}', now() - interval '1 minute');
-- A denied staff request has no member: a phone-only account text.
insert into public.outbound_messages (phone, template_key, vars, send_at, locale)
values ('+12675559499', 'staff_request_denied', '{"supportPhone":"555-0100"}', now() - interval '1 minute', 'en');

set role service_role;
create temp table held as select * from public.claim_outbound_messages(100);
reset role;
select test.check('off: the dispatcher is handed the five account texts',
  (select count(*) from held), 5::bigint);
select test.check_text('...and only those',
  (select string_agg(template_key, ',' order by template_key) from held),
  'access_limited_notice,invite_member,staff_request_approved,staff_request_denied,verify_code');
select test.check('off: a reminder and every alert are still scheduled, not cancelled',
  (select count(*) from public.outbound_messages
    where status = 'scheduled' and template_key in
      ('appointment_24h', 'saved_place_closed', 'message_waiting', 'visit_booked', 'booking_changed', 'trip_planned', 'attendance_check')),
  7::bigint);

-- ===========================================================================
\echo ''
\echo '--- On: the held texts go, once ---'
-- ===========================================================================
update public.app_settings set value = 'on' where key = 'texts_live';
set role service_role;
select test.check('on: the reminder and the six alerts are handed over',
  (select count(*) from public.claim_outbound_messages(100)), 7::bigint);
select test.check('...and nothing is handed over twice',
  (select count(*) from public.claim_outbound_messages(100)), 0::bigint);
reset role;

-- ===========================================================================
\echo ''
\echo '--- Off again: held again, and anything but "on" is off ---'
-- ===========================================================================
insert into public.outbound_messages (member_id, template_key, vars, send_at)
values (:'ivo', 'message_waiting', '{"link":"https://x.test/messages/"}', now() - interval '1 minute');
update public.app_settings set value = 'off' where key = 'texts_live';
set role service_role;
select test.check('off again: a new alert is not handed over',
  (select count(*) from public.claim_outbound_messages(100)), 0::bigint);
reset role;
update public.app_settings set value = 'ON ' where key = 'texts_live';
set role service_role;
select test.check('"ON " is not on: only the exact word opens it',
  (select count(*) from public.claim_outbound_messages(100)), 0::bigint);
reset role;
delete from public.app_settings where key = 'texts_live';
set role service_role;
select test.check('a missing setting holds too',
  (select count(*) from public.claim_outbound_messages(100)), 0::bigint);
reset role;
select test.check('...and the held alert is still waiting',
  (select count(*) from public.outbound_messages where status = 'scheduled' and template_key = 'message_waiting'), 1::bigint);

-- The migration's insert is idempotent: it never overwrites a value somebody set.
insert into public.app_settings (key, value, description) values ('texts_live', 'on', 'x') on conflict (key) do nothing;
insert into public.app_settings (key, value, description) values ('texts_live', 'off', 'y') on conflict (key) do nothing;
select test.check_text('inserting again does not overwrite',
  (select value from public.app_settings where key = 'texts_live'), 'on');
-- Leave it the way the other tests expect to find it: on, for the ones that test sending.
select 'done' as done;
