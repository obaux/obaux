-- Open a Pam conversation, and what "Pam is here" means (test 81; D-605, D-606; migration 20261018072339).
--
-- Claimed 2026-10-18 on `claude/messages-pam-s0-s1a` with `pnpm claim test`. The files run in name order on one database.
-- Marcus (member, seed) opens his; Alice (program lead, seed) opens hers; Root (super admin) is Pam and gets none.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

create or replace function test.check_text(label text, actual text, expected text)
returns void
language plpgsql
as $$
begin
  if actual is not distinct from expected then
    raise notice 'ok    %', label;
  else
    raise exception E'FAIL  %\n        got "%", expected "%"', label, actual, expected;
  end if;
end;
$$;
grant execute on function test.check_text(text, text, text) to authenticated, anon, service_role;

\set marcus '33333333-0000-0000-0000-00000000000c'
\set rosa   'cccccccc-0000-0000-0000-000000008101'
\set region_north '11111111-0000-0000-0000-000000000001'
\set alice  '33333333-0000-0000-0000-00000000000f'
\set root   '33333333-0000-0000-0000-000000000020'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'rosa', '12675550811');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'rosa', 'member', 'Rosa', :'region_north', '+12675550811', 'active');

\echo ''
\echo '--- When Pam is here: Monday to Friday, 9 to 5, Eastern (the default), through daylight saving ---'
-- 2026-10-20 is a Tuesday; EDT (UTC-4) until Sunday 1 November, EST (UTC-5) after.
select test.check_text('Tuesday 2pm Eastern: open',
  public.pam_is_open('2026-10-20 18:00:00+00')::text, 'true');
select test.check_text('Tuesday 8:59am: closed',
  public.pam_is_open('2026-10-20 12:59:00+00')::text, 'false');
select test.check_text('Tuesday 9:00am sharp: open',
  public.pam_is_open('2026-10-20 13:00:00+00')::text, 'true');
select test.check_text('Friday 5:00pm sharp: closed (the closing minute is not open)',
  public.pam_is_open('2026-10-23 21:00:00+00')::text, 'false');
select test.check_text('Saturday noon: closed',
  public.pam_is_open('2026-10-24 16:00:00+00')::text, 'false');
select test.check_text('from Friday 6pm Eastern the next opening is Monday 9am Eastern (13:00 UTC, still daylight time)',
  public.pam_next_open('2026-10-23 22:00:00+00')::text, '2026-10-26 13:00:00+00');
select test.check_text('from Monday 8am the next opening is that day''s 9am',
  public.pam_next_open('2026-10-26 12:00:00+00')::text, '2026-10-26 13:00:00+00');
select test.check_text('the latest closing before Monday 8am is the Friday 5pm',
  public.pam_last_close('2026-10-26 12:00:00+00')::text, '2026-10-23 21:00:00+00');
select test.check_text('the clocks go back on Sunday 1 November: from Friday 30 October 6pm, Monday 2 November 9am is 14:00 UTC',
  public.pam_next_open('2026-10-30 22:00:00+00')::text, '2026-11-02 14:00:00+00');
select test.check_text('...and Friday 30 October''s closing was 21:00 UTC, Monday 2 November''s is 22:00 UTC',
  public.pam_last_close('2026-10-30 22:00:00+00')::text || ' ' || public.pam_last_close('2026-11-02 23:00:00+00')::text,
  '2026-10-30 21:00:00+00 2026-11-02 22:00:00+00');
select test.check_text('the clocks go forward on Sunday 8 March 2026: Monday 9 March 9am is 13:00 UTC',
  public.pam_next_open('2026-03-06 23:00:00+00')::text, '2026-03-09 13:00:00+00');
update public.app_settings set value = '{"tz":"America/Chicago","days":[1,3,5],"open":"10:30","close":"12:00"}' where key = 'pam_hours';
select test.check_text('a changed setting is read: Chicago, Monday Wednesday Friday, 10:30 to noon',
  public.pam_is_open('2026-10-26 16:00:00+00')::text || ' ' || public.pam_is_open('2026-10-27 16:00:00+00')::text,
  'true false');
