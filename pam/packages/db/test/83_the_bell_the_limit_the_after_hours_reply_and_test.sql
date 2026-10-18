-- The bell, the limit, the out-of-hours reply, reporting and erasure of a Pam conversation (test 83; D-605, D-606;
-- migrations 20261018073011, 20261018073013, 20261018073016).
--
-- Claimed 2026-10-18 on `claude/messages-pam-s0-s1a` with `pnpm claim test`. The files run in name order on one database.
-- Kai writes to Pam; Lu is the one whose account is erased and who hits the limits; Alice (seed, a program lead) is Kai's other
-- conversation; Root (seed, super admin) is Pam. The clock is real, so the hours are set in the test to be open all week or to
-- be closed today and open tomorrow only.

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

\set alice '33333333-0000-0000-0000-00000000000f'
\set dana  '33333333-0000-0000-0000-00000000000a'
\set root  '33333333-0000-0000-0000-000000000020'
\set kai   'cccccccc-0000-0000-0000-000000008301'
\set lu    'cccccccc-0000-0000-0000-000000008302'
\set region_north '11111111-0000-0000-0000-000000000001'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'kai', '12675550831'), (:'lu', '12675550832');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'kai', 'member', 'Kai', :'region_north', '+12675550831', 'active'),
  (:'lu',  'member', 'Lu',  :'region_north', '+12675550832', 'active');
update public.app_settings set value = 'on' where key = 'pam_messaging_live';
-- Pam is here all week (no out-of-hours reply) until a section says otherwise.
update public.app_settings set value = '{"tz":"America/New_York","days":[1,2,3,4,5,6,7],"open":"00:00","close":"23:59"}' where key = 'pam_hours';
create temp table t83 (k text primary key, v uuid);
grant all on t83 to authenticated;
create temp table t83_hours (open_all text, closed_today text);
insert into t83_hours values (
  '{"tz":"America/New_York","days":[1,2,3,4,5,6,7],"open":"00:00","close":"23:59"}',
  format('{"tz":"America/New_York","days":[%s],"open":"09:00","close":"17:00"}',
         (extract(isodow from (now() at time zone 'America/New_York'))::int % 7) + 1));

set role authenticated;
select test.as_user(:'kai');
insert into t83 select 'kai', public.open_pam_conversation();
select test.as_user(:'lu');
insert into t83 select 'lu', public.open_pam_conversation();
reset role;

\echo ''
\echo '--- The bell: the right people, once, and never a name ---'
select test.check('Pam''s welcome tells nobody',
  (select count(*) from public.notifications where subject_id in (select v from t83)), 0);
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'kai', 'Hello Pam');
select test.check('Kai writes: the Pam team is told, with Kai''s first name',
  (select count(*) from public.notifications where subject_id = (select v from t83 where k = 'kai')
     and recipient_id = :'root' and kind = 'message_received' and body_vars ->> 'name' = 'Kai'), 1);
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'kai', 'Anyone there?');
select test.check('...a second message while that is unread adds no second row',
  (select count(*) from public.notifications where subject_id = (select v from t83 where k = 'kai') and recipient_id = :'root'), 1);
select test.check('...nobody else is told: not Kai, not his case manager, not a program lead',
  (select count(*) from public.notifications where subject_id = (select v from t83 where k = 'kai') and recipient_id in (:'kai', :'dana', :'alice')), 0);
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'root', 'Hi Kai, I am here');
select test.check('Pam replies: Kai is told it was "Pam"',
  (select count(*) from public.notifications where subject_id = (select v from t83 where k = 'kai')
     and recipient_id = :'kai' and body_vars ->> 'name' = 'Pam'), 1);
select test.check('control: the team member who wrote has a first name to leak',
  (select count(*) from public.profiles where id = :'root' and nullif(first_name, '') is not null), 1);
select test.check('...and nothing in the row says who on the team wrote it',
  (select count(*) from public.notifications where subject_id = (select v from t83 where k = 'kai') and recipient_id = :'kai'
     and body_vars::text ilike '%' || (select first_name from public.profiles where id = :'root') || '%'), 0);
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'root', 'One more thing');
select test.check('...a second reply while that is unread adds no second row',
  (select count(*) from public.notifications where subject_id = (select v from t83 where k = 'kai') and recipient_id = :'kai'), 1);

