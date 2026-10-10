-- approving a staff request for an existing member (test 50).
--
-- Claimed 2026-10-10 on `claude/places-programs-approve-existing-member` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set region_south '11111111-0000-0000-0000-000000000002'
\set boss    'cccccccc-0000-0000-0000-000000005001'
\set m_prog  'cccccccc-0000-0000-0000-000000005002'
\set m_bare  'cccccccc-0000-0000-0000-000000005003'
\set m_case  'cccccccc-0000-0000-0000-000000005004'
\set m_city  'cccccccc-0000-0000-0000-000000005005'
\set newbie  'cccccccc-0000-0000-0000-000000005006'
\set tanya   '33333333-0000-0000-0000-00000000000d'

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
  (:'boss', '12675558501'), (:'m_prog', '12675558502'), (:'m_bare', '12675558503'),
  (:'m_case', '12675558504'), (:'m_city', '12675558505'), (:'newbie', '12675558506');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'boss', 'super_admin', 'Bea', :'region_north', '+12675558501', 'active'),
  (:'m_prog', 'member', 'Mo', :'region_north', '+12675558502', 'active'),
  (:'m_bare', 'member', 'Bo', :'region_north', '+12675558503', 'active'),
  (:'m_case', 'member', 'Cass', :'region_north', '+12675558504', 'active'),
  (:'m_city', 'member', 'Cy', :'region_north', '+12675558505', 'active');
-- They asked to lead a program first, and became members after (the live case).
insert into public.staff_requests (
  user_id, wants_role, first_name, last_name, city,
  program_name, program_category, program_description, program_address, program_phone
) values
  (:'m_prog', 'provider', 'Mo', 'Ames', 'North', 'Mo''s Maker Space', 'education', 'Open bench.', '4 Oak St', '+12675550188'),
  (:'m_bare', 'provider', 'Bo', 'Hart', 'North', null, null, null, null, null),
  (:'m_case', 'admin', 'Cass', 'Dole', 'North', null, null, null, null, null),
  (:'m_city', 'provider', 'Cy', 'Ford', 'South', null, null, null, null, null),
  (:'newbie', 'provider', 'Nia', 'Lowe', 'North', 'Nia''s Nook', 'education', 'Quiet study.', '5 Pine St', '+12675550177');

-- ===========================================================================
\echo ''
\echo '--- Not a super admin ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot decide a request',
  format($f$select public.review_staff_request(%L, 'approved', %L)$f$, :'m_prog', :'region_north'), '%super admin%');

-- ===========================================================================
\echo ''
\echo '--- A member whose provider request waited is approved ---'
-- ===========================================================================
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'m_prog', 'approved', :'region_north');
select public.review_staff_request(:'m_bare', 'approved', :'region_north');

reset role;
select test.check('...holds both roles', (select count(*) from public.profile_roles where profile_id = :'m_prog'::uuid), 2::bigint);
select test.check('...the provider role was granted by the super admin',
  (select count(*) from public.profile_roles where profile_id = :'m_prog'::uuid and role = 'provider' and granted_by = :'boss'::uuid), 1::bigint);
select test.check('...and the role they act as is provider',
  (select count(*) from public.profiles where id = :'m_prog'::uuid and role = 'provider'), 1::bigint);
select test.check('...with their own city kept',
  (select count(*) from public.profiles where id = :'m_prog'::uuid and region_id = :'region_north'::uuid), 1::bigint);
select test.check('...the request is decided',
  (select count(*) from public.staff_requests where user_id = :'m_prog'::uuid and decision = 'approved' and reviewed_by = :'boss'::uuid), 1::bigint);
select test.check('...it is audited as added to an existing account',
  (select count(*) from public.audit_log where action = 'staff_request.approve' and target_id = :'m_prog'::uuid
     and meta->>'added_to_existing' = 'true'), 1::bigint);
select test.check('...and the approved text is queued',
  (select count(*) from public.outbound_messages where member_id = :'m_prog'::uuid and template_key = 'staff_request_approved'), 1::bigint);
select test.check('...their program details became an org they belong to',
  (select count(*) from public.profiles p join public.orgs o on o.id = p.org_id where p.id = :'m_prog'::uuid and o.name = 'Mo''s Maker Space'), 1::bigint);

set role authenticated;
select set_config('request.jwt.claim.sub', :'m_prog', false);
select test.check('...and they read their own program',
  (select count(*) from public.services where name = 'Mo''s Maker Space'), 1::bigint);
select test.check('...they still hold the member role to switch back to',
  (select count(*) from public.profile_roles where profile_id = :'m_prog'::uuid and role = 'member'), 1::bigint);

reset role;
select test.check('a request with no program details adds the role and makes no org',
  (select count(*) from public.profiles where id = :'m_bare'::uuid and role = 'provider' and org_id is null), 1::bigint);

-- ===========================================================================
\echo ''
\echo '--- Refused with a code that says why ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check_raises_like('a member asking to be a case manager is refused with ROLE_PAIR_NOT_ALLOWED',
  format($f$select public.review_staff_request(%L, 'approved', %L)$f$, :'m_case', :'region_north'), '%ROLE_PAIR_NOT_ALLOWED%');
select test.check_raises_like('an account in another city than the one chosen is refused with ACCOUNT_IN_OTHER_CITY',
  format($f$select public.review_staff_request(%L, 'approved', %L)$f$, :'m_city', :'region_south'), '%ACCOUNT_IN_OTHER_CITY%');
reset role;
select test.check('...and the refused requests are still undecided',
  (select count(*) from public.staff_requests where user_id in (:'m_case'::uuid, :'m_city'::uuid) and decision is null), 2::bigint);
select test.check('...and nothing was added to their accounts',
  (select count(*) from public.profile_roles where profile_id in (:'m_case'::uuid, :'m_city'::uuid) and role <> 'member'), 0::bigint);

set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check_raises_like('a request already decided is still refused',
  format($f$select public.review_staff_request(%L, 'approved', %L)$f$, :'m_prog', :'region_north'), '%REQUEST_ALREADY_DECIDED%');
select public.review_staff_request(:'m_case', 'denied', null);
reset role;
select test.check('denying a request from an existing account still works',
  (select count(*) from public.staff_requests where user_id = :'m_case'::uuid and decision = 'denied'), 1::bigint);

-- ===========================================================================
\echo ''
\echo '--- Someone with no profile: unchanged ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'newbie', 'approved', :'region_north');
reset role;
select test.check('a new account is made with the role asked for, one role only',
  (select count(*) from public.profile_roles where profile_id = :'newbie'::uuid), 1::bigint);
select test.check('...with its org and program',
  (select count(*) from public.profiles p join public.services s on s.org_id = p.org_id where p.id = :'newbie'::uuid and p.role = 'provider' and s.name = 'Nia''s Nook'), 1::bigint);
select test.check('...audited without the existing-account flag',
  (select count(*) from public.audit_log where action = 'staff_request.approve' and target_id = :'newbie'::uuid and meta ? 'added_to_existing'), 0::bigint);

\echo ''
\echo 'approving for an existing member: all checks passed'
