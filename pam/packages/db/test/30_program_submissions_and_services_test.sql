-- A program lead's review record, a pending change, and the services a program
-- offers (20261010083715, D-462).
--
-- These attack the rules docs/design/program-review-queue.md (D-386) says the
-- database must enforce, and D-447's: a lead sees and changes only their own
-- program's submissions; deleting and starting over withdraws without losing
-- the history, and takes the listing off; a live program's new name or address
-- waits beside it and the live row keeps serving; and the services a program
-- offers are read by members only while it is live, and written only by its own
-- lead.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north  '11111111-0000-0000-0000-000000000001'
\set alice         '33333333-0000-0000-0000-00000000000f'
\set bob           '33333333-0000-0000-0000-000000000010'
\set tanya         '33333333-0000-0000-0000-00000000000d'
\set boss          'aaaaaaaa-0000-0000-0000-000000000901'
\set lead          'aaaaaaaa-0000-0000-0000-000000000902'
\set other         'aaaaaaaa-0000-0000-0000-000000000903'
\set live_prog     'bbbbbbbb-0000-0000-0000-000000000901'
\set pending_prog  'bbbbbbbb-0000-0000-0000-000000000902'

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
  (:'boss', '12675557701'), (:'lead', '12675557702'), (:'other', '12675557703');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'boss', 'super_admin', 'Bea', :'region_north', '+12675557701', 'active'),
  (:'lead', 'provider', 'Lou', :'region_north', '+12675557702', 'active'),
  (:'other', 'provider', 'Oli', :'region_north', '+12675557703', 'active');

-- ===========================================================================
\echo ''
\echo '--- A send leaves a record, and a start-over keeps it ---'
-- ===========================================================================
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select public.submit_program('Fresh Start Kitchen', 'workforce', 'job_training', 'Cooking classes.', '12 Main St', '+12675550101', 'https://example.org');

do $$
declare
  s public.program_submissions;
begin
  select * into s from public.program_submissions;
  if s.kind <> 'new' or s.status <> 'in_review' or s.org_id is null or s.replaces_id is not null then
    raise exception 'FAIL  the send left kind %, status %, replaces %', s.kind, s.status, s.replaces_id;
  end if;
  if s.details->>'name' <> 'Fresh Start Kitchen' or s.details->>'phone' <> '+12675550101' then
    raise exception 'FAIL  the record does not hold what was sent: %', s.details;
  end if;
  raise notice 'ok    sending a program leaves a record of exactly what was sent';
end;
$$;

select test.check_raises_like('a second send is refused while one is being checked',
  $$select public.submit_program('Another', 'education')$$, '%PROGRAM_ALREADY_IN_REVIEW%');

select set_config('request.jwt.claim.sub', :'other', false);
select test.check('another program''s lead does not see it', (select count(*) from public.program_submissions), 0);
select test.check_raises_like('...cannot withdraw it, and learns nothing about it',
  format($f$select public.withdraw_program_submission(%L)$f$, (select id from public.program_submissions)),
  '%SUBMISSION_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check('a member does not see it', (select count(*) from public.program_submissions), 0);
select test.check_raises_like('...and cannot withdraw it',
  $$select public.withdraw_program_submission('00000000-0000-0000-0000-000000000000')$$, '%NOT_A_PROGRAM_LEAD%');
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('a super admin sees it', (select count(*) from public.program_submissions), 1);

select set_config('request.jwt.claim.sub', :'lead', false);
select test.check('the lead sees their own', (select count(*) from public.program_submissions), 1);
select test.check_raises('nobody writes a submission straight to the table',
  $$update public.program_submissions set status = 'approved'$$);
select test.check_raises('...nor adds one',
  $$insert into public.program_submissions (service_id, details) select id, '{}'::jsonb from public.services limit 1$$);

do $$
declare
  s public.program_submissions;
  live boolean;
begin
  select * into s from public.program_submissions;
  s := public.withdraw_program_submission(s.id);
  if s.status <> 'withdrawn' or s.withdrawn_at is null then
    raise exception 'FAIL  the submission is %', s.status;
  end if;
  select is_active into live from public.services where id = s.service_id;
  if live then
    raise exception 'FAIL  a withdrawn first listing is still active';
  end if;
  raise notice 'ok    Delete and start over withdraws the submission and takes the listing off';
end;
$$;
select test.check('...but the record is kept', (select count(*) from public.program_submissions where status = 'withdrawn'), 1);
select test.check_raises_like('a withdrawn submission cannot be withdrawn again',
  format($f$select public.withdraw_program_submission(%L)$f$, (select id from public.program_submissions)),
  '%SUBMISSION_NOT_OPEN%');

-- Starting over: a new send, linked to the withdrawn one.
select public.submit_program('Fresh Start Kitchen', 'workforce', null, 'New words.', '12 Main St');
select test.check('a new send after a start-over links to the one it replaces',
  (select count(*) from public.program_submissions n
   join public.program_submissions o on o.id = n.replaces_id
   where n.status = 'in_review' and o.status = 'withdrawn'), 1);
select test.check('...and the public still sees none of it',
  (select count(*) from public.services where name = 'Fresh Start Kitchen' and is_active and not needs_review), 0);

-- ===========================================================================
\echo ''
\echo '--- A live program holds a change beside it ---'
-- ===========================================================================
reset role;
select set_config('request.jwt.claim.sub', '', false);
update public.profiles set org_id = (select org_id from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000902')
  where id = :'lead';
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active)
select :'live_prog', org_id, 'Riverside Kitchen', 'workforce', '1 Water St', 'manual', false, true
from public.profiles where id = :'lead';
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active)
values (:'pending_prog', '22222222-0000-0000-0000-000000000002', 'Southside Pending', 'education', '9 Elm St', 'manual', true, true);

