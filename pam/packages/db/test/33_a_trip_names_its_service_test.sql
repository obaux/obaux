-- A trip can name the program service it is for (20261010121853, D-470).
--
-- The old door still works; the new one keeps the service; a service of
-- another program is refused; the points rule is unchanged; a removed service
-- leaves the trip standing; and only the caller reads their own.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set cat   '99999999-0000-0000-0000-000000000a01'
\set dan   '99999999-0000-0000-0000-000000000a02'
\set lead  '99999999-0000-0000-0000-000000000a03'
\set pa    '88888888-0000-0000-0000-000000000a01'
\set pb    '88888888-0000-0000-0000-000000000a02'
\set s1    '77777777-0000-0000-0000-000000000a01'
\set s2    '77777777-0000-0000-0000-000000000a02'
\set sb    '77777777-0000-0000-0000-000000000a03'

create or replace function test.philly(days integer, hour integer)
returns timestamptz language sql stable as $$
  select (date_trunc('day', now() at time zone 'America/New_York')
          + make_interval(days => days, hours => hour)) at time zone 'America/New_York';
$$;
grant execute on function test.philly(integer, integer) to authenticated, anon, service_role;

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'cat', '12675558811'), (:'dan', '12675558812'), (:'lead', '12675558813');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'cat', 'member', 'Cat', :'region_north', '+12675558811', 'active'),
  (:'dan', 'member', 'Dan', :'region_north', '+12675558812', 'active'),
  (:'lead', 'provider', 'Lia', :'region_north', '+12675558813', 'active');
insert into public.services (id, name, category, address, source, needs_review, is_active) values
  (:'pa', 'Program A', 'education', '1 Elm St', 'manual', false, true),
  (:'pb', 'Program B', 'education', '2 Elm St', 'manual', false, true);
insert into public.program_services (id, service_id, name) values
  (:'s1', :'pa', 'GED class'), (:'s2', :'pa', 'Computer room'), (:'sb', :'pb', 'Resume help');

-- ===========================================================================
\echo ''
\echo '--- The old door is unchanged; the new one keeps the service ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'cat', false);

select public.book_trip(:'pa', test.philly(3, 10));
select test.check('book_trip with the old four arguments still works and names no service',
  (select count(*) from public.appointments where program_service_id is null), 1::bigint);
select test.check('...and still pays the 25 points',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'plan_trip'), 25::bigint);

select public.book_trip_at_service(:'pa', test.philly(4, 10), :'s1', 'bring ID');
select test.check('a trip names the GED class',
  (select count(*) from public.my_trip_services() where service_name = 'GED class'), 1::bigint);
select test.check('...the second trip to the same place pays nothing more',
  (select coalesce(sum(delta), 0) from public.points_ledger where reason = 'plan_trip'), 25::bigint);
select test.check('...and the trip is saved as usual, with its note',
  (select count(*) from public.my_trips() where note = 'bring ID'), 1::bigint);

select test.check_raises_like('a service of another program is refused',
  $$select public.book_trip_at_service('88888888-0000-0000-0000-000000000a01', test.philly(5, 10), '77777777-0000-0000-0000-000000000a03')$$,
  '%SERVICE_NOT_FOUND%');
select test.check_raises_like('a service that does not exist is refused',
  $$select public.book_trip_at_service('88888888-0000-0000-0000-000000000a01', test.philly(5, 10), '77777777-0000-0000-0000-0000000000ff')$$,
  '%SERVICE_NOT_FOUND%');
select test.check('a refused trip saves nothing',
  (select count(*) from public.my_trips()), 2::bigint);

-- ===========================================================================
\echo ''
\echo '--- Whose is whose ---'
-- ===========================================================================
select set_config('request.jwt.claim.sub', :'dan', false);
select test.check('another member reads none of Cat''s trips'' services',
  (select count(*) from public.my_trip_services()), 0::bigint);
select test.check_raises('nobody writes the column straight to the table',
  $$update public.appointments set program_service_id = '77777777-0000-0000-0000-000000000a02'$$);

select set_config('request.jwt.claim.sub', :'lead', false);
select test.check_raises_like('a program lead is not planning a trip',
  $$select public.book_trip_at_service('88888888-0000-0000-0000-000000000a01', test.philly(3, 10), '77777777-0000-0000-0000-000000000a01')$$,
  '%NOT_A_MEMBER%');

reset role;
set role anon;
select test.check_raises('nobody signed in plans a trip',
  $$select public.book_trip_at_service('88888888-0000-0000-0000-000000000a01', test.philly(3, 10))$$);
select test.check_raises('nobody signed in reads trip services',
  $$select * from public.my_trip_services()$$);

-- ===========================================================================
\echo ''
\echo '--- A service taken off leaves the visit standing ---'
-- ===========================================================================
reset role;
select set_config('request.jwt.claim.sub', '', false);
delete from public.program_services where id = :'s1';
select test.check('the trip is still there',
  (select count(*) from public.appointments where member_id = :'cat'::uuid and status = 'scheduled'), 2::bigint);
select test.check('...naming no service any more',
  (select count(*) from public.appointments where member_id = :'cat'::uuid and program_service_id is not null), 0::bigint);

\echo ''
\echo 'trip service: all checks passed'
