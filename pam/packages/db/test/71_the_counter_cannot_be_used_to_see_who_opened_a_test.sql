-- The screen counter cannot be used to see who opened a screen (test 71; a76, D-555).
--
-- Will signed this line on 13 October 2026 (card a76, `privacy.s.what-we-keep.p13`): "Each day, we count how many phones opened Your
-- points and your Profile. It is one number for each screen, for everyone together. It has no name, phone number or account in it, so it
-- can't show who opened what. … In our reports, a number under 5 shows only as "under 5"."
--
-- Test 70 (Nico) shows the counter does what it says. This file attacks the other direction: what would have to be true for the number
-- to be used to find a person, and holds the database to none of it being true. A later migration that adds a column, a trigger, a
-- foreign key, a view, a second reader, or a function that looks at who is asking, fails here, so Privacy cannot become untrue by
-- another route:
--
--   * the table cannot be joined to a person: no foreign key either way, no trigger, no view built on it, and only the two functions
--     that are meant to touch it mention it;
--   * the counting function takes a screen name and nothing else, returns nothing, and its body never looks at who is calling, where
--     from, or at the request;
--   * calling it changes no row in any other table (every table of `public` and `auth` is counted before and after);
--   * nobody but the service role reads the table or the weekly report, whatever their role in Pam (a member, a program lead, a case
--     manager);
--   * the weekly report can only ever say "under 5" or a number of 5 or more: no total below 5 comes out as a number, 0 included,
--     and the report's columns are a week, a screen and text, so a small number cannot leave as one.
--
-- The files run in name order on one database; this one starts and ends with an empty counter table (nothing else writes it).

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set marcus '33333333-0000-0000-0000-00000000000c'
\set dana    '33333333-0000-0000-0000-00000000000a'
\set alice   '33333333-0000-0000-0000-00000000000f'

reset role;
delete from public.screen_open_counts;

-- ===========================================================================
\echo ''
\echo '--- Nothing can join the counter to a person ---'
-- ===========================================================================
select test.check('no foreign key leaves the table or points at it',
  (select count(*) from pg_constraint
   where contype = 'f'
     and (conrelid = 'public.screen_open_counts'::regclass or confrelid = 'public.screen_open_counts'::regclass)), 0::bigint);
select test.check('no trigger is on the table (nothing can copy a row, or who made it, elsewhere)',
  (select count(*) from pg_trigger where tgrelid = 'public.screen_open_counts'::regclass and not tgisinternal), 0::bigint);
select test.check('no view or materialized view is built on it',
  (select count(*) from pg_depend d
   join pg_rewrite r on r.oid = d.objid
   join pg_class v on v.oid = r.ev_class and v.relkind in ('v', 'm')
   where d.refobjid = 'public.screen_open_counts'::regclass), 0::bigint);
select test.check('exactly two functions in `public` mention it: the one that counts and the one that reports',
  (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and prosrc ilike '%screen_open_counts%'), 2::bigint);
select test.check('...and they are count_screen_open and screen_opens_weekly',
  (select count(*) from pg_proc
   where pronamespace = 'public'::regnamespace and prosrc ilike '%screen_open_counts%'
     and proname in ('count_screen_open', 'screen_opens_weekly')), 2::bigint);
select test.check('only a screen the Privacy line names can be a row, and a count cannot be negative (the table says so itself)',
  (select count(*) from pg_constraint
   where conrelid = 'public.screen_open_counts'::regclass and contype = 'c'), 2::bigint);
select test.check_raises('a row for any other screen is refused even by a superuser',
  $f$insert into public.screen_open_counts (day, screen, count) values (current_date, 'places', 1)$f$);
select test.check_raises('...and so is a negative count',
  $f$insert into public.screen_open_counts (day, screen, count) values (current_date, 'points', -1)$f$);

-- ===========================================================================
\echo ''
\echo '--- The counting function looks at nobody ---'
-- ===========================================================================
select test.check('count_screen_open takes one argument, a screen name',
  (select count(*) from pg_proc
   where proname = 'count_screen_open' and pronamespace = 'public'::regnamespace
     and pronargs = 1 and proargtypes::text = 'text'::regtype::oid::text), 1::bigint);
select test.check('...and returns nothing, so a caller learns no count',
  (select count(*) from pg_proc
   where proname = 'count_screen_open' and pronamespace = 'public'::regnamespace and prorettype = 'void'::regtype), 1::bigint);
select test.check('...it is security definer with its search_path set, like every such function',
  (select count(*) from pg_proc
   where proname = 'count_screen_open' and pronamespace = 'public'::regnamespace
     and prosecdef and proconfig::text like '%search_path=public, extensions%'), 1::bigint);
select test.check('its body asks who is calling exactly once, only to refuse a caller who is signed out',
  (select (length(prosrc) - length(replace(prosrc, 'uid()', ''))) / 4 from pg_proc
   where proname = 'count_screen_open' and pronamespace = 'public'::regnamespace), 1::bigint);
