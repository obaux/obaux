-- A number that texted STOP is remembered as a keyed hash and day, and the stop follows the number onto an account (Iris's finding 9, 19 October).

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set marcus '33333333-0000-0000-0000-00000000000c'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set newbie 'dddddddd-0000-4000-8000-0000000086a1'

create or replace function test.check_bool(label text, actual boolean, expected boolean)
returns void
language plpgsql
as $$
begin
  if actual is not distinct from expected then
    raise notice 'ok    %', label;
  else
    raise exception E'FAIL  %\n        got %, expected %', label, actual, expected;
  end if;
end;
$$;
grant execute on function test.check_bool(text, boolean, boolean) to authenticated, anon, service_role;

reset role;
delete from public.phone_stops;
delete from public.notification_preferences where member_id in (:'marcus', :'tanya');
update public.profiles set phone = '+12679990411' where id = :'marcus';
update public.profiles set phone = '+12679990412' where id = :'tanya';

\echo ''
\echo '--- What is kept: a keyed hash and a day, nothing else ---'
select public.record_sms_stop('+12675550177');
select test.check('a STOP from a number with no account is remembered, as one row', (select count(*) from public.phone_stops), 1::bigint);
select test.check('...with only a hash and a day: two columns',
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'phone_stops'), 2::bigint);
select test.check_bool('...whose day is a date, not a moment',
  (select data_type from information_schema.columns where table_schema = 'public' and table_name = 'phone_stops' and column_name = 'stopped_at') = 'date', true);
select test.check('...the hash is keyed (k1:), not the old plain digest, and has nothing of the number in it',
  (select count(*) from public.phone_stops
   where phone_hash like 'k1:%' and phone_hash <> public.phone_hash_legacy('+12675550177') and phone_hash not like '%2675550177%'), 1::bigint);
select test.check_bool('the same number in another format has the same hash',
  public.phone_hash('+1 (267) 555-0177') = public.phone_hash('+12675550177'), true);
select test.check_bool('...another number has another', public.phone_hash('+12675550178') = public.phone_hash('+12675550177'), false);
select test.check_bool('...and what is not a number has none', public.phone_hash('not a number') is null, true);
update vault.decrypted_secrets set decrypted_secret = 'another-key' where name = 'phone_stop_key';
select test.check('with another key the same number does not match the stored hash',
  (select count(*) from public.phone_stops where phone_hash = public.phone_hash('+12675550177')), 0::bigint);
update vault.decrypted_secrets set decrypted_secret = 'test-key-for-the-throwaway-database-only' where name = 'phone_stop_key';
select test.check('...and with its own key it does',
  (select count(*) from public.phone_stops where phone_hash = public.phone_hash('+12675550177')), 1::bigint);

\echo ''
\echo '--- The stop follows the number onto an account ---'
update public.profiles set phone = '+12675550177' where id = :'marcus';
select test.check('an account that takes the stopped number (an update of its number) gets the stop, with no yes',
  (select count(*) from public.notification_preferences where member_id = :'marcus' and sms_stopped_at is not null and sms_enabled = false), 1::bigint);
select test.check('...the audit log says a stop was carried, without a number',
  (select count(*) from public.audit_log where action = 'sms.stop' and target_id = :'marcus' and meta = '{"carried": true}'::jsonb), 1::bigint);
select test.check('an account with another number is not affected',
  (select count(*) from public.notification_preferences where member_id = :'tanya'), 0::bigint);
select test.check_bool('the number still counts as stopped', public.phone_is_stopped('+12675550177'), true);

select public.record_sms_stop('+12675550188');
insert into auth.users (id, phone) values (:'newbie', '12675550188');
insert into public.profiles (id, role, phone) values (:'newbie', 'member', '+12675550188');
select test.check('a new account made with another stopped number gets the stop at once',
  (select count(*) from public.notification_preferences where member_id = :'newbie' and sms_stopped_at is not null), 1::bigint);
select public.record_sms_start('+12675550188');

\echo ''
\echo '--- START clears it, both forms ---'
select public.record_sms_start('+12675550177');
select test.check('a START from the number empties the list', (select count(*) from public.phone_stops), 0::bigint);
select test.check('...and clears the stop on the account that carried it',
  (select count(*) from public.notification_preferences where member_id = :'marcus' and sms_stopped_at is not null), 0::bigint);

insert into public.phone_stops (phone_hash) values (public.phone_hash_legacy('+12675550199'));
select test.check_bool('an old plain-hash row still counts as stopped', public.phone_is_stopped('+12675550199'), true);
update public.profiles set phone = '+12675550199' where id = :'tanya';
select test.check('...and follows its number onto an account too',
  (select count(*) from public.notification_preferences where member_id = :'tanya' and sms_stopped_at is not null), 1::bigint);
select public.record_sms_start('+12675550199');
select test.check('...and a START removes it', (select count(*) from public.phone_stops), 0::bigint);
select test.check_bool('...so the number no longer counts as stopped', public.phone_is_stopped('+12675550199'), false);

\echo ''
\echo '--- Nobody but the database reads any of it ---'
set role authenticated;
select test.as_user(:'marcus');
select test.check_raises('a signed-in person cannot read the list', $$select count(*) from public.phone_stops$$);
select test.check_raises('...nor ask for a hash', $$select public.phone_hash('+12675550177')$$);
select test.check_raises('...nor the key', $$select public.phone_stop_key()$$);
reset role;
select test.check_bool('the key is not callable by the service role either: only the hash functions read it',
  has_function_privilege('service_role', 'public.phone_stop_key()', 'execute'), false);

delete from public.profiles where id = :'newbie';
delete from auth.users where id = :'newbie';
delete from public.phone_stops;
