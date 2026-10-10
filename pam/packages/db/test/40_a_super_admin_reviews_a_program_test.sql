-- A super admin reviews a program the lead sent (20261010134145), and the
-- programs that predate the review record get one (20261010134146).
--
-- Attacks: only a super admin decides; approve is only from in_review, makes a
-- first listing live and applies exactly the four fields of a change; a note is
-- required to ask for changes; only a withdrawn submission can be discarded; a
-- decision on a closed one is refused; the review list carries a first name and
-- nothing else; a listing approved by hand closes its submission; and the
-- backfill is idempotent and writes one row per org-owned program.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set tanya  '33333333-0000-0000-0000-00000000000d'
\set boss   'cccccccc-0000-0000-0000-000000004001'
\set lead1  'cccccccc-0000-0000-0000-000000004002'
\set lead2  'cccccccc-0000-0000-0000-000000004003'
\set lead3  'cccccccc-0000-0000-0000-000000004004'
\set cm     'cccccccc-0000-0000-0000-000000004005'
\set org3   'dddddddd-0000-0000-0000-000000004003'
\set live3  'eeeeeeee-0000-0000-0000-000000004003'
\set old_org  'dddddddd-0000-0000-0000-000000004009'
\set old_live 'eeeeeeee-0000-0000-0000-000000004009'
\set old_wait 'eeeeeeee-0000-0000-0000-00000000400a'
\set old_wait_org 'dddddddd-0000-0000-0000-00000000400a'

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
  (:'boss', '12675558901'), (:'lead1', '12675558902'), (:'lead2', '12675558903'),
  (:'lead3', '12675558904'), (:'cm', '12675558905');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'boss', 'super_admin', 'Bea', :'region_north', '+12675558901', 'active'),
  (:'lead1', 'provider', 'Lou', :'region_north', '+12675558902', 'active'),
  (:'lead2', 'provider', 'Lena', :'region_north', '+12675558903', 'active'),
  (:'lead3', 'provider', 'Lia', :'region_north', '+12675558904', 'active'),
  (:'cm', 'admin', 'Cam', :'region_north', '+12675558905', 'active');

-- Lead 3 already has a live program (put on file the old way).
insert into public.orgs (id, name, type, region_id) values (:'org3', 'Lia Program', 'program', :'region_north');
update public.profiles set org_id = :'org3' where id = :'lead3';
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active)
values (:'live3', :'org3', 'Old Name', 'workforce', '1 Old St', 'manual', false, true);

set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select public.submit_program('Fresh One', 'workforce', null, 'Classes.', '5 New St');
select set_config('request.jwt.claim.sub', :'lead2', false);
select public.submit_program('Fresh Two', 'education');
select set_config('request.jwt.claim.sub', :'lead3', false);
select public.request_program_change(:'live3', 'New Name', 'education', null, '2 New St');
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ===========================================================================
\echo ''
\echo '--- Only a super admin decides ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check_raises_like('a program lead cannot approve their own',
  format($f$select public.review_program_submission(%L, 'approved')$f$, (select id from public.program_submissions where details->>'name' = 'Fresh One')),
  '%ONLY_A_SUPER_ADMIN%');
select test.check_raises_like('...nor read the review list',
  $$select * from public.programs_to_check()$$, '%ONLY_A_SUPER_ADMIN%');
select set_config('request.jwt.claim.sub', :'cm', false);
select test.check_raises_like('an admin who is not a super admin cannot decide',
  format($f$select public.review_program_submission(%L, 'approved')$f$, (select id from public.program_submissions where details->>'name' = 'Fresh One')),
  '%ONLY_A_SUPER_ADMIN%');
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot decide',
  $$select public.review_program_submission('00000000-0000-0000-0000-000000000000', 'approved')$$, '%ONLY_A_SUPER_ADMIN%');
reset role;
set role anon;
select test.check_raises('nobody signed in can decide', $$select public.review_program_submission('00000000-0000-0000-0000-000000000000', 'approved')$$);

-- ===========================================================================
\echo ''
\echo '--- The review list ---'
-- ===========================================================================
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('our three submissions are waiting',
  (select count(*) from public.programs_to_check() where program_name in ('Fresh One', 'Fresh Two', 'Old Name')), 3);
select test.check('the list names the lead by first name',
  (select count(*) from public.programs_to_check() where lead_name = 'Lou' and program_name = 'Fresh One' and kind = 'new'), 1);
