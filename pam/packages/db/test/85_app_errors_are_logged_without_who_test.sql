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

-- Marcus (seed member) fails things; Dana (seed case manager), Alice (seed program lead) and Root (seed super admin) are the other readers.
\set marcus '33333333-0000-0000-0000-00000000000c'
\set dana   '33333333-0000-0000-0000-00000000000a'
\set alice  '33333333-0000-0000-0000-00000000000f'
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
  (select case when public.report_app_error('/signin/', 'signin.code', '500', 'b75', 'web', 'es') then 1 else 0 end), 1);
set role authenticated;
select test.as_user(:'marcus');
select test.check('...and a signed-in one',
  (select case when public.report_app_error('/alerts/', 'alerts.switch.closed', 'offline', 'b75', 'ios', 'en') then 1 else 0 end), 1);
reset role;
select test.check('the rows say the role from the sign-in (signed-out, member), the language and the build',
  (select count(*) from public.app_errors where (action = 'signin.code' and role = 'signed-out' and locale = 'es' and build = 'b75' and platform = 'web')
     or (action = 'alerts.switch.closed' and role = 'member' and locale = 'en' and platform = 'ios' and code = 'offline')), 2);
select test.check('the table has nothing but nine named columns (no free text among them)',
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'app_errors'), 9);
select test.check('...and none of them is an account, a phone, a message, a place or free text',
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'app_errors'
     and (column_name ~ '(profile|user|member|account|phone|body|message|place|service|ip|address|detail|note|text)')), 0);

\echo ''
\echo '--- Only a super admin reads it, grouped, by the function; nobody touches the table ---'
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select test.check_raises_like('anon cannot read the table', $$ select count(*) from public.app_errors $$, '%permission denied%');
select test.check_raises_like('...nor its counters', $$ select count(*) from public.app_error_limits $$, '%permission denied%');
select test.check_raises_like('...nor write a row', $$ insert into public.app_errors (area, action, code, role) values ('/', 'a.b', '500', 'member') $$, '%permission denied%');
select test.check_raises_like('...nor call the grouped read', $$ select * from public.app_errors_grouped() $$, '%permission denied%');
set role authenticated;
select test.as_user(:'marcus');
select test.check_raises_like('a member cannot select the table', $$ select count(*) from public.app_errors $$, '%permission denied%');
select test.check_raises_like('a member is refused by the grouped read', $$ select * from public.app_errors_grouped() $$, '%ONLY_A_SUPER_ADMIN%');
select test.as_user(:'dana');
select test.check_raises_like('a case manager cannot select the table', $$ select count(*) from public.app_errors $$, '%permission denied%');
select test.check_raises_like('a case manager is refused by the grouped read', $$ select * from public.app_errors_grouped() $$, '%ONLY_A_SUPER_ADMIN%');
select test.as_user(:'alice');
select test.check_raises_like('a program lead cannot select the table', $$ select count(*) from public.app_errors $$, '%permission denied%');
select test.check_raises_like('a program lead is refused by the grouped read', $$ select * from public.app_errors_grouped() $$, '%ONLY_A_SUPER_ADMIN%');
select test.check_raises_like('no signed-in person can read the counters', $$ select count(*) from public.app_error_limits $$, '%permission denied%');
select test.check_raises_like('...nor write a row', $$ insert into public.app_errors (area, action, code, role) values ('/', 'a.b', '500', 'member') $$, '%permission denied%');
select test.check_raises_like('...nor change one', $$ update public.app_errors set code = '200' $$, '%permission denied%');
select test.check_raises_like('...nor delete one', $$ delete from public.app_errors $$, '%permission denied%');
select test.as_user(:'root');
select test.check_raises_like('even a super admin cannot select the table directly', $$ select count(*) from public.app_errors $$, '%permission denied%');
select test.check('a super admin reads grouped rows with counts and first and last seen',
  (select (count(*) >= 2 and sum(n) >= 2 and bool_and(first_seen <= last_seen))::int from public.app_errors_grouped()), 1);
select test.check('...the days window is capped at the keep time',
  (select count(*) from public.app_errors_grouped(100000)), (select count(*) from public.app_errors_grouped(30)));
