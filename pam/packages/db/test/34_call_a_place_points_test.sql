-- Calling a place earns 10 points, once per place (log_call).

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set eve   '99999999-0000-0000-0000-000000000b01'
\set fay   '99999999-0000-0000-0000-000000000b02'
\set lead  '99999999-0000-0000-0000-000000000b03'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'eve', '12675558821'), (:'fay', '12675558822'), (:'lead', '12675558823');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'eve', 'member', 'Eve', :'region_north', '+12675558821', 'active'),
  (:'fay', 'member', 'Fay', :'region_north', '+12675558822', 'active'),
  (:'lead', 'provider', 'Lia', :'region_north', '+12675558823', 'active');
insert into public.services (id, name, category, address, source, needs_review, is_active)
select ('88888888-0000-0000-0000-000000000b' || lpad(n::text, 2, '0'))::uuid, 'Call place ' || n,
       'workforce', n || ' Oak St', 'manual', false, true
from generate_series(1, 7) n;
insert into public.services (id, name, category, address, source, needs_review, is_active) values
  ('88888888-0000-0000-0000-000000000bf0', 'Not Yet Reviewed', 'workforce', '9 Oak St', 'manual', true, true);

-- ===========================================================================
\echo ''
\echo '--- A call pays once per place ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'eve', false);

select test.check('the first call to a place pays',
  (case when public.log_call('88888888-0000-0000-0000-000000000b01') then 1 else 0 end)::bigint, 1::bigint);
select test.check('...10 points',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'call_service'), 10::bigint);
select test.check('calling the same place again pays nothing',
  (case when public.log_call('88888888-0000-0000-0000-000000000b01') then 1 else 0 end)::bigint, 0::bigint);
select test.check('...so it is still 10',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'call_service'), 10::bigint);

-- ===========================================================================
\echo ''
\echo '--- Five new places a day, then nothing ---'
-- ===========================================================================
select public.log_call('88888888-0000-0000-0000-000000000b02');
select public.log_call('88888888-0000-0000-0000-000000000b03');
select public.log_call('88888888-0000-0000-0000-000000000b04');
select public.log_call('88888888-0000-0000-0000-000000000b05');
select test.check('five places, five awards',
  (select count(*) from public.points_ledger where reason = 'call_service'), 5::bigint);
select test.check('a sixth new place the same day pays nothing',
  (case when public.log_call('88888888-0000-0000-0000-000000000b06') then 1 else 0 end)::bigint, 0::bigint);
select test.check('...and nothing was written for it',
  (select count(*) from public.points_ledger where reason = 'call_service'), 5::bigint);

-- ===========================================================================
\echo ''
\echo '--- Whose it is, and who is refused ---'
-- ===========================================================================
select test.check_raises_like('a place that does not exist is refused',
  $$select public.log_call('88888888-0000-0000-0000-0000000000ff')$$, '%PLACE_NOT_FOUND%');
select test.check_raises_like('a place Pam has not approved is refused',
  $$select public.log_call('88888888-0000-0000-0000-000000000bf0')$$, '%PLACE_NOT_FOUND%');

select set_config('request.jwt.claim.sub', :'fay', false);
select test.check('another member sees none of Eve''s points',
  (select count(*) from public.points_ledger), 0::bigint);
select test.check('Fay earns her own 10 for the same place',
  (case when public.log_call('88888888-0000-0000-0000-000000000b01') then 1 else 0 end)::bigint, 1::bigint);
select test.check_raises('a member cannot write their own points',
  $$insert into public.points_ledger (member_id, delta, reason) values ('99999999-0000-0000-0000-000000000b02', 500, 'call_service')$$);

select set_config('request.jwt.claim.sub', :'lead', false);
select test.check('a program lead''s tap is ignored, without an error',
  (case when public.log_call('88888888-0000-0000-0000-000000000b01') then 1 else 0 end)::bigint, 0::bigint);

reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('staff earned nothing',
  (select count(*) from public.points_ledger where member_id = :'lead'::uuid), 0::bigint);

reset role;
set role anon;
select test.check_raises('nobody signed in logs a call',
  $$select public.log_call('88888888-0000-0000-0000-000000000b01')$$);

\echo ''
\echo 'call points: all checks passed'
