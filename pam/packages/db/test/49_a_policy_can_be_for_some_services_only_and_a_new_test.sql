-- A policy can be only for some of a program's services, and a new version keeps
-- that (20261010151302, D-313 step 2).

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set lead1  'cccccccc-0000-0000-0000-000000004902'
\set lead2  'cccccccc-0000-0000-0000-000000004903'
\set org1   'dddddddd-0000-0000-0000-000000004901'
\set org2   'dddddddd-0000-0000-0000-000000004902'
\set prog1  'eeeeeeee-0000-0000-0000-000000004901'
\set prog2  'eeeeeeee-0000-0000-0000-000000004902'
\set svcA   '77777777-0000-0000-0000-000000004901'
\set svcB   '77777777-0000-0000-0000-000000004902'
\set svcX   '77777777-0000-0000-0000-000000004903'

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
insert into auth.users (id, phone) values (:'lead1', '12675558981'), (:'lead2', '12675558982');
insert into public.orgs (id, name, type, region_id) values
  (:'org1', 'Scope Org One', 'program', :'region_north'), (:'org2', 'Scope Org Two', 'program', :'region_north');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, org_id) values
  (:'lead1', 'provider', 'Lou', :'region_north', '+12675558981', 'active', :'org1'),
  (:'lead2', 'provider', 'Lena', :'region_north', '+12675558982', 'active', :'org2');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Scope Program One', 'workforce', '1 Scope St', 'manual', false, true),
  (:'prog2', :'org2', 'Scope Program Two', 'education', '2 Scope St', 'manual', false, true);
insert into public.program_services (id, service_id, name) values
  (:'svcA', :'prog1', 'GED class'), (:'svcB', :'prog1', 'Computer room'), (:'svcX', :'prog2', 'Other program service');

set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select public.add_policy(:'prog1', 'Scope Conduct', jsonb_build_array(jsonb_build_object('path', :'prog1' || '/a.pdf', 'name', 'a.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)));
select public.add_policy(:'prog1', 'Scope Everyone', jsonb_build_array(jsonb_build_object('path', :'prog1' || '/b.pdf', 'name', 'b.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)));

-- ===========================================================================
\echo ''
\echo '--- A lead says which services a policy is only for ---'
-- ===========================================================================
select test.check('a new policy is for everyone: it names no service',
  (select count(*) from public.program_policy_services), 0::bigint);
select public.set_policy_services((select id from public.program_policies where title = 'Scope Conduct'), array[:'svcA'::uuid]);
select test.check('now it is only for the GED class',
  (select count(*) from public.program_policy_services s join public.program_policies p on p.id = s.policy_id
   where p.title = 'Scope Conduct' and s.program_service_id = :'svcA'::uuid), 1::bigint);
select public.set_policy_services((select id from public.program_policies where title = 'Scope Conduct'), array[:'svcA'::uuid, :'svcA'::uuid, :'svcB'::uuid]);
select test.check('naming a service twice counts once; two services now',
  (select count(*) from public.program_policy_services), 2::bigint);
select test.check_raises_like('another program''s service cannot be named',
  format($f$select public.set_policy_services(%L, array[%L::uuid])$f$, (select id from public.program_policies where title = 'Scope Conduct'), :'svcX'), '%SERVICE_NOT_FOUND%');
select test.check('...and nothing changed when it was refused',
  (select count(*) from public.program_policy_services), 2::bigint);

-- A new version keeps the scope.
select public.add_policy(:'prog1', 'Scope Conduct', jsonb_build_array(jsonb_build_object('path', :'prog1' || '/a2.pdf', 'name', 'a2.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)),
                         (select id from public.program_policies where title = 'Scope Conduct' and version = 1));
select test.check('a new version is asked of the same two services',
  (select count(*) from public.program_policy_services s join public.program_policies p on p.id = s.policy_id
   where p.title = 'Scope Conduct' and p.version = 2 and p.archived_at is null), 2::bigint);
select test.check_raises_like('the replaced version can no longer be scoped',
  format($f$select public.set_policy_services(%L, '{}')$f$, (select id from public.program_policies where title = 'Scope Conduct' and version = 1)), '%POLICY_ALREADY_REMOVED%');

-- Back to everyone.
select public.set_policy_services((select id from public.program_policies where title = 'Scope Conduct' and version = 2), '{}');
select test.check('an empty list makes it everyone''s again',
  (select count(*) from public.program_policy_services s join public.program_policies p on p.id = s.policy_id
   where p.title = 'Scope Conduct' and p.version = 2), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- Whose it is ---'
-- ===========================================================================
select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check_raises_like('another program''s lead cannot scope it',
  format($f$select public.set_policy_services(%L, '{}')$f$, (select id from public.program_policies where title = 'Scope Everyone')), '%POLICY_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot',
  format($f$select public.set_policy_services(%L, '{}')$f$, (select id from public.program_policies where title = 'Scope Everyone')), '%NOT_A_PROGRAM_LEAD%');
select test.check_raises('nobody writes the table directly',
  format($f$insert into public.program_policy_services values (%L, %L)$f$, (select id from public.program_policies where title = 'Scope Everyone'), :'svcA'));

select set_config('request.jwt.claim.sub', :'lead1', false);
select public.set_policy_services((select id from public.program_policies where title = 'Scope Everyone'), array[:'svcB'::uuid]);
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check('a member reads which services a current policy is for (so their screens know what to ask)',
  (select count(*) from public.program_policy_services), 1::bigint);

-- A service taken off: the policy stops naming it.
reset role;
delete from public.program_services where id = :'svcB';
select test.check('taking the service off drops it from every policy''s scope',
  (select count(*) from public.program_policy_services where program_service_id = :'svcB'::uuid), 0::bigint);

-- ===========================================================================
\echo ''
\echo '--- Three small fixes after part 1 ---'
-- ===========================================================================
reset role;
select set_config('request.jwt.claim.sub', '', false);
-- At the 30-policy cap a lead can still replace one (the replaced does not count).
insert into public.program_policies (service_id, title, version, created_by)
select :'prog2', 'Cap ' || g, 1, :'lead2' from generate_series(1, 30) g;
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check_raises_like('a 31st policy is refused',
  format($f$select public.add_policy(%L, 'One too many', %L::jsonb)$f$, :'prog2',
    jsonb_build_array(jsonb_build_object('path', :'prog2' || '/c.pdf', 'name', 'c.pdf', 'content_type', 'application/pdf', 'size_bytes', 100))::text),
  '%TOO_MANY_POLICIES%');
select test.check('at 30 a lead can still replace one with a new version',
  (select version from public.add_policy(:'prog2', 'Cap 1', jsonb_build_array(jsonb_build_object('path', :'prog2' || '/d.pdf', 'name', 'd.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)),
    (select id from public.program_policies where title = 'Cap 1' and archived_at is null))), 2);

-- A lead whose access is limited cannot change a policy's scope.
reset role;
update public.profiles set access_status = 'limited' where id = :'lead1';
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check_raises_like('a limited lead cannot scope a policy',
  format($f$select public.set_policy_services(%L, '{}')$f$, (select id from public.program_policies where title = 'Scope Everyone')), '%ACCOUNT_NOT_ACTIVE%');

reset role;
set role anon;
select test.check_raises('nobody signed out reads it', $$select * from public.program_policy_services$$);

\echo ''
\echo 'policy scope: all checks passed'