select test.check('a change is called by the live program''s name, not the new one',
  (select count(*) from public.programs_to_check() where kind = 'change' and program_name = 'Old Name' and details->>'name' = 'New Name'), 1);
select test.check('the list carries no contact column',
  (select count(*) from information_schema.routines r
   join information_schema.parameters p on p.specific_name = r.specific_name
   where r.routine_name = 'programs_to_check' and p.parameter_mode = 'OUT' and p.parameter_name in ('phone', 'email', 'lead_phone')), 0);

-- ===========================================================================
\echo ''
\echo '--- Ask for changes ---'
-- ===========================================================================
select test.check_raises_like('a note is required',
  format($f$select public.review_program_submission(%L, 'changes_asked', '   ')$f$, (select id from public.program_submissions where details->>'name' = 'Fresh Two')),
  '%NOTE_REQUIRED%');
select test.check_raises_like('...and kept short',
  format($f$select public.review_program_submission(%L, 'changes_asked', %L)$f$, (select id from public.program_submissions where details->>'name' = 'Fresh Two'), repeat('x', 501)),
  '%NOTE_TOO_LONG%');
select test.check_raises_like('not a decision',
  format($f$select public.review_program_submission(%L, 'delete')$f$, (select id from public.program_submissions where details->>'name' = 'Fresh Two')),
  '%NOT_A_DECISION%');
select public.review_program_submission((select id from public.program_submissions where details->>'name' = 'Fresh Two'), 'changes_asked', 'Please add the street address.');
select test.check('the submission now waits on the lead, with the note',
  (select count(*) from public.program_submissions where details->>'name' = 'Fresh Two' and status = 'changes_asked' and changes_note = 'Please add the street address.' and reviewed_by = :'boss'::uuid), 1);
select test.check_raises_like('a submission waiting on the lead cannot be approved',
  format($f$select public.review_program_submission(%L, 'approved')$f$, (select id from public.program_submissions where details->>'name' = 'Fresh Two')),
  '%SUBMISSION_NOT_IN_REVIEW%');
select test.check_raises_like('...nor discarded',
  format($f$select public.review_program_submission(%L, 'discarded')$f$, (select id from public.program_submissions where details->>'name' = 'Fresh Two')),
  '%ONLY_WITHDRAWN_CAN_BE_DISCARDED%');
select test.check('the lead reads the note on their own submission',
  (select count(*) from (select set_config('request.jwt.claim.sub', :'lead2', false)) _, public.program_submissions where changes_note is not null), 1);
select set_config('request.jwt.claim.sub', :'boss', false);

-- ===========================================================================
\echo ''
\echo '--- Approve a first listing: it goes live ---'
-- ===========================================================================
select test.check('before: not yet visible to members',
  (select count(*) from public.services where name = 'Fresh One' and needs_review), 1);
select public.review_program_submission((select id from public.program_submissions where details->>'name' = 'Fresh One'), 'approved');
select test.check('approving a first send makes the listing live',
  (select count(*) from public.services where name = 'Fresh One' and not needs_review and is_active), 1);
select test.check('...and the submission is approved, by the super admin',
  (select count(*) from public.program_submissions where details->>'name' = 'Fresh One' and status = 'approved' and reviewed_by = :'boss'::uuid), 1);
select test.check_raises_like('an approved one cannot be approved again',
  format($f$select public.review_program_submission(%L, 'approved')$f$, (select id from public.program_submissions where details->>'name' = 'Fresh One')),
  '%SUBMISSION_NOT_IN_REVIEW%');
select test.check('the decision is in the audit log, without a note',
  (select count(*) from public.audit_log where action = 'program.approve' and actor_id = :'boss'::uuid and not (meta ? 'note')), 1);

-- ===========================================================================
\echo ''
\echo '--- Approve a change: only the four fields ---'
-- ===========================================================================
reset role;
update public.services set description_plain = 'Our own words.', phone = '+12675550123' where id = :'live3';
-- (Writing prose raises needs_review, 0020; the program was approved long ago.)
update public.services set needs_review = false where id = :'live3';
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('before: the live program is untouched by the waiting change',
  (select count(*) from public.services where id = :'live3' and name = 'Old Name' and address = '1 Old St'), 1);
select public.review_program_submission((select id from public.program_submissions where kind = 'change' and service_id = :'live3'), 'approved');
select test.check('approving a change applies the new name, kind and address',
  (select count(*) from public.services where id = :'live3' and name = 'New Name' and category = 'education' and address = '2 New St'), 1);
