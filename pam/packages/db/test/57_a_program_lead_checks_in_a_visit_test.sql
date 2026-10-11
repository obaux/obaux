-- a program lead checks in a visit (test 57).
--
-- Claimed 2026-10-11 on `claude/places-programs-attendance-b-checkin` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set luis   '33333333-0000-0000-0000-00000000000e'
\set boss   'cccccccc-0000-0000-0000-000000005701'
\set lead1  'cccccccc-0000-0000-0000-000000005702'
\set lead2  'cccccccc-0000-0000-0000-000000005703'
\set leadp  'cccccccc-0000-0000-0000-000000005704'
\set org1   'dddddddd-0000-0000-0000-000000005701'
\set org2   'dddddddd-0000-0000-0000-000000005702'
\set prog1  'eeeeeeee-0000-0000-0000-000000005701'
\set prog2  'eeeeeeee-0000-0000-0000-000000005702'

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
  (:'boss', '12675558571'), (:'lead1', '12675558572'), (:'lead2', '12675558573'), (:'leadp', '12675558574');
insert into public.orgs (id, name, type, region_id) values
  (:'org1', 'Checkin Org One', 'program', :'region_north'), (:'org2', 'Checkin Org Two', 'program', :'region_north');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'boss', 'super_admin', 'Bea', null, :'region_north', '+12675558571', 'active', null),
  (:'lead1', 'provider', 'Lou', null, :'region_north', '+12675558572', 'active', :'org1'),
  (:'lead2', 'provider', 'Lena', null, :'region_north', '+12675558573', 'active', :'org2'),
  (:'leadp', 'provider', 'Pax', null, :'region_north', '+12675558574', 'limited', :'org1');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Checkin Program One', 'workforce', '1 Check St', 'manual', false, true),
  (:'prog2', :'org2', 'Checkin Program Two', 'education', '2 Check St', 'manual', false, true);
-- v_now: under way; v_other: at program two; v_cancel; v_far: next month; v_old: 20 days ago; v_late: 5 days ago.
insert into public.appointments (id, member_id, service_id, starts_at, ends_at, status) values
  ('aaaaaaaa-0000-0000-0000-000000005701', :'tanya', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005702', :'tanya', :'prog2', now() - interval '30 minutes', now() + interval '30 minutes', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005703', :'tanya', :'prog1', now() - interval '30 minutes', now() + interval '30 minutes', 'cancelled'),
  ('aaaaaaaa-0000-0000-0000-000000005704', :'tanya', :'prog1', now() + interval '30 days', now() + interval '30 days 1 hour', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005705', :'tanya', :'prog1', now() - interval '20 days', now() - interval '20 days' + interval '1 hour', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000005706', :'luis',  :'prog1', now() - interval '5 days', now() - interval '5 days' + interval '1 hour', 'scheduled');
create function pg_temp.pts(m uuid) returns bigint language sql as $$
  select coalesce(sum(delta), 0) from public.points_ledger where member_id = m and subject_id::text like 'aaaaaaaa-0000-0000-0000-0000000057%'
$$;

