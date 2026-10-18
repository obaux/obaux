-- The Pam team's inbox, starting a conversation, reply times and hours (test 82; D-605, D-606; migration 20261018072644).
--
-- Claimed 2026-10-18 on `claude/messages-pam-s0-s1a` with `pnpm claim test`. The files run in name order on one database.
-- Root is a super admin (added by 05) and so is the Pam team; Marcus, Dana (his case manager) and Alice (a lead) are the seed's.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

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
\set dana   '33333333-0000-0000-0000-00000000000a'
\set root   '33333333-0000-0000-0000-000000000020'
\set ivy    'cccccccc-0000-0000-0000-000000008201'
\set lead_a 'cccccccc-0000-0000-0000-000000008202'
\set lead_b 'cccccccc-0000-0000-0000-000000008203'
\set lead_c 'cccccccc-0000-0000-0000-000000008204'
\set org_a  'dddddddd-0000-0000-0000-000000008201'
\set org_c  'dddddddd-0000-0000-0000-000000008202'
\set org_n  'dddddddd-0000-0000-0000-000000008203'
\set svc_a  'eeeeeeee-0000-0000-0000-000000008201'
\set svc_n  'eeeeeeee-0000-0000-0000-000000008202'
\set svc_g  'eeeeeeee-0000-0000-0000-000000008203'
\set region_north '11111111-0000-0000-0000-000000000001'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'ivy', '12675550821'), (:'lead_a', '12675550822'), (:'lead_b', '12675550823'), (:'lead_c', '12675550824');
insert into public.orgs (id, name, type, region_id) values
  (:'org_a', 'Pam Msg Org A', 'program', :'region_north'),
  (:'org_c', 'Pam Msg Org C', 'program', :'region_north'),
  (:'org_n', 'Pam Msg Org With Nobody', 'program', :'region_north');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, org_id) values
  (:'ivy', 'member', 'Ivy', :'region_north', '+12675550821', 'active', null),
  (:'lead_a', 'provider', 'Lia', :'region_north', '+12675550822', 'active', :'org_a'),
  (:'lead_b', 'provider', 'Lob', :'region_north', '+12675550823', 'limited', :'org_a'),
  (:'lead_c', 'provider', 'Lic', :'region_north', '+12675550824', 'active', :'org_c');
insert into public.services (id, org_id, name, category, address, source, source_ref, needs_review, is_active) values
  (:'svc_a', :'org_a', 'Pam Msg Program A', 'workforce', '1 Pam St', 'manual', null, false, true),
  (:'svc_n', :'org_n', 'Pam Msg No Lead', 'workforce', '2 Pam St', 'manual', null, false, true),
  (:'svc_g', null, 'Pam Msg Gathered', 'workforce', '3 Pam St', 'city_import', 'pam-msg-3', false, true);
update public.app_settings set value = 'on' where key = 'pam_messaging_live';

\echo ''
\echo '--- Only the Pam team calls any of these ---'
set role authenticated;
select test.as_user(:'marcus');
select test.check_raises_like('a member cannot read the inbox', $$ select * from public.pam_inbox() $$, '%ONLY_A_SUPER_ADMIN%');
select test.check_raises_like('...nor start a conversation',
  format($$ select public.pam_start_conversation(%L, 'hi') $$, :'ivy'), '%ONLY_A_SUPER_ADMIN%');
select test.check_raises_like('...nor start one with a program',
  format($$ select public.pam_start_program_conversation(%L, 'hi') $$, :'svc_a'), '%ONLY_A_SUPER_ADMIN%');
select test.check_raises_like('...nor close a thread',
  $$ select public.pam_set_thread_status(gen_random_uuid(), 'closed') $$, '%ONLY_A_SUPER_ADMIN%');
select test.check_raises_like('...nor change the hours',
  $$ select public.pam_set_hours('America/New_York', array[1], '09:00', '17:00') $$, '%ONLY_A_SUPER_ADMIN%');
select test.check_raises_like('...nor read the reply times', $$ select * from public.pam_reply_times(30) $$, '%ONLY_A_SUPER_ADMIN%');
select test.as_user(:'dana');
select test.check_raises_like('a case manager cannot read the inbox', $$ select * from public.pam_inbox() $$, '%ONLY_A_SUPER_ADMIN%');
select test.as_user(:'lead_a');
select test.check_raises_like('a program lead cannot start a conversation',
  format($$ select public.pam_start_conversation(%L, 'hi') $$, :'ivy'), '%ONLY_A_SUPER_ADMIN%');

