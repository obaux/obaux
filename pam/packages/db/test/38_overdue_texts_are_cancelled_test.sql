-- A text that is overdue is cancelled instead of sent late (20261010130754, D-475).
--
-- A reminder for a visit that has begun is never handed over; a time-bound text
-- more than 12 hours late is cancelled; a long quiet window is allowed for; and
-- everything that is still useful late is still sent.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

-- Texts are held until the day (app_settings.texts_live, D-481); this test is about what is sent once they are on.
update public.app_settings set value = 'on' where key = 'texts_live';

\set region_north '11111111-0000-0000-0000-000000000001'
\set fay   '99999999-0000-0000-0000-000000000e01'
\set gus   '99999999-0000-0000-0000-000000000e02'
\set hal   '99999999-0000-0000-0000-000000000e03'

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

create or replace function test.claim_ids()
returns table (template_key text, member_id uuid) language sql as $$
  select c.template_key, c.member_id from public.claim_outbound_messages(100) c;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'fay', '12675559201'), (:'gus', '12675559202'), (:'hal', '12675559203');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, preferred_language) values
  (:'fay', 'member', 'Fay', :'region_north', '+12675559201', 'active', 'en'),
  (:'gus', 'member', 'Gus', :'region_north', '+12675559202', 'active', 'en'),
  (:'hal', 'member', 'Hal', :'region_north', '+12675559203', 'active', 'en');
-- Fay: default quiet hours (9 pm to 7 am), quiet right now or not. Gus: a 16-hour window.
-- Hal: quiet hours off. All three said yes to texts.
insert into public.notification_preferences (member_id, sms_enabled, quiet_hours_start, quiet_hours_end) values
  (:'fay', true, 0, 0), (:'gus', true, 0, 0), (:'hal', true, 0, 0);

create or replace function test.queue(m uuid, k text, late interval)
returns void language sql as $$
  insert into public.outbound_messages (member_id, template_key, vars, send_at)
  values (m, k, '{"time":"10:00 AM","address":"1 Main St","link":"https://x.test/trips/","code":"123456","supportPhone":"555-0100","adminFirstName":"Cass","reason":"closed"}', now() - late);
$$;

-- ===========================================================================
\echo ''
\echo '--- Time-bound texts more than 12 hours late are cancelled ---'
-- ===========================================================================
select test.queue(:'hal', 'appointment_24h', interval '13 hours');
select test.queue(:'hal', 'appointment_2h', interval '13 hours');
select test.queue(:'hal', 'appointment_morning_of', interval '13 hours');
select test.queue(:'hal', 'attendance_check', interval '13 hours');
select test.queue(:'hal', 'message_waiting', interval '13 hours');
select test.queue(:'hal', 'verify_code', interval '13 hours');
set role service_role;
select test.check('nothing time-bound and 13 hours late is handed over',
  (select count(*) from test.claim_ids()), 0::bigint);
reset role;
select test.check('...all six are cancelled',
  (select count(*) from public.outbound_messages where member_id = :'hal' and status = 'cancelled'), 6::bigint);
select test.check_text('...saying it was late, in plain words',
  (select string_agg(distinct failure_reason, '|') from public.outbound_messages where member_id = :'hal'),
  'it was more than 12 hours late');

-- ===========================================================================
\echo ''
\echo '--- ...but 11 hours late still goes ---'
-- ===========================================================================
select test.queue(:'fay', 'appointment_24h', interval '11 hours');
select test.queue(:'fay', 'message_waiting', interval '11 hours');
set role service_role;
select test.check('time-bound texts that are 11 hours late are handed over',
  (select count(*) from test.claim_ids()), 2::bigint);
reset role;

-- ===========================================================================
\echo ''
\echo '--- Texts that are still useful late are sent however late ---'
-- ===========================================================================
select test.queue(:'hal', k, interval '3 days')
from unnest(array['invite_member','invite_provider','staff_request_approved','staff_request_denied','access_limited_notice',
  'saved_place_closed','connection_request','facilitation_member','facilitation_provider','attendance_missed_followup',
  'visit_booked','booking_changed','trip_planned']) k;
set role service_role;
select test.check('thirteen texts three days late are all handed over',
  (select count(*) from test.claim_ids()), 13::bigint);
reset role;

-- ===========================================================================
\echo ''
\echo '--- A long quiet window is allowed for ---'
-- ===========================================================================
-- Gus is quiet for 16 hours (3 pm to 7 am), so a text held 15 hours by his quiet
-- hours is not stale. 18 hours is, once his window is allowed for (17 hours).
update public.notification_preferences set quiet_hours_start = 15, quiet_hours_end = 7 where member_id = :'gus';
select test.queue(:'gus', 'message_waiting', interval '15 hours');
select test.queue(:'gus', 'attendance_check', interval '18 hours');
set role service_role;
select count(*) from public.claim_outbound_messages(0);  -- runs the cancellations only
reset role;
select test.check_text('the 18-hour-old text is cancelled even with his long window',
  (select status::text from public.outbound_messages where member_id = :'gus' and template_key = 'attendance_check'), 'cancelled');
select test.check_text('...and the 15-hour-old one is kept, waiting for his quiet hours to end',
  (select status::text from public.outbound_messages where member_id = :'gus' and template_key = 'message_waiting'), 'scheduled');

-- ===========================================================================
\echo ''
\echo '--- A visit that has begun, with the reminder only an hour late ---'
-- ===========================================================================
insert into public.services (id, name, category, address, source, needs_review, is_active)
values ('88888888-0000-0000-0000-000000000e01', 'Late Place', 'education', '9 Elm St', 'manual', false, true);
insert into public.appointments (id, member_id, service_id, starts_at, timezone, status)
values ('66666666-0000-0000-0000-000000000e01', :'fay', '88888888-0000-0000-0000-000000000e01', now() - interval '10 minutes', 'America/New_York', 'scheduled');
insert into public.outbound_messages (member_id, template_key, vars, send_at, appointment_id)
values (:'fay', 'appointment_morning_of', '{"time":"9:00 AM","address":"9 Elm St","link":"https://x.test/trips/"}', now() - interval '1 hour', '66666666-0000-0000-0000-000000000e01');
set role service_role;
select test.check('a reminder one hour late, for a visit that began 10 minutes ago, is not handed over',
  (select count(*) from test.claim_ids() where template_key = 'appointment_morning_of'), 0::bigint);
reset role;
select test.check_text('...it says the visit has started',
  (select failure_reason from public.outbound_messages where appointment_id = '66666666-0000-0000-0000-000000000e01'), 'the visit has already started');

select 'done' as done;
