-- app errors are logged without who (test 85).
--
-- Claimed 2026-10-18 on `claude/messages-app-errors` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

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

-- Marcus (seed member) fails things, Root (seed super admin) is told, and the world outside is anon.
\set marcus '33333333-0000-0000-0000-00000000000c'
\set root   '33333333-0000-0000-0000-000000000020'

reset role;
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', '', false);
delete from public.app_errors;
delete from public.app_error_limits;
delete from public.notifications where kind = 'app_error';
update public.app_settings set value = 'off' where key = 'app_errors_live';

\echo ''
\echo '--- The switch is off: nothing is written ---'
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select test.check('off: a signed-out report is not taken',
  (select case when public.report_app_error('/signin/', 'signin.code', '500') then 1 else 0 end), 0);
set role authenticated;
select test.as_user(:'marcus');
select test.check('...nor a signed-in one',
  (select case when public.report_app_error('/alerts/', 'alerts.switch.closed', 'offline') then 1 else 0 end), 0);
reset role;
select test.check('...and the log is empty, with no counter and no bell row',
  (select count(*) from public.app_errors) + (select count(*) from public.app_error_limits)
  + (select count(*) from public.notifications where kind = 'app_error'), 0);

update public.app_settings set value = 'on' where key = 'app_errors_live';

\echo ''
\echo '--- On: signed out and signed in both report, and the log says what and where, not who ---'
select set_config('request.headers', '{"x-forwarded-for":"203.0.113.9"}', false);
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select test.check('on: a signed-out report is taken',
  (select case when public.report_app_error('/signin/', 'signin.code', '500', 'the code could not be sent', 'b75', 'web', 'es') then 1 else 0 end), 1);
set role authenticated;
select test.as_user(:'marcus');
select test.check('...and a signed-in one',
  (select case when public.report_app_error('/alerts/', 'alerts.switch.closed', 'offline', null, 'b75', 'ios', 'en') then 1 else 0 end), 1);
reset role;
select test.check('the rows say the role from the sign-in (signed-out, member), the language and the build',
  (select count(*) from public.app_errors where (action = 'signin.code' and role = 'signed-out' and locale = 'es' and build = 'b75' and platform = 'web')
     or (action = 'alerts.switch.closed' and role = 'member' and locale = 'en' and platform = 'ios' and code = 'offline')), 2);
select test.check('the table has no column that could say who: nothing but the 10 named ones',
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'app_errors'), 10);
select test.check('...and none of them is an account, a phone, a message or a place',
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'app_errors'
     and (column_name ~ '(profile|user|member|account|phone|body|message|place|service|ip|address)')), 0);

\echo ''
\echo '--- Nobody reads it or writes it but the function ---'
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select test.check_raises_like('anon cannot read the log', $$ select count(*) from public.app_errors $$, '%permission denied%');
select test.check_raises_like('...nor its counters', $$ select count(*) from public.app_error_limits $$, '%permission denied%');
select test.check_raises_like('...nor write a row', $$ insert into public.app_errors (area, action, code, role) values ('/', 'x', '1', 'member') $$, '%permission denied%');
set role authenticated;
select test.as_user(:'marcus');
select test.check_raises_like('a signed-in person cannot read the log either', $$ select count(*) from public.app_errors $$, '%permission denied%');
select test.check_raises_like('...nor write a row', $$ insert into public.app_errors (area, action, code, role) values ('/', 'x', '1', 'member') $$, '%permission denied%');
reset role;

\echo ''
\echo '--- What comes in is cleaned ---'
set role authenticated;
select test.as_user(:'root');
select test.check('a report with a messy route, key, code and detail is taken, never an error',
  (select case when public.report_app_error('/messages/thread/?id=3f2a#top', 'Messages Send!', ' 5 0 0 ',
     'mail me at will@example.com or 2155550100 ' || repeat('x', 300), 'b 75', 'toaster', 'xx') then 1 else 0 end), 1);
reset role;
select test.check('the route lost its query, the key its odd letters, the code its spaces',
  (select count(*) from public.app_errors where area = '/messages/thread/' and action = 'messagessend' and code = '500'), 1);
select test.check('the detail lost the email address and the long number, and is cut at 200',
  (select count(*) from public.app_errors where action = 'messagessend' and detail not like '%@%' and detail not like '%2155550100%'
     and detail like 'mail me at [email]%' and char_length(detail) = 200), 1);
select test.check('an unknown build, platform and language become empty, "unknown" and empty',
  (select count(*) from public.app_errors where action = 'messagessend' and build is null and platform = 'unknown' and locale is null), 1);