\echo ''
\echo '--- The Pam team writes first ---'
select test.as_user(:'root');
create temp table t82 (k text primary key, v uuid);
insert into t82 select 'ivy', public.pam_start_conversation(:'ivy', 'Hi Ivy, how is the new job?');
select test.check('the team starts a conversation with a member, who never wrote to Pam',
  (select count(*) from t82 where k = 'ivy' and v is not null), 1);
select test.check('...Ivy''s conversation has Pam''s welcome and then the team''s message',
  (select count(*) from public.messages where conversation_id = (select v from t82 where k = 'ivy') and system_key = 'pam.welcome')
  + (select count(*) from public.messages where conversation_id = (select v from t82 where k = 'ivy') and sender_id = :'root' and body = 'Hi Ivy, how is the new job?'), 2);
select test.check('...and it is audited, about Ivy, with nothing of the text',
  (select count(*) from public.audit_log where action = 'pam.start' and actor_id = :'root' and target_id = :'ivy' and meta = '{}'::jsonb), 1);
insert into t82 select 'ivy2', public.pam_start_conversation(:'ivy', 'Just checking in');
select test.check('writing again uses the same conversation (one Pam conversation per person)',
  (select count(*) from t82 a join t82 b on a.v = b.v where a.k = 'ivy' and b.k = 'ivy2'), 1);
select test.check_raises_like('the team cannot write to itself',
  format($$ select public.pam_start_conversation(%L, 'hi') $$, :'root'), '%NOT_ALLOWED%');
select test.check_raises_like('an empty message is refused',
  format($$ select public.pam_start_conversation(%L, '   ') $$, :'ivy'), '%INVALID_MESSAGE%');
select test.check_raises_like('a person who is not there is refused',
  $$ select public.pam_start_conversation(gen_random_uuid(), 'hi') $$, '%NOT_FOUND%');

select test.as_user(:'ivy');
select test.check('Ivy reads the welcome and both messages in her conversation',
  (select count(*) from public.messages where conversation_id = (select v from t82 where k = 'ivy')), 3);

\echo ''
\echo '--- The inbox ---'
select test.as_user(:'root');
select test.check('the inbox has Ivy''s conversation, last written by the team, and nobody waiting',
  (select count(*) from public.pam_inbox() where asker_id = :'ivy' and last_from = 'team' and waiting_since is null
     and first_name = 'Ivy' and role = 'member' and region_name is not null and status = 'open'
     and preview = 'Just checking in'), 1);
select test.as_user(:'ivy');
insert into public.messages (conversation_id, sender_id, body) values ((select v from t82 where k = 'ivy'), :'ivy', 'Going well' || E'\n' || 'thanks');
select test.as_user(:'root');
select test.check('Ivy answers: she is waiting, and the preview is the first line',
  (select count(*) from public.pam_inbox() where asker_id = :'ivy' and last_from = 'asker' and waiting_since is not null and preview = 'Going well'), 1);
insert into public.messages (conversation_id, sender_id, body) values ((select v from t82 where k = 'ivy'), :'root', 'Great');
select test.check('the team answers: nobody is waiting',
  (select count(*) from public.pam_inbox() where asker_id = :'ivy' and last_from = 'team' and waiting_since is null), 1);
select test.check('a conversation with only the welcome (Rosa''s, from test 81) has no last message and nobody waiting',
  (select count(*) from public.pam_inbox() where asker_id = 'cccccccc-0000-0000-0000-000000008101'
     and last_from is null and last_message_at is null and waiting_since is null and preview is null), 1);
select public.pam_set_thread_status((select v from t82 where k = 'ivy'), 'closed');
select test.check_text('close: the inbox says closed',
  (select status from public.pam_inbox() where asker_id = :'ivy'), 'closed');
select public.pam_set_thread_status((select v from t82 where k = 'ivy'), 'open');
select test.check_raises_like('an unknown status is refused',
  format($$ select public.pam_set_thread_status(%L, 'gone') $$, (select v from t82 where k = 'ivy')), '%INVALID_STATUS%');
select test.check_raises_like('a conversation that is not a Pam conversation is not found',
  $$ select public.pam_set_thread_status(gen_random_uuid(), 'closed') $$, '%NOT_FOUND%');
