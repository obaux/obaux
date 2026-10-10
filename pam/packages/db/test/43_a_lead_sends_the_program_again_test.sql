-- A lead corrects and sends again (20261010135742, D-386 part 5b).
--
-- Attacks: only their own submission; only while open; only a first send; the
-- same submission comes back to review (id kept, note cleared, details and
-- listing corrected); a correction while waiting keeps the wait, a re-send
-- after a change request restarts it; and the reviewer then approves what the
-- corrected submission says.
-- It writes the review state
-- directly, as the owner, so it stands alone.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set region_north '11111111-0000-0000-0000-000000000001'
\set boss  'cccccccc-0000-0000-0000-000000004201'
\set lead  'cccccccc-0000-0000-0000-000000004202'
\set other 'cccccccc-0000-0000-0000-000000004203'
\set tanya '33333333-0000-0000-0000-00000000000d'

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
insert into auth.users (id, phone) values (:'boss', '12675558911'), (:'lead', '12675558912'), (:'other', '12675558913');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'boss', 'super_admin', 'Bea', :'region_north', '+12675558911', 'active'),
  (:'lead', 'provider', 'Lou', :'region_north', '+12675558912', 'active'),
  (:'other', 'provider', 'Oli', :'region_north', '+12675558913', 'active');

set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select public.submit_program('Frist Draft', 'workforce', null, 'Clases.', '1 Main', '+12675550111', null);
select set_config('request.jwt.claim.sub', :'other', false);
select public.submit_program('Other Program', 'education');
reset role;
select set_config('request.jwt.claim.sub', '', false);

create or replace function test.mine() returns uuid language sql as $$
  select id from public.program_submissions where details->>'name' in ('Frist Draft', 'First Draft') limit 1
$$;

-- ===========================================================================
\echo ''
\echo '--- A correction while it waits keeps the wait ---'
-- ===========================================================================
update public.program_submissions set sent_at = now() - interval '5 days' where id = test.mine();
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select public.resend_program_submission(test.mine(), 'First Draft', 'workforce', 'job_training', 'Classes.', '1 Main St', '+12675550111', 'https://example.org');
select test.check('the listing carries the corrected words',
  (select count(*) from public.services where name = 'First Draft' and description_plain = 'Classes.' and address = '1 Main St' and website = 'https://example.org' and needs_review), 1);
select test.check('the record of what was sent says the same, on the same submission',
  (select count(*) from public.program_submissions where id = test.mine() and details->>'name' = 'First Draft' and details->>'address' = '1 Main St' and status = 'in_review'), 1);
select test.check('...and the wait was not restarted',
  (select count(*) from public.program_submissions where id = test.mine() and sent_at < now() - interval '4 days'), 1);

-- ===========================================================================
\echo ''
\echo '--- After Pam asked for changes, sending again restarts it ---'
-- ===========================================================================
reset role;
update public.program_submissions set status = 'changes_asked', changes_note = 'Add the phone.', reviewed_by = :'boss' where id = test.mine();
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select test.check('the lead reads the note',
  (select count(*) from public.program_submissions where id = test.mine() and changes_note = 'Add the phone.'), 1);
select public.resend_program_submission(test.mine(), 'First Draft', 'workforce', 'job_training', 'Classes.', '1 Main St', '+12675550199', 'https://example.org');
select test.check('back in review, the same submission, the note cleared',
  (select count(*) from public.program_submissions where id = test.mine() and status = 'in_review' and changes_note is null), 1);
select test.check('...with the corrected phone, and the wait begun again',
  (select count(*) from public.program_submissions where id = test.mine() and details->>'phone' = '+12675550199' and sent_at > now() - interval '1 minute'), 1);
select test.check('there is still exactly one submission for this listing',
  (select count(*) from public.program_submissions where service_id = (select service_id from public.program_submissions where id = test.mine())), 1);

-- ===========================================================================
\echo ''
\echo '--- Whose it is, and when ---'
-- ===========================================================================
select test.check_raises_like('a name is required',
  format($f$select public.resend_program_submission(%L, '  ', 'workforce')$f$, test.mine()), '%NAME_REQUIRED%');
select test.check_raises_like('a phone that is not a phone is refused by the listing''s own rule',
  format($f$select public.resend_program_submission(%L, 'First Draft', 'workforce', null, null, null, 'call me', null)$f$, test.mine()), '%services_phone_e164%');
select set_config('request.jwt.claim.sub', :'other', false);
select test.check_raises_like('another lead cannot resend it, and learns nothing about it',
  format($f$select public.resend_program_submission(%L, 'Mine now', 'workforce')$f$, test.mine()), '%SUBMISSION_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot',
  format($f$select public.resend_program_submission(%L, 'Nope', 'workforce')$f$, test.mine()), '%NOT_A_PROGRAM_LEAD%');
reset role;
select test.mine() as sid \gset
set role anon;
select test.check_raises('nobody signed in cannot', format($f$select public.resend_program_submission(%L, 'Nope', 'workforce')$f$, :'sid'));

reset role;
update public.program_submissions set status = 'approved' where id = test.mine();
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select test.check_raises_like('an approved one is closed',
  format($f$select public.resend_program_submission(%L, 'Late edit', 'workforce')$f$, test.mine()), '%SUBMISSION_NOT_OPEN%');
reset role;
update public.program_submissions set status = 'withdrawn' where id = test.mine();
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select test.check_raises_like('a withdrawn one is closed',
  format($f$select public.resend_program_submission(%L, 'Late edit', 'workforce')$f$, test.mine()), '%SUBMISSION_NOT_OPEN%');

-- A live program's change is corrected through request_program_change.
reset role;
select set_config('request.jwt.claim.sub', '', false);
update public.program_submissions set kind = 'change', status = 'in_review' where id = test.mine();
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead', false);
select test.check_raises_like('a live program''s change is not resent here',
  format($f$select public.resend_program_submission(%L, 'First Draft', 'workforce')$f$, test.mine()), '%USE_REQUEST_PROGRAM_CHANGE%');

\echo ''
\echo 'resend a program: all checks passed'
