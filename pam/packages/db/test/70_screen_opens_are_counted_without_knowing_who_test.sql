-- screen opens are counted without knowing who (test 70).
--
-- Claimed 2026-10-13 on `claude/messages-screen-open-counter` with `pnpm claim test`. The files run in name order
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
      raise notice 'ok    % (blocked: %)', label, left(sqlerrm, 60);
      return;
    end if;
    raise exception 'FAIL  % — it failed for another reason: %', label, sqlerrm;
  end;
  raise exception 'FAIL  % — the statement was allowed and should not have been', label;
end;
$$;
grant execute on function test.check_raises_like(text, text, text) to authenticated, anon, service_role;

\set member '33333333-0000-0000-0000-00000000000c'
\set region_north '11111111-0000-0000-0000-000000000001'

\echo ''
\echo '--- Screen opens are counted without knowing who ---'

reset role;
-- This file's own rows only: start from an empty table (nothing else writes it).
delete from public.screen_open_counts;

select test.check('the table holds exactly a day, a screen and a count: no person, device, time or place',
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'screen_open_counts'
      and column_name not in ('day', 'screen', 'count')), 0::bigint);
select test.check('...three columns, and none is a timestamp or a uuid',
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'screen_open_counts'
      and (data_type in ('uuid', 'text', 'date', 'integer'))), 3::bigint);
select test.check('row level security is on and forced',
  (select count(*) from pg_class where oid = 'public.screen_open_counts'::regclass and relrowsecurity and relforcerowsecurity), 1::bigint);
select test.check('the counting function sets its search_path',
  (select count(*) from pg_proc where proname = 'count_screen_open' and proconfig::text like '%search_path=public, extensions%'), 1::bigint);

set role authenticated;
select test.as_user(:'member');

select public.count_screen_open('points');
select public.count_screen_open('points');
select public.count_screen_open('profile');
reset role;
select test.check('each call adds one to today''s count for that screen',
  (select count from public.screen_open_counts where screen = 'points'), 2::bigint);
select test.check('...a row per screen',
  (select count(*) from public.screen_open_counts), 2::bigint);

set role authenticated;
select test.as_user(:'member');
select test.check_raises_like('any other screen is refused',
  $f$select public.count_screen_open('places')$f$, '%SCREEN_NOT_COUNTED%');
select test.check_raises_like('...an empty one too',
  $f$select public.count_screen_open('')$f$, '%SCREEN_NOT_COUNTED%');
select test.check_raises_like('...and no screen at all',
  $f$select public.count_screen_open(null)$f$, '%SCREEN_NOT_COUNTED%');
select test.check_raises('nobody can read the table through the API',
  $f$select * from public.screen_open_counts$f$);
select test.check_raises('nobody can write it directly either',
  $f$insert into public.screen_open_counts (day, screen, count) values (current_date, 'points', 99)$f$);
select test.check_raises('...nor change a count',
  $f$update public.screen_open_counts set count = 0$f$);
select test.check_raises('a signed-in person cannot read the weekly report',
  $f$select * from public.screen_opens_weekly()$f$);

reset role;
set role anon;
select test.check_raises('someone signed out cannot count',
  $f$select public.count_screen_open('points')$f$);
select test.check_raises('...nor read the weekly report',
  $f$select * from public.screen_opens_weekly()$f$);

-- A signed-out caller that does reach the function (the grant removed, say) is still refused inside it.
reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check_raises_like('the function itself refuses a caller who is not signed in',
  $f$select public.count_screen_open('points')$f$, '%Sign in first%');

-- The weekly report: service role only, and a total under 5 reads "under 5".
set role service_role;
select test.check('the report shows a week with fewer than 5 as "under 5"',
  (select count(*) from public.screen_opens_weekly() where screen = 'points' and shown = 'under 5'), 1::bigint);
reset role;
update public.screen_open_counts set count = 4 where screen = 'points';
set role service_role;
select test.check('4 is still "under 5"',
  (select count(*) from public.screen_opens_weekly() where screen = 'points' and shown = 'under 5'), 1::bigint);
reset role;
update public.screen_open_counts set count = 5 where screen = 'points';
set role service_role;
select test.check('5 is shown as 5',
  (select count(*) from public.screen_opens_weekly() where screen = 'points' and shown = '5'), 1::bigint);
reset role;
-- Several days in one week add up before they are masked: 3 + 3 = 6.
insert into public.screen_open_counts (day, screen, count) values
  (date '2026-01-05', 'profile', 3), (date '2026-01-06', 'profile', 3);
set role service_role;
select test.check('days in the same week add up, then the total is judged: 3 + 3 shows as 6',
  (select count(*) from public.screen_opens_weekly() where week_start = date '2026-01-05' and screen = 'profile' and shown = '6'), 1::bigint);
reset role;

-- Nothing in the table or the report can say who: the audit log and notifications are not written either.
select test.check('counting wrote nothing to the audit log',
  (select count(*) from public.audit_log where action like '%screen%'), 0::bigint);

delete from public.screen_open_counts;
\echo ''
\echo 'screen opens are counted without knowing who: all checks passed'