\echo ''
\echo '--- A lead checks a member in ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('the lead''s here marks the visit attended and pays 100',
  (select points from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005701')), 100);
reset role;
select test.check('...the visit is attended, by the lead, with a time',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005701' and status = 'attended' and attendance_method = 'provider_checkin' and checked_in_at is not null), 1::bigint);
select test.check('...the ledger holds one row of 100', pg_temp.pts(:'tanya'), 100::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('tapping here again pays nothing more',
  (select points from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005701')), 0);
reset role;
select test.check('...still one row', pg_temp.pts(:'tanya'), 100::bigint);
select test.check('...and one audit row', (select count(*) from public.audit_log where action = 'visit.check_in' and target_id = 'aaaaaaaa-0000-0000-0000-000000005701'), 1::bigint);

\echo ''
\echo '--- Who cannot ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check_raises_like('another program''s lead cannot check in this program''s visit',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005706')$f$, '%VISIT_NOT_FOUND%');
select test.check_raises_like('...and cannot undo it',
  $f$select * from public.undo_check_in('aaaaaaaa-0000-0000-0000-000000005701')$f$, '%VISIT_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check_raises_like('a lead cannot pay a member at another program',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005702')$f$, '%VISIT_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot check themselves in',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005706')$f$, '%NOT_A_PROGRAM_LEAD%');
select test.check_raises_like('...not even at their own visit',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005702')$f$, '%NOT_A_PROGRAM_LEAD%');
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check_raises_like('a super admin is not a program lead',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005706')$f$, '%NOT_A_PROGRAM_LEAD%');
select set_config('request.jwt.claim.sub', :'leadp', false);
select test.check_raises_like('a lead whose access is limited cannot',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005706')$f$, '%ACCOUNT_NOT_ACTIVE%');
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check_raises_like('a cancelled visit is refused',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005703')$f$, '%VISIT_CANCELLED%');
select test.check_raises_like('a visit weeks away is refused',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005704')$f$, '%OUTSIDE_THE_VISIT_WINDOW%');
select test.check_raises_like('a visit more than 14 days ago is refused',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005705')$f$, '%OUTSIDE_THE_VISIT_WINDOW%');
select test.check_raises_like('a visit that does not exist is refused',
  $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-0000000057ff')$f$, '%VISIT_NOT_FOUND%');
reset role;
set role anon;
select test.check_raises('nobody signed out can', $f$select * from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005701')$f$);
select test.check_raises('...or undo', $f$select * from public.undo_check_in('aaaaaaaa-0000-0000-0000-000000005701')$f$);
reset role;
select test.check('none of the refusals moved a point', pg_temp.pts(:'tanya'), 100::bigint);

\echo ''
\echo '--- Taking it back ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('undo takes the 100 back by a reversing row',
  (select points from public.undo_check_in('aaaaaaaa-0000-0000-0000-000000005701')), -100);
reset role;
select test.check('...the visit is scheduled again, with no check-in',
  (select count(*) from public.appointments where id = 'aaaaaaaa-0000-0000-0000-000000005701' and status = 'scheduled' and checked_in_at is null and attendance_method is null), 1::bigint);
select test.check('...the total is 0 and the award row is still there (append-only)', pg_temp.pts(:'tanya'), 0::bigint);
select test.check('...with two rows, not one',
  (select count(*) from public.points_ledger where subject_id = 'aaaaaaaa-0000-0000-0000-000000005701'), 2::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('undoing again takes nothing more',
  (select points from public.undo_check_in('aaaaaaaa-0000-0000-0000-000000005701')), 0);
reset role;
select test.check('...the total is still 0', pg_temp.pts(:'tanya'), 0::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('checking in again after an undo gives the points back once',
  (select points from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005701')), 100);
select public.undo_check_in('aaaaaaaa-0000-0000-0000-000000005701');
select test.check('...and a second round pays and takes nothing',
  (select points from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005701')), 0);
reset role;
select test.check('...so the total is 100', pg_temp.pts(:'tanya'), 100::bigint);
select test.check('...and the ledger has three rows for the visit',
  (select count(*) from public.points_ledger where subject_id = 'aaaaaaaa-0000-0000-0000-000000005701'), 3::bigint);

\echo ''
\echo '--- A visit from 5 days ago can still be marked; another member is paid separately ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('a visit 5 days ago can be checked in',
  (select points from public.check_in_visit('aaaaaaaa-0000-0000-0000-000000005706')), 100);
reset role;
select test.check('...paying Luis', pg_temp.pts(:'luis'), 100::bigint);
select test.check('...and Tanya is where she was', pg_temp.pts(:'tanya'), 100::bigint);

\echo ''
\echo 'check-in: all checks passed'