select test.check('...and has nothing to do with the request, the address it came from, a profile or the audit log',
  (select count(*) from pg_proc
   where proname = 'count_screen_open' and pronamespace = 'public'::regnamespace
     and prosrc ~* '(request\.|inet_client|client_addr|headers|jwt|profiles|audit_log|notifications|messages|current_user|session_user)'), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- Counting changes nothing but the counter ---'
-- ===========================================================================
-- Every row of every table in `public` and `auth`, except the counter's own.
create or replace function pg_temp.rows_elsewhere() returns bigint
language plpgsql as $$
declare
  total bigint := 0;
  t record;
  n bigint;
begin
  for t in
    select schemaname, tablename from pg_tables
    where schemaname in ('public', 'auth') and not (schemaname = 'public' and tablename = 'screen_open_counts')
  loop
    execute format('select count(*) from %I.%I', t.schemaname, t.tablename) into n;
    total := total + n;
  end loop;
  return total;
end;
$$;

create temp table elsewhere_before as select pg_temp.rows_elsewhere() as n;

set role authenticated;
select test.as_user(:'marcus');
select public.count_screen_open('points');
select public.count_screen_open('points');
select public.count_screen_open('profile');
select test.as_user(:'dana');
select public.count_screen_open('profile');
select test.as_user(:'alice');
select public.count_screen_open('points');
reset role;

select test.check('five calls by three people added five to the counter...',
  (select coalesce(sum(count), 0) from public.screen_open_counts), 5::bigint);
select test.check('...and changed not one row in any other table: no audit entry, no log, no history, nothing about who',
  (select pg_temp.rows_elsewhere() - n from elsewhere_before), 0::bigint);
select test.check('the counter itself still holds only a day, a screen and a count: two rows',
  (select count(*) from public.screen_open_counts), 2::bigint);

-- ===========================================================================
\echo ''
\echo '--- Nobody but the service role reads it, whatever their place in Pam ---'
-- ===========================================================================
select test.check('no client role holds any privilege on the table',
  (select count(*) from (values ('anon'), ('authenticated')) r(name)
   where has_table_privilege(r.name, 'public.screen_open_counts', 'select,insert,update,delete,truncate,references,trigger')), 0::bigint);
select test.check('PUBLIC holds none either',
  (select count(*) from pg_class c, aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
   where c.oid = 'public.screen_open_counts'::regclass and a.grantee = 0), 0::bigint);
select test.check('the weekly report is for the service role alone',
  (select count(*) from (values ('anon'), ('authenticated')) r(name)
   where has_function_privilege(r.name, 'public.screen_opens_weekly()', 'execute')), 0::bigint);
select test.check('...and PUBLIC cannot run it',
  (select count(*) from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
   where p.oid = 'public.screen_opens_weekly()'::regprocedure and a.grantee = 0), 0::bigint);
select test.check('...which the service role can',
  has_function_privilege('service_role', 'public.screen_opens_weekly()', 'execute')::int, 1);
select test.check('a person who is signed out cannot count',
  has_function_privilege('anon', 'public.count_screen_open(text)', 'execute')::int, 0);

set role authenticated;
select test.as_user(:'dana');
select test.check_raises('a case manager cannot read the counter', $f$select * from public.screen_open_counts$f$);
select test.check_raises('...nor the weekly report', $f$select * from public.screen_opens_weekly()$f$);
select test.as_user(:'alice');
select test.check_raises('a program lead cannot read the counter', $f$select * from public.screen_open_counts$f$);
select test.check_raises('...nor the weekly report', $f$select * from public.screen_opens_weekly()$f$);
select test.as_user(:'marcus');
select test.check_raises('a member cannot change a count they were part of',
  $f$update public.screen_open_counts set count = count - 1$f$);
select test.check_raises('...nor empty the table',
  $f$delete from public.screen_open_counts$f$);
reset role;

-- ===========================================================================
\echo ''
\echo '--- A small number never leaves as a number ---'
-- ===========================================================================
select test.check('the report is a week, a screen and text: nothing typed as a number can carry a small count out',
  (select count(*) from (select 1 where pg_get_function_result('public.screen_opens_weekly()'::regprocedure) = 'TABLE(week_start date, screen text, shown text)') x), 1::bigint);
select test.check('and it takes no argument, so nobody can ask it for a narrower slice',
  (select count(*) from pg_proc where oid = 'public.screen_opens_weekly()'::regprocedure and pronargs = 0), 1::bigint);

delete from public.screen_open_counts;
insert into public.screen_open_counts (day, screen, count) values
  (date '2026-02-02', 'points', 1),  -- a week of 1
  (date '2026-02-09', 'points', 2),  -- a week of 2 + 2 = 4 (two days)
  (date '2026-02-10', 'points', 2),
  (date '2026-02-16', 'points', 0),  -- a week of 0
  (date '2026-02-23', 'points', 3),  -- a week of 3 and a week of 3 on the other screen
  (date '2026-02-23', 'profile', 3),
  (date '2026-03-02', 'points', 5),  -- 5 and 6 are shown as numbers
  (date '2026-03-09', 'points', 6);

set role service_role;
select test.check('weeks of 0, 1, 3 and 4 read "under 5", and no total below 5 is ever shown as a digit',
  (select count(*) from public.screen_opens_weekly() where shown ~ '^[0-4]$'), 0::bigint);
select test.check('...five rows are under 5 (1, 4, 0, 3 and 3 on two screens)',
  (select count(*) from public.screen_opens_weekly() where shown = 'under 5'), 5::bigint);
select test.check('5 is shown as 5',
  (select count(*) from public.screen_opens_weekly() where week_start = date '2026-03-02' and screen = 'points' and shown = '5'), 1::bigint);
select test.check('...and 6 as 6',
  (select count(*) from public.screen_opens_weekly() where week_start = date '2026-03-09' and screen = 'points' and shown = '6'), 1::bigint);
reset role;

delete from public.screen_open_counts;
\echo ''
\echo 'the counter cannot be used to see who opened a screen: all checks passed'