set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);

do $$
declare
  s public.program_submissions;
begin
  s := public.request_program_change('bbbbbbbb-0000-0000-0000-000000000901', 'Riverside Community Kitchen', 'workforce', null, '2 Water St');
  if s.kind <> 'change' or s.status <> 'in_review' or s.details->>'name' <> 'Riverside Community Kitchen' then
    raise exception 'FAIL  the change was recorded as % / % / %', s.kind, s.status, s.details;
  end if;
  raise notice 'ok    a lead asks to change a live program''s name and address';
end;
$$;
select test.check('the live program still reads as it was',
  (select count(*) from public.services
   where id = :'live_prog' and name = 'Riverside Kitchen' and address = '1 Water St' and not needs_review and is_active), 1);

do $$
declare
  n integer;
begin
  perform public.request_program_change('bbbbbbbb-0000-0000-0000-000000000901', 'Riverside Community Kitchen', 'workforce', null, '3 Water St');
  select count(*) into n from public.program_submissions
  where service_id = 'bbbbbbbb-0000-0000-0000-000000000901' and status in ('in_review', 'changes_asked');
  if n <> 1 then
    raise exception 'FAIL  asking again left % open changes, expected the same one corrected', n;
  end if;
  if (select details->>'address' from public.program_submissions where service_id = 'bbbbbbbb-0000-0000-0000-000000000901' and status = 'in_review') <> '3 Water St' then
    raise exception 'FAIL  the corrected request does not hold the new address';
  end if;
  raise notice 'ok    asking again corrects the same request, there is one waiting';
end;
$$;

select test.check_raises_like('nothing to change is refused',
  $$select public.request_program_change('bbbbbbbb-0000-0000-0000-000000000901', 'Riverside Kitchen', 'workforce', null, '1 Water St')$$,
  '%NOTHING_TO_CHANGE%');
select test.check_raises_like('a name is required',
  $$select public.request_program_change('bbbbbbbb-0000-0000-0000-000000000901', '  ', 'workforce')$$, '%NAME_REQUIRED%');
select test.check_raises_like('a program that is not theirs is not found',
  $$select public.request_program_change('bbbbbbbb-0000-0000-0000-000000000902', 'Mine now', 'education')$$,
  '%PROGRAM_NOT_FOUND%');

select set_config('request.jwt.claim.sub', :'bob', false);
select test.check_raises_like('a program still waiting for its first check is changed directly, not held',
  $$select public.request_program_change('bbbbbbbb-0000-0000-0000-000000000902', 'Renamed', 'education')$$,
  '%PROGRAM_NOT_LIVE%');

select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot ask to change a program',
  $$select public.request_program_change('bbbbbbbb-0000-0000-0000-000000000901', 'Nope', 'education')$$,
  '%NOT_A_PROGRAM_LEAD%');

-- Withdrawing a change leaves the live program as it was.
select set_config('request.jwt.claim.sub', :'lead', false);
do $$
declare
  sub_id uuid;