update public.app_settings set value = '{"tz":"America/New_York","days":[1,2,3,4,5],"open":"09:00","close":"17:00"}' where key = 'pam_hours';

\echo ''
\echo '--- Open a Pam conversation: nothing while the switch is off ---'
-- The clock is real, so Pam is open all week here: an out-of-hours reply would add a message the counts below do not expect (test 83 tests it).
update public.app_settings set value = '{"tz":"America/New_York","days":[1,2,3,4,5,6,7],"open":"00:00","close":"23:59"}' where key = 'pam_hours';
set role authenticated;
select test.as_user(:'rosa');
select test.check_text('switch off: no conversation and no id',
  coalesce(public.open_pam_conversation()::text, 'none'), 'none');
select test.check('...and nothing is made',
  (select count(*) from public.pam_threads), 0);
select test.check_text('pam_status says it is off',
  (select live::text from public.pam_status()), 'false');
select set_config('request.jwt.claim.sub', '', false);
select test.check('a signed-out visitor is told nothing by pam_status',
  (select count(*) from public.pam_status()), 0);
reset role;
update public.app_settings set value = 'on' where key = 'pam_messaging_live';

\echo ''
\echo '--- ...and with it on ---'
set role authenticated;
select test.as_user(:'rosa');
create temp table t81 (k text primary key, v uuid);
insert into t81 select 'first', public.open_pam_conversation();
insert into t81 select 'second', public.open_pam_conversation();
select test.check('a member gets a conversation',
  (select count(*) from t81 where k = 'first' and v is not null), 1);
select test.check('...the same one the second time (one Pam conversation per person)',
  (select count(*) from t81 a join t81 b on a.v = b.v and a.k = 'first' and b.k = 'second'), 1);
select test.check('...with the member as its only member',
  (select count(*) from public.conversation_members where conversation_id = (select v from t81 where k = 'first')), 1);
select test.check('...and Pam''s welcome in it, written by nobody',
  (select count(*) from public.messages where conversation_id = (select v from t81 where k = 'first')
     and sender_id is null and system_key = 'pam.welcome' and body = ''), 1);
select test.check('...and only the welcome',
  (select count(*) from public.messages where conversation_id = (select v from t81 where k = 'first')), 1);
select test.check_text('pam_status says it is on, with the hours',
  (select live::text || ' ' || hours_tz || ' ' || hours_open::text || ' ' || hours_close::text from public.pam_status()),
  'true America/New_York 00:00:00 23:59:00');
select test.check('conversation_partners gives the Pam side as one row with no profile, name or role',
  (select count(*) from public.conversation_partners()
     where conversation_id = (select v from t81 where k = 'first') and profile_id is null and first_name is null and role is null), 1);
select test.as_user(:'marcus');
select test.check('...and still lists a real partner as before (Marcus and Alice''s conversation)',
  (select count(*) from public.conversation_partners() where profile_id = :'alice'), 1);

select test.as_user(:'alice');
insert into t81 select 'alice', public.open_pam_conversation();
select test.check('a program lead gets their own, not Rosa''s',
  (select count(*) from t81 where k = 'alice' and v is not null and v <> (select v from t81 where k = 'first')), 1);
select test.check('...and cannot read Rosa''s welcome',
  (select count(*) from public.messages where conversation_id = (select v from t81 where k = 'first')), 0);

select test.as_user(:'root');
select test.check_text('the Pam team gets no conversation of their own',
  coalesce(public.open_pam_conversation()::text, 'none'), 'none');
select test.check('...and reads both people''s Pam conversations',
  (select count(*) from public.pam_threads where asker_id in (:'rosa', :'alice')), 2);
reset role;
update public.app_settings set value = 'off' where key = 'pam_messaging_live';
update public.app_settings set value = '{"tz":"America/New_York","days":[1,2,3,4,5],"open":"09:00","close":"17:00"}' where key = 'pam_hours';