select test.check('...and touches nothing else: description and phone stay, the program is still live',
  (select count(*) from public.services where id = :'live3' and description_plain = 'Our own words.' and phone = '+12675550123' and not needs_review and is_active), 1);

-- ===========================================================================
\echo ''
\echo '--- Discard: only a withdrawn one ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead2', false);
select public.review_program_submission((select id from public.program_submissions where details->>'name' = 'Fresh Two'), 'discarded') where false;
select public.withdraw_program_submission((select id from public.program_submissions where details->>'name' = 'Fresh Two'));
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('a withdrawn submission stays on the list',
  (select count(*) from public.programs_to_check() where program_name = 'Fresh Two' and status = 'withdrawn'), 1);
select test.check_raises_like('a withdrawn one cannot be approved',
  format($f$select public.review_program_submission(%L, 'approved')$f$, (select id from public.program_submissions where details->>'name' = 'Fresh Two')),
  '%SUBMISSION_NOT_IN_REVIEW%');
select public.review_program_submission((select id from public.program_submissions where details->>'name' = 'Fresh Two'), 'discarded');
select test.check('discarding it takes it off the list',
  (select count(*) from public.programs_to_check() where program_name = 'Fresh Two'), 0);
select test.check('...and the listing stays off for members',
  (select count(*) from public.services where name = 'Fresh Two' and (is_active or not needs_review)), 0);

-- ===========================================================================
\echo ''
\echo '--- A listing approved by hand closes its submission ---'
-- ===========================================================================
reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values ('cccccccc-0000-0000-0000-000000004006', '12675558906');
insert into public.profiles (id, role, first_name, region_id, phone, access_status)
values ('cccccccc-0000-0000-0000-000000004006', 'provider', 'Lex', :'region_north', '+12675558906', 'active');
set role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000004006', false);
select public.submit_program('Hand Approved', 'education');
reset role;
select set_config('request.jwt.claim.sub', '', false);
update public.services set needs_review = false where name = 'Hand Approved';
select test.check('writing needs_review = false by hand closes the open submission',
  (select count(*) from public.program_submissions where details->>'name' = 'Hand Approved' and status = 'approved'), 1);

-- ===========================================================================
\echo ''
\echo '--- The backfill: one record for each program that has none ---'
-- ===========================================================================
insert into public.orgs (id, name, type, region_id) values
  (:'old_org', 'Old Live Org', 'program', :'region_north'), (:'old_wait_org', 'Old Waiting Org', 'program', :'region_north');
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'old_live', :'old_org', 'Old Live Program', 'education', '3 Old St', 'manual', false, true),
  (:'old_wait', :'old_wait_org', 'Old Waiting Program', 'workforce', '4 Old St', 'manual', true, true);
-- A catalogue listing with no organisation is not a program someone put on file.
insert into public.services (id, name, category, source, needs_review, is_active)
values ('eeeeeeee-0000-0000-0000-00000000400b', 'City Listing', 'family_services', 'manual', false, true);
-- And an old open one left behind by a hand-written approval.
update public.program_submissions set status = 'in_review' where details->>'name' = 'Hand Approved';

\ir ../migrations/20261010134146_programs_that_predate_the_review_record_get_one.sql

select test.check('the live program with no record got one, approved, kind new',
  (select count(*) from public.program_submissions where service_id = :'old_live' and status = 'approved' and kind = 'new' and reviewed_by is null and details->>'name' = 'Old Live Program'), 1);
select test.check('the waiting program got one, in review',
  (select count(*) from public.program_submissions where service_id = :'old_wait' and status = 'in_review'), 1);
select test.check('a listing with no organisation got none',
  (select count(*) from public.program_submissions where service_id = 'eeeeeeee-0000-0000-0000-00000000400b'::uuid), 0);
select test.check('a submission left open on a live listing is closed',
  (select count(*) from public.program_submissions where details->>'name' = 'Hand Approved' and status = 'approved'), 1);
select test.check('running it again writes nothing',
  (select count(*) from public.program_submissions where service_id in (:'old_live', :'old_wait')), 2);
\ir ../migrations/20261010134146_programs_that_predate_the_review_record_get_one.sql
select test.check('...still two after a second run',
  (select count(*) from public.program_submissions where service_id in (:'old_live', :'old_wait')), 2);

\echo ''
\echo 'review a program: all checks passed'