\echo ''
\echo '--- Texts: a Pam conversation is like any other (behind texts_live, which is off) ---'
insert into public.notification_preferences (member_id) values (:'kai') on conflict (member_id) do nothing;
update public.notification_preferences set sms_enabled = true, alert_message = true, sms_stopped_at = null where member_id = :'kai';
delete from public.outbound_messages where member_id = :'kai';
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'root', 'And a text?');
select test.check('Pam writes to Kai, who asked for message texts: the "message waiting" text is queued, as from anyone',
  (select count(*) from public.outbound_messages where member_id = :'kai' and template_key = 'message_waiting'), 1);
delete from public.outbound_messages where member_id = :'kai';
-- The team member has asked for message texts too, so "no text for anyone" below counts something that could have been queued.
insert into public.notification_preferences (member_id, sms_enabled, alert_message) values (:'root', true, true) on conflict (member_id) do update set sms_enabled = true, alert_message = true, sms_stopped_at = null;
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'kai', 'My own message queues nothing for me');
select test.check('Kai writing to Pam queues nothing for anyone (Pam has no phone)',
  (select count(*) from public.outbound_messages where template_key = 'message_waiting' and member_id in (:'kai', :'root')), 0);
delete from public.outbound_messages where member_id = :'kai';
insert into public.messages (conversation_id, sender_id, body, system_key) values ((select v from t83 where k = 'kai'), null, '', 'pam.welcome');
select test.check('a system message (no sender) queues nothing',
  (select count(*) from public.outbound_messages where member_id = :'kai'), 0);

-- A person who did not ask for message texts gets none from Pam either.
insert into public.notification_preferences (member_id, sms_enabled, alert_message) values (:'lu', true, false) on conflict (member_id) do update set sms_enabled = true, alert_message = false;
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'lu'), :'root', 'Hello Lu');
select test.check('Pam writes to Lu, who did not ask for message texts: none is queued',
  (select count(*) from public.outbound_messages where member_id = :'lu'), 0);

\echo ''
\echo '--- Reporting a Pam message is refused ---'
set role authenticated;
select test.as_user(:'kai');
select test.check_raises_like('Kai cannot report what Pam wrote',
  format($$ select public.report_message(%L) $$, (select id from public.messages where conversation_id = (select v from t83 where k = 'kai') and sender_id = :'root' limit 1)),
  '%cannot be reported%');
reset role;
select test.check('control: there are messages in Kai''s Pam conversation to report (his, Pam''s and the system''s)',
  (select (count(*) >= 3)::int from public.messages where conversation_id = (select v from t83 where k = 'kai')), 1);
select test.check('...and no report was made',
  (select count(*) from public.reports where target_type = 'message'
     and target_id in (select id from public.messages where conversation_id = (select v from t83 where k = 'kai'))), 0);

\echo ''
\echo '--- The out-of-hours reply: once per stretch of closed hours ---'
update public.app_settings set value = (select closed_today from t83_hours) where key = 'pam_hours';
update public.pam_threads set status = 'closed', last_auto_reply_at = null where conversation_id = (select v from t83 where k = 'kai');
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'kai', 'Is anyone there tonight?');
select test.check('a message when Pam is not here gets one automatic reply, from nobody',
  (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'kai') and sender_id is null and system_key = 'pam.away'), 1);
select test.check('...and the reply queues no text for Kai, who asked for them (it has no sender)',
  (select count(*) from public.outbound_messages where member_id = :'kai' and template_key = 'message_waiting'), 0);
select test.check('...carrying when Pam is next here',
  (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'kai') and system_key = 'pam.away'
     and (system_vars ->> 'opensAt')::timestamptz = public.pam_next_open(now())), 1);
select test.check('...and the conversation is open again (a closed one reopens when the person writes)',
  (select count(*) from public.pam_threads where conversation_id = (select v from t83 where k = 'kai') and status = 'open'), 1);
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'kai', 'Hello again');
select test.check('a second message in the same stretch gets no second reply',
  (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'kai') and system_key = 'pam.away'), 1);
