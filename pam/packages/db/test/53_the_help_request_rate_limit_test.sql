-- the help request rate limit (test 53, D-521).
--
-- The help desk's form posts to an edge function that emails Will. This is the limit it asks the
-- database about: three requests an hour from one caller, thirty from everybody, kept as salted
-- hashes, forgotten after a day, and nobody but the service role may ask.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

reset role;
select set_config('request.jwt.claim.sub', '', false);
delete from public.help_request_attempts;

set role service_role;
select test.check('a first request is let through',
  (select public.help_request_allowed('test53-aaaa'))::int, 1);
select public.help_request_allowed('test53-aaaa');
select public.help_request_allowed('test53-aaaa');
select test.check('...the fourth from the same caller in the hour is not',
  (select public.help_request_allowed('test53-aaaa'))::int, 0);
select test.check('...and a refused one is not recorded',
  (select count(*) from public.help_request_attempts where who = 'test53-aaaa'), 3::bigint);
select test.check('another caller is let through',
  (select public.help_request_allowed('test53-bbbb'))::int, 1);
select test.check('nobody is let through without a caller',
  (select public.help_request_allowed(''))::int, 0);

-- The overall cap: with 30 in the last hour, even a new caller waits.
reset role;
insert into public.help_request_attempts (who) select 'test53-fill-' || g from generate_series(1, 40) g;
set role service_role;
select test.check('when everybody together has had thirty in the hour, a new caller waits',
  (select public.help_request_allowed('test53-cccc'))::int, 0);

-- Old rows are forgotten, and no longer count.
reset role;
update public.help_request_attempts set at = now() - interval '2 days';
set role service_role;
select test.check('after a day nothing counts against anybody',
  (select public.help_request_allowed('test53-aaaa'))::int, 1);
reset role;
select test.check('...and the old rows are gone',
  (select count(*) from public.help_request_attempts where at < now() - interval '1 day'), 0::bigint);

-- Only the service role.
set role anon;
select test.check('anon cannot ask',
  has_function_privilege('anon', 'public.help_request_allowed(text,integer,integer)', 'execute')::int, 0);
select test.check('a signed-in person cannot ask',
  has_function_privilege('authenticated', 'public.help_request_allowed(text,integer,integer)', 'execute')::int, 0);
reset role;
select test.check('the table is closed to everyone but the service role',
  (has_table_privilege('anon', 'public.help_request_attempts', 'select')
   or has_table_privilege('authenticated', 'public.help_request_attempts', 'select'))::int, 0);

delete from public.help_request_attempts;
