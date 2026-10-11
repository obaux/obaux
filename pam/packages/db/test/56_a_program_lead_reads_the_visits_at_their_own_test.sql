-- a program lead reads the visits at their own program (test 56).
--
-- Claimed 2026-10-11 on `claude/places-programs-attendance-a-visits` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set luis   '33333333-0000-0000-0000-00000000000e'
\set boss   'cccccccc-0000-0000-0000-000000005601'
\set lead1  'cccccccc-0000-0000-0000-000000005602'
\set lead2  'cccccccc-0000-0000-0000-000000005603'
\set leadp  'cccccccc-0000-0000-0000-000000005604'
\set org1   'dddddddd-0000-0000-0000-000000005601'
\set org2   'dddddddd-0000-0000-0000-000000005602'
\set prog1  'eeeeeeee-0000-0000-0000-000000005601'
\set prog2  'eeeeeeee-0000-0000-0000-000000005602'
\set svc1   '77777777-0000-0000-0000-000000005601'

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
  (:'boss', '12675558561'), (:'lead1', '12675558562'), (:'lead2', '12675558563'), (:'leadp', '12675558564');
insert into public.orgs (id, name, type, region_id) values
  (:'org1', 'Visits Org One', 'program', :'region_north'), (:'org2', 'Visits Org Two', 'program', :'region_north');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'boss', 'super_admin', 'Bea', null, :'region_north', '+12675558561', 'active', null),
  (:'lead1', 'provider', 'Lou', null, :'region_north', '+12675558562', 'active', :'org1'),
  (:'lead2', 'provider', 'Lena', null, :'region_north', '+12675558563', 'active', :'org2'),
  (:'leadp', 'provider', 'Pax', null, :'region_north', '+12675558564', 'limited', :'org1');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Visits Program One', 'workforce', '1 Visit St', 'manual', false, true),
  (:'prog2', :'org2', 'Visits Program Two', 'education', '2 Visit St', 'manual', false, true);
insert into public.program_services (id, service_id, name) values (:'svc1', :'prog1', 'GED class');
-- Tanya and Luis planned visits at program one, Tanya another at program two, Luis cancelled one.
insert into public.appointments (member_id, service_id, program_service_id, starts_at, status) values
  (:'tanya', :'prog1', :'svc1', now() + interval '2 days', 'scheduled'),
  (:'luis',  :'prog1', null,    now() + interval '3 days', 'scheduled'),
  (:'luis',  :'prog1', null,    now() + interval '4 days', 'cancelled'),
  (:'tanya', :'prog2', null,    now() + interval '2 days', 'scheduled'),
  (:'tanya', :'prog1', null,    now() - interval '3 days', 'scheduled'),
  (:'tanya', :'prog1', null,    now() + interval '400 days', 'scheduled');
update public.appointments set status = 'attended', attendance_method = 'provider_checkin', checked_in_at = starts_at where starts_at < now() and service_id = :'prog1'::uuid;

\echo ''
\echo '--- A lead reads the visits at their own program ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('two coming up and one past, not the cancelled one, not the one far away, not another program''s',
  (select count(*) from public.my_program_visits()), 3::bigint);
select test.check('...named by first name',
  (select count(*) from public.my_program_visits() where first_name in ('Tanya', 'Luis')), 3::bigint);
select test.check('...with the service they picked',
  (select count(*) from public.my_program_visits() where service_name = 'GED class'), 1::bigint);
select test.check('...and whether they were checked in',
  (select count(*) from public.my_program_visits() where status = 'attended' and checked_in_at is not null), 1::bigint);
select test.check('the function gives nothing but a first name of the member: no phone, last name or address column',
  (select count(*) from information_schema.parameters p join information_schema.routines r on r.specific_name = p.specific_name
   where r.routine_name = 'my_program_visits' and p.parameter_mode = 'OUT'
     and p.parameter_name not in ('appointment_id', 'member_id', 'first_name', 'starts_at', 'ends_at', 'status', 'service_name', 'checked_in_at')), 0::bigint);
select test.check('a window wider than 180 days is cut: the visit 400 days away is still not in it',
  (select count(*) from public.my_program_visits(now() - interval '400 days', now() + interval '800 days') where starts_at > now() + interval '300 days'), 0::bigint);

\echo ''
\echo '--- Whose it is ---'
select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check('another program''s lead reads only their own program''s visit',
  (select count(*) from public.my_program_visits()), 1::bigint);
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot ask', $f$select * from public.my_program_visits()$f$, '%NOT_A_PROGRAM_LEAD%');
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check_raises_like('a super admin is not a program lead', $f$select * from public.my_program_visits()$f$, '%NOT_A_PROGRAM_LEAD%');
select set_config('request.jwt.claim.sub', :'leadp', false);
select test.check_raises_like('a lead whose access is limited cannot ask', $f$select * from public.my_program_visits()$f$, '%ACCOUNT_NOT_ACTIVE%');

reset role;
set role anon;
select test.check_raises('nobody signed out can ask', $f$select * from public.my_program_visits()$f$);

\echo ''
\echo 'program visits: all checks passed'