update public.pam_threads set last_auto_reply_at = now() - interval '20 days' where conversation_id = (select v from t83 where k = 'kai');
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'kai', 'A later stretch');
select test.check('a message in a later stretch (the last reply is older than Pam''s last closing) gets another',
  (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'kai') and system_key = 'pam.away'), 2);
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'root', 'Morning');
select test.check('Pam writing while closed does not trigger a reply',
  (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'kai') and system_key = 'pam.away'), 2);
update public.app_settings set value = (select open_all from t83_hours) where key = 'pam_hours';
update public.pam_threads set last_auto_reply_at = null where conversation_id = (select v from t83 where k = 'kai');
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'kai'), :'kai', 'Now while Pam is here');
select test.check('a message while Pam is here gets no reply',
  (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'kai') and system_key = 'pam.away'), 2);

\echo ''
\echo '--- The audit of the team''s words, and nothing of them ---'
select test.check('every team message is audited as pam.reply, about the person',
  (select count(*) from public.audit_log where action = 'pam.reply' and target_id = :'kai' and actor_id = :'root' and meta = '{}'::jsonb), 4);

\echo ''
\echo '--- The limit: the person only, the same for everyone ---'
insert into public.messages (conversation_id, sender_id, body)
select (select v from t83 where k = 'lu'), :'lu', 'm' || g from generate_series(1, 30) g;
select test.check_raises_like('the 31st message in an hour is refused with PAM_RATE_LIMITED',
  format($$ insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'one too many') $$, (select v from t83 where k = 'lu'), :'lu'),
  '%PAM_RATE_LIMITED%');
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'lu'), :'root', 'Take your time');
select test.check('...Pam''s reply went in',
  (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'lu') and body = 'Take your time'), 1);
update public.profiles set access_status = 'limited' where id = :'lu';
select test.check_raises_like('a limited account has the same limit, no lower and no higher',
  format($$ insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'still too many') $$, (select v from t83 where k = 'lu'), :'lu'),
  '%PAM_RATE_LIMITED%');
update public.profiles set access_status = 'active' where id = :'lu';
-- Photos have their own, smaller limit: 10 an hour (older messages are moved out of the hour first).
update public.messages set created_at = now() - interval '2 hours' where conversation_id = (select v from t83 where k = 'lu');
insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind)
select (select v from t83 where k = 'lu'), :'lu', null, (select v from t83 where k = 'lu') || '/p' || g || '.jpg', 'photo' from generate_series(1, 10) g;
select test.check_raises_like('the 11th photo in an hour is refused',
  format($$ insert into public.messages (conversation_id, sender_id, body, attachment_url, attachment_kind) values (%L, %L, null, %L, 'photo') $$,
    (select v from t83 where k = 'lu'), :'lu', (select v from t83 where k = 'lu') || '/p11.jpg'),
  '%PAM_RATE_LIMITED%');
insert into public.messages (conversation_id, sender_id, body) values ((select v from t83 where k = 'lu'), :'lu', 'just words');
select test.check('...but a plain message is still allowed (the photo limit is the photo''s)',
  (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'lu') and body = 'just words'), 1);

\echo ''
\echo '--- Erasure: the whole conversation goes with the person ---'
select test.check('before: Lu''s Pam conversation, thread and messages exist',
  (select count(*) from public.pam_threads where asker_id = :'lu')
  + (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'lu')) / 100, 1);
delete from auth.users where id = :'lu';
select test.check('after: the person, the thread, the conversation and every message in it (the person''s and Pam''s) are gone',
  (select count(*) from public.profiles where id = :'lu')
  + (select count(*) from public.pam_threads where asker_id = :'lu')
  + (select count(*) from public.conversations where id = (select v from t83 where k = 'lu'))
  + (select count(*) from public.messages where conversation_id = (select v from t83 where k = 'lu')), 0);
select test.check('...Kai''s conversation is untouched',
  (select count(*) from public.pam_threads where asker_id = :'kai'), 1);
select test.check('...and the team''s audit rows about Lu stay (they go after six months with the rest, D-443)',
  (select count(*) from public.audit_log where action = 'account.delete' and target_id = :'lu'), 1);

update public.app_settings set value = 'off' where key = 'pam_messaging_live';
update public.app_settings set value = '{"tz":"America/New_York","days":[1,2,3,4,5],"open":"09:00","close":"17:00"}' where key = 'pam_hours';
