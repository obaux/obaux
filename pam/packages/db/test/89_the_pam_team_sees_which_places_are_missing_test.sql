-- the pam team sees which places are missing details (test 89).
--
-- Claimed 2026-10-31 on `claude/pam-program-stats` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

-- `program_info_gaps()` (D-623) counts the listed places and how many have a phone, a website, an address and real hours,
-- each over the places that need it (Parks & Rec need only an address, D-622), and lists the places that lack something.
-- Nobody but a super admin gets anything. Counts are checked as the change this file makes, so the seed's places do not
-- matter; the list is checked by this file's own ids.

\set region_north '11111111-0000-0000-0000-000000000001'
\set marcus '33333333-0000-0000-0000-00000000000c'
\set dana   '33333333-0000-0000-0000-00000000000a'
\set alice  '33333333-0000-0000-0000-00000000000f'
\set boss   'cccccccc-0000-0000-0000-000000008900'

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
insert into auth.users (id, phone) values (:'boss', '12675558900');
insert into public.profiles (id, role, first_name, region_id, phone, access_status)
values (:'boss', 'super_admin', 'Bea', :'region_north', '+12675558900', 'active');

\echo ''
\echo '--- Real hours, by the same rule as parseHours ---'
select test.check('a week of seven days, each a list of HH:MM pairs, is real',
  (public.hours_are_real('[[], [{"open":"09:00","close":"17:00"}], [], [], [], [], []]'::jsonb))::int, 1);
select test.check('...and so is the same week under "week"',
  (public.hours_are_real('{"week": [[], [], [], [], [], [], [{"open":"10:00","close":"14:00"}]]}'::jsonb))::int, 1);
select test.check('six days is not a week',
  (public.hours_are_real('[[], [], [], [], [], []]'::jsonb))::int, 0);
select test.check('a time not in HH:MM is not real',
  (public.hours_are_real('[[], [{"open":"9:00","close":"17:00"}], [], [], [], [], []]'::jsonb))::int, 0);
select test.check('Parks & Rec''s "no hours" marker (D-622) is not a week',
  (public.hours_are_real('{"none": true}'::jsonb))::int, 0);
select test.check('no hours at all is not real',
  (coalesce(public.hours_are_real(null), false))::int, 0);

-- Before this file's places.
set role authenticated;
select test.as_user(:'boss');
select public.program_info_gaps() as before \gset
reset role;

-- Nine places. 1 has everything; 2 lacks a phone and hours; 3 has a blank website and hours that are not a week; 4 (a
-- library) lacks an address; 5 (Parks & Rec) has an address and needs nothing else; 6 (Parks & Rec) lacks its address; 7
-- (added by hand) lacks hours; 8 is inactive and 9 removed, so neither is counted.
insert into public.services (id, name, category, source, source_ref, address, phone, website, hours, is_active, removed_at) values
  ('89000000-0000-4000-8000-000000000001', 'Gap Test Clinic', 'education', 'manual', 'dbhids:gap-1', '1 Test St', '+12155550101', 'https://one.example.org', '[[], [{"open":"09:00","close":"17:00"}], [], [], [], [], []]', true, null),
  ('89000000-0000-4000-8000-000000000002', 'Gap Test Counseling', 'education', 'manual', 'dbhids:gap-2', '2 Test St', null, 'https://two.example.org', null, true, null),
  ('89000000-0000-4000-8000-000000000003', 'Gap Test Recovery', 'education', 'manual', 'dbhids:gap-3', '3 Test St', '+12155550103', '   ', '[[], [], [], [], [], []]', true, null),
  ('89000000-0000-4000-8000-000000000004', 'Gap Test Library', 'education', 'manual', 'cityfac:gap-4', '  ', '+12155550104', 'https://four.example.org', '[[], [], [], [], [], [], []]', true, null),
  ('89000000-0000-4000-8000-000000000005', 'Gap Test Park', 'education', 'manual', 'pprsite:gap-5', '5 Test St', null, null, '{"none": true}', true, null),
  ('89000000-0000-4000-8000-000000000006', 'Gap Test Playground', 'education', 'manual', 'pprsite:gap-6', null, null, null, '{"none": true}', true, null),
  ('89000000-0000-4000-8000-000000000007', 'Gap Test Kitchen', 'education', 'manual', 'oic:gap-7', '7 Test St', '+12155550107', 'https://seven.example.org', null, true, null),
  ('89000000-0000-4000-8000-000000000008', 'Gap Test Closed', 'education', 'manual', 'dbhids:gap-8', null, null, null, null, false, null),
  ('89000000-0000-4000-8000-000000000009', 'Gap Test Removed', 'education', 'manual', 'dbhids:gap-9', null, null, null, null, true, now());

