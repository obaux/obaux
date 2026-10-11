-- a lead sees which marks are the member's own (test 60).
--
-- Claimed 2026-10-11 on `claude/places-programs-im-here` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set boss   'cccccccc-0000-0000-0000-000000006001'
\set lead1  'cccccccc-0000-0000-0000-000000006002'
\set lead2  'cccccccc-0000-0000-0000-000000006003'
\set org1   'dddddddd-0000-0000-0000-000000006001'
\set org2   'dddddddd-0000-0000-0000-000000006002'
\set prog1  'eeeeeeee-0000-0000-0000-000000006001'
\set prog2  'eeeeeeee-0000-0000-0000-000000006002'

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
insert into auth.users (id, phone) values (:'boss', '12675558601'), (:'lead1', '12675558602'), (:'lead2', '12675558603');
insert into public.orgs (id, name, type, region_id) values
  (:'org1', 'Own Marks Org One', 'program', :'region_north'), (:'org2', 'Own Marks Org Two', 'program', :'region_north');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'boss', 'super_admin', 'Bea', null, :'region_north', '+12675558601', 'active', null),
  (:'lead1', 'provider', 'Lou', null, :'region_north', '+12675558602', 'active', :'org1'),
  (:'lead2', 'provider', 'Lena', null, :'region_north', '+12675558603', 'active', :'org2');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Own Marks Program One', 'workforce', '1 Mark St', 'manual', false, true),
  (:'prog2', :'org2', 'Own Marks Program Two', 'education', '2 Mark St', 'manual', false, true);
-- 1 the member marked by position; 2 by word; 3 the lead marked; 4 not marked; 5 the member marked at program two.
insert into public.appointments (id, member_id, service_id, starts_at, status, created_at) values
  ('aaaaaaaa-0000-0000-0000-000000006001', :'tanya', :'prog1', now() - interval '1 day', 'scheduled', now() - interval '3 days'),
  ('aaaaaaaa-0000-0000-0000-000000006002', :'tanya', :'prog1', now() - interval '2 days', 'scheduled', now() - interval '3 days'),
  ('aaaaaaaa-0000-0000-0000-000000006003', :'tanya', :'prog1', now() - interval '3 days', 'scheduled', now() - interval '4 days'),
  ('aaaaaaaa-0000-0000-0000-000000006004', :'tanya', :'prog1', now() + interval '1 day', 'scheduled', now() - interval '3 days'),
  ('aaaaaaaa-0000-0000-0000-000000006005', :'tanya', :'prog2', now() - interval '1 day', 'scheduled', now() - interval '3 days');
update public.appointments set status = 'attended', checked_in_at = starts_at, attendance_method = 'geofence' where id = 'aaaaaaaa-0000-0000-0000-000000006001';
update public.appointments set status = 'attended', checked_in_at = starts_at, attendance_method = 'sms_reply' where id = 'aaaaaaaa-0000-0000-0000-000000006002';
update public.appointments set status = 'attended', checked_in_at = starts_at, attendance_method = 'provider_checkin' where id = 'aaaaaaaa-0000-0000-0000-000000006003';
update public.appointments set status = 'attended', checked_in_at = starts_at, attendance_method = 'geofence' where id = 'aaaaaaaa-0000-0000-0000-000000006005';

\echo ''
\echo '--- A lead sees which marks the member made themselves ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('the two the member marked themselves, by position and by word',
  (select count(*) from public.my_program_own_marks() where my_program_own_marks in ('aaaaaaaa-0000-0000-0000-000000006001', 'aaaaaaaa-0000-0000-0000-000000006002')), 2::bigint);
select test.check('...and nothing else: not the lead''s own mark, not the unmarked visit, not another program''s',
  (select count(*) from public.my_program_own_marks() where my_program_own_marks in ('aaaaaaaa-0000-0000-0000-000000006003', 'aaaaaaaa-0000-0000-0000-000000006004', 'aaaaaaaa-0000-0000-0000-000000006005')), 0::bigint);
select test.check('the function returns ids only: one column, a uuid',
  (select count(*) from information_schema.parameters p join information_schema.routines r on r.specific_name = p.specific_name
   where r.routine_name = 'my_program_own_marks' and p.parameter_mode = 'OUT'), 0::bigint);
select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check('another program''s lead sees only their own program''s',
  (select count(*) from public.my_program_own_marks() where my_program_own_marks = 'aaaaaaaa-0000-0000-0000-000000006005'), 1::bigint);
select test.check('...and none of the first program''s',
  (select count(*) from public.my_program_own_marks() where my_program_own_marks in ('aaaaaaaa-0000-0000-0000-000000006001', 'aaaaaaaa-0000-0000-0000-000000006002')), 0::bigint);
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot ask', $f$select * from public.my_program_own_marks()$f$, '%NOT_A_PROGRAM_LEAD%');
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check_raises_like('a super admin is not a program lead', $f$select * from public.my_program_own_marks()$f$, '%NOT_A_PROGRAM_LEAD%');
reset role;
set role anon;
select test.check_raises('nobody signed out can ask', $f$select * from public.my_program_own_marks()$f$);
reset role;

\echo ''
\echo 'own marks: all checks passed'