reset role;
-- The counters older than five minutes go when the next report comes in.
insert into public.app_error_limits (bucket, minute, n) values ('u:stale', now() - interval '10 minutes', 3);
select set_config('request.jwt.claim.sub', '', false);
select public.report_app_error('/', 'stale.check', '500', 'b75', 'web', 'en');
select test.check('a report clears counters older than five minutes',
  (select count(*) from public.app_error_limits where bucket = 'u:stale'), 0);
delete from public.app_errors where action = 'stale.check';
insert into public.app_error_limits (bucket, minute, n) values ('u:stale2', now() - interval '10 minutes', 3), ('u:fresh', now(), 1);
select public.sweep_app_error_counters();
select test.check('the counter job removes counters older than five minutes without waiting for a report, and keeps the fresh one',
  (select count(*) from public.app_error_limits where bucket = 'u:stale2') * 10 + (select count(*) from public.app_error_limits where bucket = 'u:fresh'), 1);
delete from public.app_error_limits where bucket = 'u:fresh';

\echo ''
\echo '--- What comes in is checked: no free text gets through ---'
delete from public.app_errors;
delete from public.app_error_limits;
set role authenticated;
select test.as_user(:'root');
-- An error whose own message holds a phone number, an email address, a first name and a place name is offered as the code, the route and the build.
select test.check('a code that is an error''s own words is stored as unknown',
  (select case when public.report_app_error('/alerts/', 'alerts.switch.closed',
     'Key (phone)=(2155550100) already exists for Will at 12 Market Street, will@example.com') then 1 else 0 end), 1);
select test.check('an action that is not a stable key is refused and writes nothing',
  (select case when public.report_app_error('/alerts/', 'Will Smith at 3rd Street', '500') then 1 else 0 end), 0);
select test.check('...nor one with capitals or a space or a number first',
  (select case when public.report_app_error('/alerts/', 'Messages Send', '500') then 1 else 0 end)
  + (select case when public.report_app_error('/alerts/', '9.x', '500') then 1 else 0 end), 0);
select test.check('a valid code is kept: a status, a SQLSTATE, offline, timeout',
  (select count(*) from (values ('500'), ('23505'), ('offline'), ('timeout')) c(v) where public.report_app_error('/alerts/', 'codes.' || c.v, c.v)), 4);
select test.check('a route with an id and a query is stored as a pattern, without either',
  (select case when public.report_app_error('/person/3f2a9c1e-1111-4222-8333-444455556666/?next=alerts&q=Will', 'person.view', '404') then 1 else 0 end), 1);
select test.check('...and a place number too',
  (select case when public.report_app_error('/place/1234567/', 'place.view', '404') then 1 else 0 end), 1);
reset role;
delete from public.app_error_limits;
set role authenticated;
select test.as_user(:'root');
select test.check('a junk build, platform and language become empty, unknown and empty',
  (select case when public.report_app_error('/alerts/', 'junk.fields', '500', 'will@example.com', 'toaster', 'xx') then 1 else 0 end), 1);
reset role;
select test.check('the unknown code row says unknown and holds none of the words',
  (select count(*) from public.app_errors where action = 'alerts.switch.closed' and code = 'unknown'), 1);
select test.check('the valid codes are there',
  (select count(*) from public.app_errors where action like 'codes.%' and code in ('500', '23505', 'offline', 'timeout')), 4);
select test.check('the routes are patterns',
  (select count(*) from public.app_errors where (action = 'person.view' and area = '/person/[id]/') or (action = 'place.view' and area = '/place/[id]/')), 2);
select test.check('the junk fields are cleaned',
  (select count(*) from public.app_errors where action = 'junk.fields' and build is null and platform = 'unknown' and locale is null), 1);
select test.check('nothing anywhere in the log holds the phone, the email, the name or the street',
  (select count(*) from public.app_errors e
     where (e.area || e.action || e.code || coalesce(e.build, '') || e.platform || e.role || coalesce(e.locale, ''))
       ~* '(2155550100|@|example\.com|will|market|street|3f2a9c1e|1234567)'), 0);

