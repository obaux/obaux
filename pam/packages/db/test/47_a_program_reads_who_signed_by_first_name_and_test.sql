-- A program reads who signed its policies, by first name and date, never the
-- picture (20261010150922, a25 point 1).

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set luis   '33333333-0000-0000-0000-00000000000e'
\set boss   'cccccccc-0000-0000-0000-000000004701'
\set lead1  'cccccccc-0000-0000-0000-000000004702'
\set lead2  'cccccccc-0000-0000-0000-000000004703'
\set org1   'dddddddd-0000-0000-0000-000000004701'
\set org2   'dddddddd-0000-0000-0000-000000004702'
\set prog1  'eeeeeeee-0000-0000-0000-000000004701'
\set prog2  'eeeeeeee-0000-0000-0000-000000004702'

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
insert into auth.users (id, phone) values (:'boss', '12675558971'), (:'lead1', '12675558972'), (:'lead2', '12675558973');
insert into public.orgs (id, name, type, region_id) values
  (:'org1', 'Who Org One', 'program', :'region_north'), (:'org2', 'Who Org Two', 'program', :'region_north');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, org_id) values
  (:'boss', 'super_admin', 'Bea', :'region_north', '+12675558971', 'active', null),
  (:'lead1', 'provider', 'Lou', :'region_north', '+12675558972', 'active', :'org1'),
  (:'lead2', 'provider', 'Lena', :'region_north', '+12675558973', 'active', :'org2');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Who Program One', 'workforce', '1 Who St', 'manual', false, true),
  (:'prog2', :'org2', 'Who Program Two', 'education', '2 Who St', 'manual', false, true);

set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select public.add_policy(:'prog1', 'Who Policy', jsonb_build_array(jsonb_build_object('path', :'prog1' || '/w.pdf', 'name', 'w.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)));
select set_config('request.jwt.claim.sub', :'lead2', false);
select public.add_policy(:'prog2', 'Other Policy', jsonb_build_array(jsonb_build_object('path', :'prog2' || '/o.pdf', 'name', 'o.pdf', 'content_type', 'application/pdf', 'size_bytes', 100)));
select set_config('request.jwt.claim.sub', :'tanya', false);
select public.sign_policy((select id from public.program_policies where title = 'Who Policy'), 'data:image/png;base64,eA==');
select set_config('request.jwt.claim.sub', :'luis', false);
select public.sign_policy((select id from public.program_policies where title = 'Who Policy'), 'data:image/png;base64,eQ==');
select public.sign_policy((select id from public.program_policies where title = 'Other Policy'), 'data:image/png;base64,eQ==');

-- ===========================================================================
\echo ''
\echo '--- A program reads its own signers: a first name and a date ---'
-- ===========================================================================
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('two people signed the program''s policy',
  (select count(*) from public.program_policy_signers(:'prog1')), 2::bigint);
select test.check('...named by first name, with the day',
  (select count(*) from public.program_policy_signers(:'prog1') where first_name in ('Tanya', 'Luis') and signed_at > now() - interval '1 minute'), 2::bigint);
select test.check('...and the function has no picture, phone or last name to give',
  (select count(*) from information_schema.parameters p join information_schema.routines r on r.specific_name = p.specific_name
   where r.routine_name = 'program_policy_signers' and p.parameter_mode = 'OUT'
     and p.parameter_name not in ('policy_id', 'member_id', 'first_name', 'signed_at')), 0::bigint);
select test.check('the lead still cannot read the table, so no picture',
  (select count(*) from public.policy_signatures), 0::bigint);

select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check_raises_like('another program''s lead cannot read this program''s signers',
  format($f$select * from public.program_policy_signers(%L)$f$, :'prog1'), '%PROGRAM_NOT_FOUND%');
select test.check('...but reads their own', (select count(*) from public.program_policy_signers(:'prog2')), 1::bigint);

select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot ask',
  format($f$select * from public.program_policy_signers(%L)$f$, :'prog1'), '%PROGRAM_NOT_FOUND%');

select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('a super admin can read any program''s', (select count(*) from public.program_policy_signers(:'prog1')), 2::bigint);

reset role;
set role anon;
select test.check_raises('nobody signed out can ask', format($f$select * from public.program_policy_signers(%L)$f$, :'prog1'));

\echo ''
\echo 'who signed: all checks passed'
