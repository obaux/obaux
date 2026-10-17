-- The Pam team sees how many people wait for each city (test 75; D-593, card a96).
--
-- `waiting_city_counts()` gives a super admin each city people signed up from, and how many: grouped ignoring case and
-- spacing, a state kept apart, biggest first. It returns a place and a number and nothing else, and nobody but a super
-- admin gets anything: not signed out, not a member, not a case manager, not a program lead.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set marcus '33333333-0000-0000-0000-00000000000c'
\set dana   '33333333-0000-0000-0000-00000000000a'
\set alice  '33333333-0000-0000-0000-00000000000f'
\set boss   'cccccccc-0000-0000-0000-000000007500'

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

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'boss', '12675557500');
insert into public.profiles (id, role, first_name, region_id, phone, access_status)
values (:'boss', 'super_admin', 'Bea', :'region_north', '+12675557500', 'active');

-- Earlier files (04) leave their own waiting rows: set them aside so the counts are this file's, and put them back after.
create temp table kept_waiting as select * from public.waiting_cities;
delete from public.waiting_cities;

-- Nine people who signed up from cities Pam is not in, as they typed them.
insert into auth.users (id, phone)
select ('cccccccc-0000-0000-0000-0000000075' || lpad(n::text, 2, '0'))::uuid, '1267555' || lpad((7510 + n)::text, 4, '0')
from generate_series(1, 9) n;
insert into public.waiting_cities (user_id, city) values
  ('cccccccc-0000-0000-0000-000000007501', 'Camden'),
  ('cccccccc-0000-0000-0000-000000007502', '  camden '),
  ('cccccccc-0000-0000-0000-000000007503', 'CAMDEN'),
  ('cccccccc-0000-0000-0000-000000007504', 'Camden, NJ'),
  ('cccccccc-0000-0000-0000-000000007505', 'camden,nj'),
  ('cccccccc-0000-0000-0000-000000007506', 'Camden, New Jersey'),
  ('cccccccc-0000-0000-0000-000000007507', 'Chester'),
  ('cccccccc-0000-0000-0000-000000007508', 'Wilmington,   DE'),
  ('cccccccc-0000-0000-0000-000000007509', 'wilmington, de');

\echo ''
\echo '--- A super admin sees each city and how many, biggest first ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('one row per place: Camden; Camden, NJ; Camden, NEW JERSEY; Chester; Wilmington, DE',
  (select count(*) from public.waiting_city_counts()), 5::bigint);
select test.check('"Camden", "  camden " and "CAMDEN" are one place, shown as most typed it, with 3',
  (select count(*) from public.waiting_city_counts() where place = 'Camden' and people = 3), 1::bigint);
select test.check('"Camden, NJ" and "camden,nj" are one place, apart from Camden without a state, with 2',
  (select count(*) from public.waiting_city_counts() where place = 'Camden, NJ' and people = 2), 1::bigint);
select test.check('a state written out is its own place (no names matched to letters)',
  (select count(*) from public.waiting_city_counts() where place = 'Camden, NEW JERSEY' and people = 1), 1::bigint);
select test.check('extra spaces after the comma are squeezed: Wilmington, DE with 2',
  (select count(*) from public.waiting_city_counts() where place = 'Wilmington, DE' and people = 2), 1::bigint);
select test.check('biggest first: Camden is the first row',
  (select count(*) from (select place from public.waiting_city_counts() limit 1) t where place = 'Camden'), 1::bigint);
select test.check('the counts add up to everyone waiting',
  (select sum(people) from public.waiting_city_counts())::bigint, 9::bigint);

reset role;
select test.check('it returns a place and a number, nothing else (no person, phone, name, id or date)',
  (select count(*) from information_schema.parameters p
   join information_schema.routines r on r.specific_name = p.specific_name
   where r.routine_schema = 'public' and r.routine_name = 'waiting_city_counts' and p.parameter_mode = 'OUT'), 2::bigint);
select test.check('...and it is a definer with the fixed search path',
  (select count(*) from pg_proc where proname = 'waiting_city_counts' and prosecdef
     and proconfig @> array['search_path=public, extensions']), 1::bigint);

\echo ''
\echo '--- Nobody else gets anything ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'marcus', false);
select test.check_raises_like('a member gets nothing', 'select * from public.waiting_city_counts()', 'ONLY_A_SUPER_ADMIN%');
select set_config('request.jwt.claim.sub', :'dana', false);
select test.check_raises_like('a case manager gets nothing', 'select * from public.waiting_city_counts()', 'ONLY_A_SUPER_ADMIN%');
select set_config('request.jwt.claim.sub', :'alice', false);
select test.check_raises_like('a program lead gets nothing', 'select * from public.waiting_city_counts()', 'ONLY_A_SUPER_ADMIN%');
select set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000007501', false);
select test.check_raises_like('someone on the waiting list does not see the others',
  'select * from public.waiting_city_counts()', 'ONLY_A_SUPER_ADMIN%');
select test.check('...and still reads only their own row of the table',
  (select count(*) from public.waiting_cities), 1::bigint);
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select test.check_raises_like('signed out gets nothing', 'select * from public.waiting_city_counts()', 'permission denied%');

reset role;
delete from public.waiting_cities where user_id::text like 'cccccccc-0000-0000-0000-0000000075%';
insert into public.waiting_cities select * from kept_waiting;
drop table kept_waiting;
delete from public.profiles where id = :'boss';
delete from auth.users where id::text like 'cccccccc-0000-0000-0000-0000000075%';
select set_config('request.jwt.claim.sub', '', false);