set role authenticated;
select test.as_user(:'boss');
select public.program_info_gaps() as after \gset
select public.program_info_gaps(true) as listed \gset
reset role;

\echo ''
\echo '--- The counts: each detail over the places that need it, inactive and removed left out ---'
create temp table gap_delta as
select key, (:'after'::jsonb ->> key)::int - (:'before'::jsonb ->> key)::int as n
from jsonb_object_keys(:'after'::jsonb - 'places') as key;
select test.check('seven more places listed (the inactive and the removed one are not)', (select n from gap_delta where key = 'total'), 7);
select test.check('five of them need a phone (not the two Parks & Rec)', (select n from gap_delta where key = 'phone_need'), 5);
select test.check('...and four have one', (select n from gap_delta where key = 'phone_have'), 4);
select test.check('five need a website, and four have one (a blank one is missing)', (select n from gap_delta where key = 'website_have') * 10 + (select n from gap_delta where key = 'website_need'), 45);
select test.check('all seven need an address, and five have one (a blank one is missing)', (select n from gap_delta where key = 'address_have') * 10 + (select n from gap_delta where key = 'address_need'), 57);
select test.check('five need hours, and two have real ones', (select n from gap_delta where key = 'hours_have') * 10 + (select n from gap_delta where key = 'hours_need'), 25);
select test.check('five places lack something', (select n from gap_delta where key = 'missing'), 5);
select test.check('without the list, there is no list', (case when (:'after'::jsonb) ? 'places' and jsonb_typeof(:'after'::jsonb -> 'places') = 'null' then 1 else 0 end), 1);

\echo ''
\echo '--- The list: each place that lacks something, with what, and its kind ---'
create temp table gap_rows as
select p ->> 'id' as id, p ->> 'kind' as kind, p ->> 'address' as address,
       (select string_agg(m, ',' order by m) from jsonb_array_elements_text(p -> 'missing') m) as missing
from jsonb_array_elements(:'listed'::jsonb -> 'places') p
where p ->> 'id' like '89000000-%';
select test.check('the five places that lack something, and only those', (select count(*) from gap_rows), 5);
select test.check('2: a phone and hours (behavioral health)', (select count(*) from gap_rows where id like '%0002' and missing = 'hours,phone' and kind = 'health'), 1);
select test.check('3: a website and hours (blank and not a week)', (select count(*) from gap_rows where id like '%0003' and missing = 'hours,website'), 1);
select test.check('4: the address (a library), shown as no address', (select count(*) from gap_rows where id like '%0004' and missing = 'address' and kind = 'library' and address is null), 1);
select test.check('6: Parks & Rec lacks only its address, never a phone, website or hours', (select count(*) from gap_rows where id like '%0006' and missing = 'address' and kind = 'parks'), 1);
select test.check('7: added by hand, lacking hours', (select count(*) from gap_rows where id like '%0007' and missing = 'hours' and kind = 'hand'), 1);
select test.check('the complete place and the complete park are not listed, nor the inactive or removed ones',
  (select count(*) from gap_rows where id similar to '%000(1|5|8|9)'), 0);
select test.check('each row is an id, a name, an address, a kind and what is missing, and nothing else',
  (select count(*) from jsonb_array_elements(:'listed'::jsonb -> 'places') p
   where (select array_agg(k order by k) from jsonb_object_keys(p) k) <> array['address', 'id', 'kind', 'missing', 'name']), 0);

\echo ''
\echo '--- Nobody but a super admin ---'
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select test.check_raises_like('signed out cannot call it', $$ select public.program_info_gaps() $$, '%permission denied%');
set role authenticated;
select test.as_user(:'marcus');
select test.check_raises_like('a member is refused', $$ select public.program_info_gaps(true) $$, '%ONLY_A_SUPER_ADMIN%');
select test.as_user(:'dana');
select test.check_raises_like('a case manager is refused', $$ select public.program_info_gaps(true) $$, '%ONLY_A_SUPER_ADMIN%');
select test.as_user(:'alice');
select test.check_raises_like('a program lead is refused', $$ select public.program_info_gaps(true) $$, '%ONLY_A_SUPER_ADMIN%');
select test.check_raises_like('nobody calls the hours rule directly', $$ select public.hours_are_real('[]'::jsonb) $$, '%permission denied%');
reset role;

-- Leave nothing behind.
delete from public.services where id::text like '89000000-%';
delete from public.profiles where id = :'boss';
delete from auth.users where id = :'boss';
