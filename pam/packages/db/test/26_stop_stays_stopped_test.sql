-- A STOP Pam has stored stays (D-453). The privacy page promises "Nothing in the
-- app can turn them back on"; this attacks the database half of that promise the
-- way a signed-in person's own client could: write the stop away, delete the row
-- and start again, or enable texts and hope that undoes it.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set marcus '33333333-0000-0000-0000-00000000000c'
\set tanya  '33333333-0000-0000-0000-00000000000d'

reset role;
delete from public.notification_preferences where member_id in (:'marcus', :'tanya');
insert into public.notification_preferences (member_id, sms_enabled, sms_stopped_at)
  values (:'marcus', true, now());
insert into public.notification_preferences (member_id, sms_enabled) values (:'tanya', false);

set role authenticated;
select test.as_user(:'marcus');

select test.check('a person reads their own row, STOP included',
  (select count(*) from public.notification_preferences where member_id = :'marcus' and sms_stopped_at is not null), 1);
select test.check_raises('they cannot write the stop away',
  $$update public.notification_preferences set sms_stopped_at = null where member_id = auth.uid()$$);
select test.check_raises('...nor set it to another time',
  $$update public.notification_preferences set sms_stopped_at = now() where member_id = auth.uid()$$);
select test.check_raises('...nor delete the row and start again',
  $$delete from public.notification_preferences where member_id = auth.uid()$$);
select test.check_raises('...nor insert a row of their own that carries a stop',
  $$insert into public.notification_preferences (member_id, sms_stopped_at) values (auth.uid(), null) on conflict (member_id) do update set sms_stopped_at = null$$);

-- What the app does still works: choosing yes, no, quiet hours.
-- (Row-level security hides the row's own other columns from nobody: they read it.)
insert into public.notification_preferences (member_id, sms_enabled) values (auth.uid(), true)
  on conflict (member_id) do update set member_id = excluded.member_id, sms_enabled = excluded.sms_enabled;
update public.notification_preferences set quiet_hours_start = 20 where member_id = auth.uid();
select test.check('the app can still save a yes, as an upsert, the way it does',
  (select count(*) from public.notification_preferences where member_id = auth.uid() and sms_enabled), 1);
select test.check('...and a person can still change their quiet hours',
  (select count(*) from public.notification_preferences where member_id = auth.uid() and quiet_hours_start = 20), 1);

reset role;
select test.check('...but the stop is still there after all of it',
  (select count(*) from public.notification_preferences where member_id = :'marcus' and sms_stopped_at is not null), 1);
select test.check('...and saying yes did not make the dispatcher send: it still cancels, with the reason',
  (select count(*) from (
     select 1 from public.notification_preferences np
     where np.member_id = :'marcus' and (np.sms_stopped_at is not null or np.sms_enabled = false)) x), 1);

-- Somebody who never sent STOP is not affected: they can still turn texts on, off, on.
set role authenticated;
select test.as_user(:'tanya');
update public.notification_preferences set sms_enabled = true where member_id = auth.uid();
select test.check('a person who never sent STOP can turn texts on',
  (select count(*) from public.notification_preferences where member_id = auth.uid() and sms_enabled), 1);
select test.check_raises('...but cannot write a stop for themselves either: only what receives STOP does',
  $$update public.notification_preferences set sms_stopped_at = now() where member_id = auth.uid()$$);
update public.notification_preferences set quiet_hours_start = 5 where member_id = :'marcus';
select test.check('nobody can read another person''s row',
  (select count(*) from public.notification_preferences where member_id = :'marcus'), 0);

reset role;
select test.check('...nor change it (an update of somebody else''s row changes nothing)',
  (select count(*) from public.notification_preferences where member_id = :'marcus' and quiet_hours_start = 20), 1);
set role anon;
select test.check_raises('a signed-out visitor reads nothing', $$select count(*) from public.notification_preferences$$);

-- The service role (what records a STOP) keeps its hands on it.
reset role;
set role service_role;
update public.notification_preferences set sms_stopped_at = now() where member_id = :'tanya';
select test.check('the service role can record a stop',
  (select count(*) from public.notification_preferences where member_id = :'tanya' and sms_stopped_at is not null), 1);
update public.notification_preferences set sms_stopped_at = null where member_id = :'tanya';
select test.check('...and clear one, if a person ever asks Pam to',
  (select count(*) from public.notification_preferences where member_id = :'tanya' and sms_stopped_at is null), 1);
reset role;

-- Deleting an account still takes its preferences with it: a cascade, not a grant.
select test.check('the preferences go with the account (cascade from the profile)',
  (select count(*) from pg_constraint where conrelid = 'public.notification_preferences'::regclass
     and confrelid = 'public.profiles'::regclass and contype = 'f' and confdeltype = 'c'), 1);