\echo ''
\echo '--- The rate limit holds ---'
delete from public.app_errors;
delete from public.app_error_limits;
set role authenticated;
select test.as_user(:'marcus');
create temp table t85 (n int, ok boolean);
insert into t85 select g, public.report_app_error('/alerts/', 'loop.k' || (g % 3), '500') from generate_series(1, 14) g;
reset role;
select test.check('one caller gets ten reports a minute: the first ten are taken',
  (select count(*) from t85 where ok), 10);
select test.check('...and the other four are not',
  (select count(*) from t85 where not ok), 4);
select test.check('...and the log holds only the ten',
  (select count(*) from public.app_errors where action like 'loop.%'), 10);
select set_config('request.jwt.claim.sub', '', false);
delete from public.app_error_limits;
set role anon;
create temp table t85o (n int, ok boolean);
insert into t85o select g, public.report_app_error('/signin/', 'signin.code', '500') from generate_series(1, 35) g;
reset role;
select test.check('everyone signed out shares thirty a minute: the first thirty are taken, the other five are not',
  (select count(*) from t85o where ok) * 10 + (select count(*) from t85o where not ok), 305);
select test.check('no counter key is per person or per network address',
  (select count(*) from public.app_error_limits where bucket !~ '^(u:[0-9a-f-]{36}|s:service|s:signed-out)$'), 0);
select test.check('...and none starts with n:',
  (select count(*) from public.app_error_limits where bucket like 'n:%'), 0);
set role authenticated;
select test.as_user(:'marcus');
select test.check('a signed-in account is not held up by the signed-out cap',
  (select case when public.report_app_error('/alerts/', 'signin.code', '500') then 1 else 0 end), 1);
reset role;

\echo ''
\echo '--- The team is told once an hour per action, with a count, and only in the app ---'
delete from public.notifications where kind = 'app_error';
delete from public.app_error_limits;
select public.report_app_error('/alerts/', 'tell.one', '500');
select test.check('the first failure of an action: every super admin gets one bell row, count 1, holding only the key and the count',
  (select count(*) from public.notifications where kind = 'app_error' and recipient_id = :'root'
     and body_vars = jsonb_build_object('action', 'tell.one', 'count', 1) and body_key = 'notify.app_error'), 1);
select test.check('...and nobody who is not a super admin does',
  (select count(*) from public.notifications where kind = 'app_error' and recipient_id in (:'marcus', :'dana', :'alice')), 0);
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
select set_config('request.jwt.claim.sub', '', false);
select set_config('request.jwt.claim.role', 'service_role', false);
select test.check('the service role is taken, and its role is "service"',
  (select case when public.report_app_error('/', 'function.invite-emails', '502', 'b75', 'server') then 1 else 0 end), 1);
select set_config('request.jwt.claim.role', '', false);
select test.check('...in the log',
  (select count(*) from public.app_errors where action = 'function.invite-emails' and role = 'service' and platform = 'server'), 1);

\echo ''
\echo '--- Thirty days, one number, then the nightly sweep ---'
select test.check('the keep time is held in one place and it is thirty days',
  public.app_errors_keep_days(), 30);
insert into public.app_errors (created_at, area, action, code, role) values
  (now() - interval '31 days', '/', 'old.one', '500', 'member'),
  (now() - interval '29 days', '/', 'old.two', '500', 'member');
insert into public.app_error_limits (bucket, minute, n) values ('u:old', now() - interval '3 hours', 4);
select test.check('control: both old rows and the old counter are there before the sweep',
  (select count(*) from public.app_errors where action like 'old.%') + (select count(*) from public.app_error_limits where bucket = 'u:old'), 3);
select public.sweep_app_errors();
select test.check('the sweep removes the row older than thirty days and keeps the one younger',
  (select count(*) from public.app_errors where action = 'old.one') * 10 + (select count(*) from public.app_errors where action = 'old.two'), 1);
select test.check('...and the old counter',
  (select count(*) from public.app_error_limits where bucket = 'u:old'), 0);

delete from public.app_errors;
delete from public.app_error_limits;
delete from public.notifications where kind = 'app_error';
update public.app_settings set value = 'off' where key = 'app_errors_live';
select set_config('request.headers', '', false);
