-- The claim sends a reminder only to somebody who agreed to texts (D-453).
-- Never asked, opted in, replied STOP, said no; and the account texts that are
-- sent whoever has agreed to reminders keep going.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

-- Texts are held until the day (app_settings.texts_live, D-481); this test is about what is sent once they are on.
update public.app_settings set value = 'on' where key = 'texts_live';

\set marcus '33333333-0000-0000-0000-00000000000c'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set luis   '33333333-0000-0000-0000-00000000000e'
\set bob    '33333333-0000-0000-0000-000000000010'

reset role;
-- Nothing left over from the earlier suites, and nothing in quiet hours.
delete from public.outbound_messages;
delete from public.notification_preferences where member_id in (:'marcus', :'tanya', :'luis', :'bob');
insert into public.notification_preferences (member_id, sms_enabled, quiet_hours_start, quiet_hours_end) values
  (:'marcus', true,  0, 0),   -- opted in
  (:'luis',   false, 0, 0);   -- said no
insert into public.notification_preferences (member_id, sms_enabled, sms_stopped_at, quiet_hours_start, quiet_hours_end)
  values (:'bob', true, now(), 0, 0);   -- replied STOP
-- tanya has no row at all: never asked.
-- Digits only: the ids end in hex (000c, 000d, 000e), and a number built from
-- them read as one number for three people once the letters were dropped, so
-- this file failed whenever an earlier one had not already given them phones.
update public.profiles set phone = coalesce(phone, case id
    when :'marcus'::uuid then '+12675550701'
    when :'tanya'::uuid  then '+12675550702'
    when :'luis'::uuid   then '+12675550703'
    when :'bob'::uuid    then '+12675550704'
  end) where id in (:'marcus', :'tanya', :'luis', :'bob');

insert into public.outbound_messages (id, member_id, template_key, vars, send_at) values
  ('bbbbbbb1-0000-0000-0000-000000000001', :'marcus', 'appointment_24h', '{}', now() - interval '1 minute'),
  ('bbbbbbb1-0000-0000-0000-000000000002', :'tanya',  'appointment_24h', '{}', now() - interval '1 minute'),
  ('bbbbbbb1-0000-0000-0000-000000000003', :'luis',   'appointment_24h', '{}', now() - interval '1 minute'),
  ('bbbbbbb1-0000-0000-0000-000000000004', :'bob',    'appointment_24h', '{}', now() - interval '1 minute'),
  ('bbbbbbb1-0000-0000-0000-000000000005', :'tanya',  'saved_place_closed', '{}', now() - interval '1 minute'),
  ('bbbbbbb1-0000-0000-0000-000000000006', :'tanya',  'message_waiting', '{}', now() - interval '1 minute'),
  ('bbbbbbb1-0000-0000-0000-000000000007', :'tanya',  'staff_request_approved', '{}', now() - interval '1 minute'),
  ('bbbbbbb1-0000-0000-0000-000000000008', :'tanya',  'attendance_check', '{}', now() - interval '1 minute');
-- A denied request has no profile: a phone-only row, never gated.
insert into public.outbound_messages (id, phone, locale, template_key, vars, send_at)
  values ('bbbbbbb1-0000-0000-0000-000000000009', '+12675550199', 'en', 'staff_request_denied', '{}', now() - interval '1 minute');

create temp table claimed as select * from public.claim_outbound_messages(50);

select test.check('somebody who agreed to texts has their reminder claimed',
  (select count(*) from claimed where id = 'bbbbbbb1-0000-0000-0000-000000000001'), 1);
select test.check('somebody who was never asked does not: the reminder is not claimed',
  (select count(*) from claimed where id = 'bbbbbbb1-0000-0000-0000-000000000002'), 0);
select test.check('...it is cancelled, and says why',
  (select count(*) from public.outbound_messages where id = 'bbbbbbb1-0000-0000-0000-000000000002'
     and status = 'cancelled' and failure_reason = 'never agreed to texts'), 1);
select test.check('somebody who said no is not texted either',
  (select count(*) from public.outbound_messages where id = 'bbbbbbb1-0000-0000-0000-000000000003' and status = 'cancelled'), 1);
select test.check('...nor somebody who replied STOP',
  (select count(*) from public.outbound_messages where id = 'bbbbbbb1-0000-0000-0000-000000000004'
     and status = 'cancelled' and failure_reason = 'member stopped texts'), 1);
select test.check('a notice is a reminder too: a saved place closing is not sent to somebody never asked',
  (select count(*) from claimed where id = 'bbbbbbb1-0000-0000-0000-000000000005'), 0);
select test.check('...nor a Text alerts text',
  (select count(*) from claimed where id = 'bbbbbbb1-0000-0000-0000-000000000006'), 0);
select test.check('...nor the check-in',
  (select count(*) from claimed where id = 'bbbbbbb1-0000-0000-0000-000000000008'), 0);
-- (Whether it is sent this minute also depends on the clock: a member with no row falls under
-- the default quiet hours. What is attacked here is that consent does not cancel it.)
select test.check('an account text is not held back for consent: the decision on a staff request',
  (select count(*) from public.outbound_messages where id = 'bbbbbbb1-0000-0000-0000-000000000007'
     and status <> 'cancelled'), 1);
select test.check('...and a denial to somebody with no profile',
  (select count(*) from claimed where id = 'bbbbbbb1-0000-0000-0000-000000000009'), 1);
select test.check('nobody never asked, stopped or declined was handed to the dispatcher',
  (select count(*) from claimed where member_id in (:'luis', :'bob') or id in
     ('bbbbbbb1-0000-0000-0000-000000000002','bbbbbbb1-0000-0000-0000-000000000005','bbbbbbb1-0000-0000-0000-000000000006','bbbbbbb1-0000-0000-0000-000000000008')), 0);
select test.check('a second run finds nothing left to send',
  (select count(*) from public.claim_outbound_messages(50)), 0);

-- Once somebody agrees, the next reminder goes.
insert into public.notification_preferences (member_id, sms_enabled, quiet_hours_start, quiet_hours_end) values (:'tanya', true, 0, 0);
insert into public.outbound_messages (id, member_id, template_key, vars, send_at)
  values ('bbbbbbb1-0000-0000-0000-000000000010', :'tanya', 'appointment_24h', '{}', now() - interval '1 minute');
select test.check('...and once a never-asked member agrees, their next reminder is claimed',
  (select count(*) from public.claim_outbound_messages(50) where id = 'bbbbbbb1-0000-0000-0000-000000000010'), 1);

delete from public.outbound_messages;
