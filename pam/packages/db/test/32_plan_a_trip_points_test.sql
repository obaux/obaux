-- Planning a trip earns 25 points, once per place (20261010115117).
--
-- Attacks the rule from every side: it pays once; cancelling and planning the
-- same place again pays nothing more, and cancelling takes nothing back; a
-- second place pays; a fourth new place in one day is saved but pays nothing;
-- moving a trip pays nothing; a program lead never earns; and a member cannot
-- write to the ledger or read another member's.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set ann   '99999999-0000-0000-0000-000000000901'
\set ben   '99999999-0000-0000-0000-000000000902'
\set lead  '99999999-0000-0000-0000-000000000903'
\set p1 '88888888-0000-0000-0000-000000000901'
\set p2 '88888888-0000-0000-0000-000000000902'
\set p3 '88888888-0000-0000-0000-000000000903'
\set p4 '88888888-0000-0000-0000-000000000904'

create or replace function test.philly(days integer, hour integer)
returns timestamptz
language sql
stable
as $$
  select (date_trunc('day', now() at time zone 'America/New_York')
          + make_interval(days => days, hours => hour)) at time zone 'America/New_York';
$$;
grant execute on function test.philly(integer, integer) to authenticated, anon, service_role;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'ann', '12675558801'), (:'ben', '12675558802'), (:'lead', '12675558803');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'ann', 'member', 'Ann', :'region_north', '+12675558801', 'active'),
  (:'ben', 'member', 'Ben', :'region_north', '+12675558802', 'active'),
  (:'lead', 'provider', 'Lia', :'region_north', '+12675558803', 'active');
insert into public.services (id, name, category, address, source, needs_review, is_active) values
  (:'p1', 'Place One', 'workforce', '1 Main St', 'manual', false, true),
  (:'p2', 'Place Two', 'workforce', '2 Main St', 'manual', false, true),
  (:'p3', 'Place Three', 'family_services', '3 Main St', 'manual', false, true),
  (:'p4', 'Place Four', 'family_services', '4 Main St', 'manual', false, true);

create or replace function test.plan_points(who uuid)
returns bigint language sql as $$
  select coalesce(sum(delta), 0) from public.points_ledger where member_id = who and reason = 'plan_trip'
$$;

-- ===========================================================================
\echo ''
\echo '--- It pays once, and cancelling takes nothing back ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'ann', false);

select public.book_trip(:'p1', test.philly(3, 10));
select test.check('planning a trip to a place pays 25',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'plan_trip'), 25::bigint);
select test.check('the award is for that place',
  (select count(*) from public.points_ledger where reason = 'plan_trip' and subject_id = :'p1'::uuid), 1::bigint);

do $$
declare t public.appointments;
begin
  select * into t from public.appointments where member_id = '99999999-0000-0000-0000-000000000901' limit 1;
  perform public.cancel_trip(t.id);
end;
$$;
select test.check('cancelling the trip takes nothing back',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'plan_trip'), 25::bigint);

select public.book_trip(:'p1', test.philly(4, 10));
select test.check('cancel and plan the same place again pays once, not twice',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'plan_trip'), 25::bigint);
select test.check('...and the second trip is still saved',
  (select count(*) from public.my_trips()), 1::bigint);

do $$
declare t public.appointments;
begin
  select * into t from public.appointments where member_id = '99999999-0000-0000-0000-000000000901' and status = 'scheduled';
  perform public.move_trip(t.id, test.philly(5, 10));
end;
$$;
select test.check('moving a trip pays nothing',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'plan_trip'), 25::bigint);

-- ===========================================================================
\echo ''
\echo '--- A second place pays; a fourth new place in a day does not ---'
-- ===========================================================================
select public.book_trip(:'p2', test.philly(3, 11));
select public.book_trip(:'p3', test.philly(3, 12));
select test.check('three places, three awards', (select count(*) from public.points_ledger where reason = 'plan_trip'), 3::bigint);
select public.book_trip(:'p4', test.philly(3, 13));
select test.check('a fourth new place the same day is still planned',
  (select count(*) from public.my_trips() where place_name = 'Place Four'), 1::bigint);
select test.check('...but pays nothing: three a day',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'plan_trip'), 75::bigint);

-- ===========================================================================
\echo ''
\echo '--- Nobody else is paid, and nobody writes the ledger ---'
-- ===========================================================================
select set_config('request.jwt.claim.sub', :'ben', false);
select test.check('another member sees none of Ann''s points',
  (select count(*) from public.points_ledger), 0::bigint);
select public.book_trip(:'p1', test.philly(3, 10));
select test.check('Ben earns his own 25 for the same place',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'plan_trip'), 25::bigint);
select test.check_raises('a member cannot write their own points',
  $$insert into public.points_ledger (member_id, delta, reason) values ('99999999-0000-0000-0000-000000000902', 500, 'plan_trip')$$);

select set_config('request.jwt.claim.sub', :'lead', false);
select test.check_raises('a program lead is not planning a trip, and is paid nothing',
  $$select public.book_trip('88888888-0000-0000-0000-000000000901', test.philly(3, 10))$$);

reset role;
select set_config('request.jwt.claim.sub', '', false);
select test.check('staff earned nothing',
  (select count(*) from public.points_ledger where member_id = :'lead'::uuid), 0::bigint);
select test.check('the totals: Ann 75, Ben 25',
  (select count(*) from public.points_ledger where reason = 'plan_trip' and member_id in (:'ann'::uuid, :'ben'::uuid)), 4::bigint);

\echo ''
\echo 'plan-a-trip points: all checks passed'