\echo ''
\echo '--- The rate limit holds ---'
delete from public.app_error_limits;
set role authenticated;
select test.as_user(:'marcus');
create temp table t85 (n int, ok boolean);
insert into t85 select g, public.report_app_error('/alerts/', 'loop.' || (g % 3), '500') from generate_series(1, 14) g;
reset role;
select test.check('one caller gets ten reports a minute: the first ten are taken',
  (select count(*) from t85 where ok), 10);
select test.check('...and the other four are not',
  (select count(*) from t85 where not ok), 4);
select test.check('...and the log holds only the ten',
  (select count(*) from public.app_errors where action like 'loop.%'), 10);
select set_config('request.headers', '{"x-forwarded-for":"203.0.113.77"}', false);
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select test.check('another caller (another network address) is not held up by the first',
  (select case when public.report_app_error('/signin/', 'signin.code', '500') then 1 else 0 end), 1);
reset role;

\echo ''
\echo '--- The team is told once an hour per action, with a count ---'
delete from public.notifications where kind = 'app_error';
delete from public.app_error_limits;
select public.report_app_error('/alerts/', 'tell.one', '500');
select test.check('the first failure of an action: every super admin gets one bell row, count 1',
  (select count(*) from public.notifications where kind = 'app_error' and recipient_id = :'root'
     and body_vars ->> 'action' = 'tell.one' and (body_vars ->> 'count')::int = 1 and body_key = 'notify.app_error'), 1);
select test.check('...and nobody who is not a super admin does',
  (select count(*) from public.notifications where kind = 'app_error' and recipient_id = :'marcus'), 0);
select public.report_app_error('/alerts/', 'tell.one', '500');
select public.report_app_error('/alerts/', 'tell.one', '500');
select test.check('two more in the hour: still one row, its count 3',
  (select count(*) from public.notifications where kind = 'app_error' and recipient_id = :'root'
     and body_vars ->> 'action' = 'tell.one' and (body_vars ->> 'count')::int = 3), 1);
select public.report_app_error('/alerts/', 'tell.two', '500');
select test.check('another action gets its own row',
  (select count(*) from public.notifications where kind = 'app_error' and recipient_id = :'root' and body_vars ->> 'action' = 'tell.two'), 1);
update public.notifications set created_at = now() - interval '2 hours' where kind = 'app_error' and body_vars ->> 'action' = 'tell.one';
select public.report_app_error('/alerts/', 'tell.one', '500');
select test.check('an hour later the same action is news again: a new row, count 1',
  (select count(*) from public.notifications where kind = 'app_error' and recipient_id = :'root'
     and body_vars ->> 'action' = 'tell.one' and (body_vars ->> 'count')::int = 1 and created_at > now() - interval '1 hour'), 1);

\echo ''
\echo '--- An Edge Function reports too, as the service ---'
select set_config('request.jwt.claim.role', 'service_role', false);
select test.check('the service role is taken, and its role is "service"',
  (select case when public.report_app_error('/', 'function.send-invite-emails', '502', 'resend refused', 'b75', 'server') then 1 else 0 end), 1);
select set_config('request.jwt.claim.role', '', false);
select test.check('...in the log',
  (select count(*) from public.app_errors where action = 'function.send-invite-emails' and role = 'service' and platform = 'server'), 1);

\echo ''
\echo '--- Thirty days, then the nightly sweep ---'
insert into public.app_errors (created_at, area, action, code, role) values
  (now() - interval '31 days', '/', 'old.one', '500', 'member'),
  (now() - interval '29 days', '/', 'old.two', '500', 'member');
insert into public.app_error_limits (bucket, minute, n) values ('u:old', now() - interval '3 hours', 4);
select test.check('control: both old rows and the old counter are there before the sweep',
  (select count(*) from public.app_errors where action like 'old.%') + (select count(*) from public.app_error_limits where bucket = 'u:old'), 3);
select public.sweep_app_errors();
select test.check('the sweep removes the row older than thirty days and keeps the one younger',
  (select count(*) from public.app_errors where action = 'old.one') * 10 + (select count(*) from public.app_errors where action = 'old.two'), 1);
select test.check('...and the old counter, but not this minute''s',
  (select count(*) from public.app_error_limits where bucket = 'u:old'), 0);

delete from public.app_errors;
delete from public.app_error_limits;
delete from public.notifications where kind = 'app_error';
update public.app_settings set value = 'off' where key = 'app_errors_live';
select set_config('request.headers', '', false);
