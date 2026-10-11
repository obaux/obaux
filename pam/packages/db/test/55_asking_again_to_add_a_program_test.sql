-- asking again to add a program (test 55).
--
-- Claimed 2026-10-11 on `claude/places-programs-add-my-program` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set boss   'cccccccc-0000-0000-0000-000000005501'
\set mem_a  'cccccccc-0000-0000-0000-000000005502'
\set mem_b  'cccccccc-0000-0000-0000-000000005503'
\set mem_c  'cccccccc-0000-0000-0000-000000005504'

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
insert into auth.users (id, phone) values
  (:'boss', '12675558551'), (:'mem_a', '12675558552'), (:'mem_b', '12675558553'), (:'mem_c', '12675558554');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'boss', 'super_admin', 'Bea', :'region_north', '+12675558551', 'active'),
  (:'mem_a', 'member', 'Ada', :'region_north', '+12675558552', 'active'),
  (:'mem_b', 'member', 'Bix', :'region_north', '+12675558553', 'active'),
  (:'mem_c', 'member', 'Cy', :'region_north', '+12675558554', 'active');

\echo ''
\echo '--- A member asks to add a program ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem_a', false);
select public.request_staff_access('provider', 'Ada', '', 'North', 'Ada''s Atelier', 'education', null, 'Open studio.', '1 Elm St', null, null);
reset role;
select test.check('the request is waiting',
  (select count(*) from public.staff_requests where user_id = :'mem_a'::uuid and decision is null and wants_role = 'provider'), 1::bigint);

set role authenticated;
select set_config('request.jwt.claim.sub', :'mem_a', false);
select test.check_raises_like('a request still waiting is not sent twice',
  $f$select public.request_staff_access('provider', 'Ada', '', 'North', 'Again', 'education', null, null, null, null, null)$f$, '%REQUEST_ALREADY_WAITING%');

\echo ''
\echo '--- Turned down, asked again ---'
select set_config('request.jwt.claim.sub', :'mem_b', false);
select public.request_staff_access('provider', 'Bix', '', 'North', 'Bix''s Bench', 'workforce', null, null, null, null, null);
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'mem_b', 'denied', null);
select set_config('request.jwt.claim.sub', :'mem_b', false);
select public.request_staff_access('provider', 'Bix', '', 'North', 'Bix''s Bench, better', 'workforce', null, 'Now with details.', '2 Oak St', null, null);
reset role;
select test.check('asking again makes it a waiting request, the answer cleared and the new details kept',
  (select count(*) from public.staff_requests where user_id = :'mem_b'::uuid and decision is null and reviewed_by is null and program_name = 'Bix''s Bench, better'), 1::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'mem_b', 'approved', :'region_north');
reset role;
select test.check('...and Approve works on it: the member keeps their member side and gains the provider role',
  (select count(*) from public.profile_roles where profile_id = :'mem_b'::uuid), 2::bigint);

\echo ''
\echo '--- Approved is not reopened ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem_b', false);
select test.check_raises_like('an approved request cannot be asked again',
  $f$select public.request_staff_access('provider', 'Bix', '', 'North', 'Third', 'workforce', null, null, null, null, null)$f$, '%REQUEST_ALREADY_APPROVED%');

\echo ''
\echo '--- Signed out ---'
reset role;
set role anon;
select test.check_raises('nobody signed out can ask', $f$select public.request_staff_access('provider', 'X', '', 'North', 'Y', 'education', null, null, null, null, null)$f$);

\echo ''
\echo 'asking again to add a program: all checks passed'
