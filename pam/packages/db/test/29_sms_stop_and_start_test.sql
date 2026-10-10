-- A STOP or START reply is recorded by the number it came from (D-460): found by
-- the verified phone, never by a client, leaves no number in the audit log, and
-- START clears the stop without turning texts on.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set marcus '33333333-0000-0000-0000-00000000000c'
\set tanya  '33333333-0000-0000-0000-00000000000d'

reset role;
update public.profiles set phone = '+12679990301' where id = :'marcus';
update public.profiles set phone = '+12679990302' where id = :'tanya';
delete from public.notification_preferences where member_id in (:'marcus', :'tanya');
insert into public.notification_preferences (member_id, sms_enabled) values (:'marcus', true);   -- agreed
-- tanya never agreed and has no row.

-- Nobody but the receiver can call them.
set role authenticated;
select test.as_user(:'marcus');
select test.check_raises('a signed-in person cannot record a STOP, for anyone',
  $$select public.record_sms_stop('+12679990302')$$);
select test.check_raises('...nor a START',
  $$select public.record_sms_start('+12679990301')$$);
set role anon;
select test.check_raises('a signed-out visitor cannot either', $$select public.record_sms_stop('+12679990301')$$);

set role service_role;
select test.check('a STOP from a known number is recorded',
  (select case when public.record_sms_stop('+12679990301') then 1 else 0 end), 1);
select test.check('...on that person, and only that person',
  (select count(*) from public.notification_preferences where sms_stopped_at is not null and member_id = :'marcus'), 1);
select test.check('...leaving what they chose alone',
  (select count(*) from public.notification_preferences where member_id = :'marcus' and sms_enabled), 1);
select test.check('a number written the way people write it is found (formatting does not matter)',
  (select case when public.record_sms_stop('(267) 999-0301') then 1 else 0 end), 1);
select test.check('a STOP from somebody who never agreed makes a row with the stop and no yes',
  (select case when public.record_sms_stop('+12679990302') then 1 else 0 end), 1);
select test.check('...so they are never texted',
  (select count(*) from public.notification_preferences where member_id = :'tanya' and sms_stopped_at is not null and not sms_enabled), 1);
select test.check('a number nobody has is ignored, and says so',
  (select case when public.record_sms_stop('+12679990999') then 1 else 0 end), 0);
select test.check('nothing in the audit log holds a phone number or text',
  (select count(*) from public.audit_log where action in ('sms.stop', 'sms.start') and (meta::text like '%267%' or meta <> '{}'::jsonb)), 0);
select test.check('the audit log says a STOP happened to two people',
  (select count(*) from public.audit_log where action = 'sms.stop' and target_id in (:'marcus', :'tanya')), 3);

-- The first time is kept.
reset role;
update public.notification_preferences set sms_stopped_at = '2026-10-01T00:00:00Z' where member_id = :'marcus';
set role service_role;
select public.record_sms_stop('+12679990301');
select test.check('a second STOP keeps the first time',
  (select count(*) from public.notification_preferences where member_id = :'marcus' and sms_stopped_at = '2026-10-01T00:00:00Z'), 1);

-- START clears the stop and nothing more.
select test.check('a START clears the stop',
  (select case when public.record_sms_start('+12679990301') then 1 else 0 end), 1);
select test.check('...for somebody who had agreed, texts are back on as they chose',
  (select count(*) from public.notification_preferences where member_id = :'marcus' and sms_stopped_at is null and sms_enabled), 1);
select test.check('...for somebody who never agreed, a START does not make them agree',
  (select case when public.record_sms_start('+12679990302') then 1 else 0 end), 1);
select test.check('...they have no yes',
  (select count(*) from public.notification_preferences where member_id = :'tanya' and sms_stopped_at is null and not sms_enabled), 1);
select test.check('a START with nothing to clear changes nothing and says so',
  (select case when public.record_sms_start('+12679990301') then 1 else 0 end), 0);
select test.check('a START from a stranger is ignored',
  (select case when public.record_sms_start('+12679990999') then 1 else 0 end), 0);

-- The app still cannot clear a stop (D-453): START is a text reply, not the app.
reset role;
update public.notification_preferences set sms_stopped_at = now() where member_id = :'marcus';
set role authenticated;
select test.as_user(:'marcus');
select test.check_raises('a person still cannot clear their own stop from the app',
  $$update public.notification_preferences set sms_stopped_at = null where member_id = auth.uid()$$);
reset role;