select public.pam_set_thread_status((select v from t82 where k = 'ivy'), 'closed');
select public.pam_start_conversation(:'ivy', 'One more thing');
select test.check_text('writing first to a closed conversation reopens it',
  (select status from public.pam_inbox() where asker_id = :'ivy'), 'open');

\echo ''
\echo '--- A program: each active lead, once ---'
select test.check('the same text goes to the program''s one active lead (the limited lead and another program''s lead are left out)',
  public.pam_start_program_conversation(:'svc_a', 'Hello from Pam')::bigint, 1);
select test.check('...in the lead''s own Pam conversation',
  (select count(*) from public.pam_inbox() where asker_id = :'lead_a' and preview = 'Hello from Pam'), 1);
select test.check('...and nobody else''s',
  (select count(*) from public.pam_inbox() where asker_id in (:'lead_b', :'lead_c')), 0);
select test.check_raises_like('a program with no lead on Pam raises PAM_NO_ACTIVE_LEAD',
  format($$ select public.pam_start_program_conversation(%L, 'hi') $$, :'svc_n'), '%PAM_NO_ACTIVE_LEAD%');
select test.check_raises_like('...and so does a place Pam gathered from the internet (no organisation)',
  format($$ select public.pam_start_program_conversation(%L, 'hi') $$, :'svc_g'), '%PAM_NO_ACTIVE_LEAD%');
select test.check_raises_like('a service that does not exist is not found',
  $$ select public.pam_start_program_conversation(gen_random_uuid(), 'hi') $$, '%NOT_FOUND%');

\echo ''
\echo '--- The hours ---'
select test.check_raises_like('a time zone that is not one is refused',
  $$ select public.pam_set_hours('Mars/Olympus', array[1], '09:00', '17:00') $$, '%INVALID_TIME_ZONE%');
select test.check_raises_like('no days is refused',
  $$ select public.pam_set_hours('America/New_York', array[]::int[], '09:00', '17:00') $$, '%INVALID_DAYS%');
select test.check_raises_like('day 8 is refused',
  $$ select public.pam_set_hours('America/New_York', array[1, 8], '09:00', '17:00') $$, '%INVALID_DAYS%');
select test.check_raises_like('opening after closing is refused',
  $$ select public.pam_set_hours('America/New_York', array[1], '17:00', '09:00') $$, '%INVALID_HOURS%');
select public.pam_set_hours('America/Chicago', array[5, 1, 3, 3], '10:30', '12:00');
select test.check_text('good hours are saved, sorted and without repeats',
  (select value from public.app_settings where key = 'pam_hours'),
  '{"tz": "America/Chicago", "days": [1, 3, 5], "open": "10:30", "close": "12:00"}');
select test.check_text('...and pam_status reads them back',
  (select hours_tz || ' ' || hours_days::text || ' ' || hours_open::text || ' ' || hours_close::text from public.pam_status()),
  'America/Chicago {1,3,5} 10:30:00 12:00:00');
select public.pam_set_hours('America/New_York', array[1, 2, 3, 4, 5], '09:00', '17:00');

\echo ''
\echo '--- How long people wait ---'
reset role;
begin;
delete from public.messages where conversation_id in (select conversation_id from public.pam_threads);
-- Ivy's conversation, with known times: a stretch 40 days ago (outside 30 days), two answered (1 h and 30 min), one not yet answered.
insert into public.messages (conversation_id, sender_id, body, created_at)
select (select v from t82 where k = 'ivy'), x.who, 'm', now() - x.ago
from (values
  (:'ivy'::uuid, interval '40 days'),
  (:'root'::uuid, interval '40 days' - interval '10 minutes'),
  (:'ivy'::uuid, interval '3 hours'),
  (:'root'::uuid, interval '2 hours'),
  (:'ivy'::uuid, interval '1 hour'),
  (:'root'::uuid, interval '30 minutes'),
  (:'ivy'::uuid, interval '10 minutes')
) as x(who, ago);
set role authenticated;
select test.as_user(:'root');
select test.check_text('the median and the mean are 45 minutes, over the two answered stretches in 30 days',
  (select median_seconds::int::text || ' ' || mean_seconds::int::text || ' ' || answered::text from public.pam_reply_times(30)),
  '2700 2700 2');
select test.check_text('wider, the old one counts too: three answered',
  (select answered::text from public.pam_reply_times(60)), '3');
rollback;
reset role;
update public.app_settings set value = 'off' where key = 'pam_messaging_live';