begin
  select id into sub_id from public.program_submissions
  where service_id = 'bbbbbbbb-0000-0000-0000-000000000901' and status = 'in_review';
  perform public.withdraw_program_submission(sub_id);
end;
$$;
select test.check('withdrawing a change leaves the live program live and unchanged',
  (select count(*) from public.services
   where id = :'live_prog' and name = 'Riverside Kitchen' and is_active and not needs_review), 1);

-- ===========================================================================
\echo ''
\echo '--- The services a program offers ---'
-- ===========================================================================
-- The lead of a live program adds services; each can carry its own number.
select public.request_program_change('bbbbbbbb-0000-0000-0000-000000000901', 'Riverside Kitchen', 'workforce', null, '1 Water St 2');
reset role;
select set_config('request.jwt.claim.sub', '', false);
update public.program_submissions set status = 'withdrawn' where service_id = 'bbbbbbbb-0000-0000-0000-000000000901';
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);

insert into public.program_services (service_id, name, description, phone)
values (:'live_prog', 'Knife skills', 'Two evenings a week.', '+12675550177');
insert into public.program_services (service_id, name) values (:'live_prog', 'Job-readiness workshop');
select test.check('the lead adds services to their own program',
  (select count(*) from public.program_services where service_id = :'live_prog'), 2);

select test.check_raises_like('a service needs a name',
  $$insert into public.program_services (service_id, name) values ('bbbbbbbb-0000-0000-0000-000000000901', '   ')$$,
  '%program_services_name_present%');
select test.check_raises_like('a phone has to be a real number',
  $$insert into public.program_services (service_id, name, phone) values ('bbbbbbbb-0000-0000-0000-000000000901', 'Bad number', 'call us')$$,
  '%program_services_phone_e164%');

-- Services of a program still being checked: its own lead sees and edits them,
-- nobody else does.
select set_config('request.jwt.claim.sub', :'bob', false);
insert into public.program_services (service_id, name) values (:'pending_prog', 'Evening GED');
select test.check('the lead of a program still being checked sets up its services',
  (select count(*) from public.program_services where service_id = :'pending_prog'), 1);

select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check('a member reads a live program''s services',
  (select count(*) from public.program_services where service_id = :'live_prog'), 2);
select test.check('...and none of a program that is still being checked',
  (select count(*) from public.program_services where service_id = :'pending_prog'), 0);
select test.check_raises('a member cannot add a service',
  $$insert into public.program_services (service_id, name) values ('bbbbbbbb-0000-0000-0000-000000000901', 'Mine')$$);

reset role;
set role anon;
select test.check('a visitor reads a live program''s services',
  (select count(*) from public.program_services where service_id = :'live_prog'), 2);
select test.check_raises('...and cannot add one',
  $$insert into public.program_services (service_id, name) values ('bbbbbbbb-0000-0000-0000-000000000901', 'Mine')$$);

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :'bob', false);
select test.check_raises('another program''s lead cannot add a service to this one',
  $$insert into public.program_services (service_id, name) values ('bbbbbbbb-0000-0000-0000-000000000901', 'Hijack')$$);
do $$
declare n integer;
begin
  update public.program_services set name = 'Hijacked' where service_id = 'bbbbbbbb-0000-0000-0000-000000000901';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL  another program''s lead renamed % of this program''s services', n; end if;
  delete from public.program_services where service_id = 'bbbbbbbb-0000-0000-0000-000000000901';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL  another program''s lead deleted % of this program''s services', n; end if;
  raise notice 'ok    another program''s lead can neither rename nor delete this program''s services';
end;
$$;

-- The lead edits and removes their own.
select set_config('request.jwt.claim.sub', :'lead', false);
do $$
declare n integer;
begin
  update public.program_services set description = 'Three evenings now.' where name = 'Knife skills';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL  the lead could not edit their own service'; end if;
  delete from public.program_services where name = 'Job-readiness workshop';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL  the lead could not remove their own service'; end if;
  raise notice 'ok    the lead edits and removes their own services';
end;
$$;

-- A program withdrawn or taken off hides its services from the public again.
reset role;
select set_config('request.jwt.claim.sub', '', false);
update public.services set is_active = false where id = :'live_prog';
set role anon;
select test.check('a program taken off the list shows no services to a visitor',
  (select count(*) from public.program_services where service_id = :'live_prog'), 0);
