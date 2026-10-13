-- a case manager request is purged without touching an account (test 73).
--
-- Claimed 2026-10-13 on `claude/pam-case-manager-request` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.
--
-- D-568: a case manager asks from the website (signed in first, nothing stored for an unproven
-- phone); the super admin decides it the usual way; a refused request is deleted 30 days after the
-- decision and an unanswered one 90 days after it was made, each with the sign-in that made it when
-- that sign-in has no profile, never one with an account; approved requests are never purged.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

-- Ids and phones used only here: ...0000000073NN and +1267555 73NN.
\set philly  '0195b1c0-0000-4000-8000-000000000001'
\set boss    'cccccccc-0000-0000-0000-000000007301'
\set mem     'cccccccc-0000-0000-0000-000000007302'
\set mem2    'cccccccc-0000-0000-0000-000000007303'
\set t1      'cccccccc-0000-0000-0000-000000007311'
\set t2      'cccccccc-0000-0000-0000-000000007312'
\set t3      'cccccccc-0000-0000-0000-000000007313'
\set t4      'cccccccc-0000-0000-0000-000000007314'
\set t5      'cccccccc-0000-0000-0000-000000007315'
\set t6      'cccccccc-0000-0000-0000-000000007316'

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
  (:'boss', '12675557301'), (:'mem', '12675557302'), (:'mem2', '12675557303'),
  -- Sign-ins that proved a phone with the code and have no profile.
  (:'t1', '12675557311'), (:'t2', '12675557312'), (:'t3', '12675557313'), (:'t4', '12675557314'),
  (:'t5', '12675557315'), (:'t6', '12675557316');
insert into public.profiles (id, role, first_name, last_name, home_city, region_id, phone, access_status) values
  (:'boss', 'super_admin', 'Bea', 'Boss',   'Philadelphia', :'philly', '+12675557301', 'active'),
  (:'mem',  'member',      'Mo',  'Member', 'Philadelphia', :'philly', '+12675557302', 'active'),
  (:'mem2', 'member',      'Mae', 'Member', 'Philadelphia', :'philly', '+12675557303', 'active');

\echo ''
\echo '--- Asking: signed in, no account, the fields that let the super admin decide ---'
set role anon;
select test.check_raises_like('anon cannot ask',
  $f$select public.request_case_manager_access('Ann', 'Ask', 'Philadelphia', 'Northside Reentry', 'ann@example.org')$f$,
  '%permission denied%');
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select test.check_raises_like('somebody with an account asks on it, not here',
  $f$select public.request_case_manager_access('Mo', 'Member', 'Philadelphia', 'Northside Reentry', 'mo@example.org')$f$,
  '%HAS_ACCOUNT%');
select set_config('request.jwt.claim.sub', :'t1', false);
select test.check_raises_like('an organization is needed',
  $f$select public.request_case_manager_access('Ann', 'Ask', 'Philadelphia', '  ', 'ann@example.org')$f$, '%INVALID%');
select test.check_raises_like('a work email is needed (card a84: required)',
  $f$select public.request_case_manager_access('Ann', 'Ask', 'Philadelphia', 'Northside Reentry', '')$f$, '%INVALID%');
select test.check_raises_like('an email has to look like one',
  $f$select public.request_case_manager_access('Ann', 'Ask', 'Philadelphia', 'Northside Reentry', 'ann at work')$f$, '%INVALID%');
select test.check_raises_like('a city Pam does not serve is refused',
  $f$select public.request_case_manager_access('Ann', 'Ask', 'Scranton', 'Northside Reentry', 'ann@example.org')$f$, '%INVALID%');
select test.check('a sign-in asks and is told "received"',
  (select count(*) from (select public.request_case_manager_access(' Ann ', 'Ask', 'philadelphia', 'Northside Reentry', 'Ann@Example.org', 'es')) x(r)
    where r = 'received'), 1::bigint);
select test.check_raises_like('one waiting request at a time',
  $f$select public.request_case_manager_access('Ann', 'Ask', 'Philadelphia', 'Northside Reentry', 'ann@example.org')$f$,
  '%REQUEST_ALREADY_WAITING%');
select test.check('the asker reads their own request',
  (select count(*) from public.staff_requests where user_id = :'t1' and decision is null), 1::bigint);
select set_config('request.jwt.claim.sub', :'t2', false);
select test.check('another sign-in cannot read it',
  (select count(*) from public.staff_requests where user_id = :'t1'), 0::bigint);
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select test.check('anon reads no request',
  (select count(*) from public.staff_requests where user_id = :'t1'), 0::bigint);

reset role;
select test.check('the row: a case manager, the city as Pam spells it, the email in lower case, the language',
  (select count(*) from public.staff_requests
    where user_id = :'t1' and wants_role = 'admin' and first_name = 'Ann' and city = 'Philadelphia'
      and organization = 'Northside Reentry' and work_email = 'ann@example.org' and preferred_language = 'es'), 1::bigint);
select test.check('asking made no profile',
  (select count(*) from public.profiles where id = :'t1'), 0::bigint);
select test.check('the super admin''s bell lights, as for every staff request',
  (select count(*) from public.notifications
    where recipient_id = :'boss' and kind = 'staff_request_pending' and subject_id = :'t1'), 1::bigint);

\echo ''
\echo '--- A sign-in cannot make itself staff ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'t1', false);
update public.staff_requests set decision = 'approved' where user_id = :'t1';
select test.check_raises_like('it cannot write a profile with a staff role',
  $f$insert into public.profiles (id, role, first_name) values ('cccccccc-0000-0000-0000-000000007311', 'admin', 'Ann')$f$, '%');
select test.check_raises_like('it cannot decide its own request',
  $f$select public.review_staff_request('cccccccc-0000-0000-0000-000000007311', 'approved', '0195b1c0-0000-4000-8000-000000000001')$f$,
  '%Only a super admin%');
reset role;
select test.check('...and its update changed nothing',
  (select count(*) from public.staff_requests where user_id = :'t1' and decision is null), 1::bigint);

\echo ''
\echo '--- Approved: a case manager, and the email moves onto the account ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('the super admin reads the organization and the email to decide',
  (select count(*) from public.staff_requests where user_id = :'t1' and organization is not null and work_email is not null), 1::bigint);
select public.review_staff_request(:'t1', 'approved', :'philly');
reset role;
select test.check('the account is a case manager in the city the super admin picked',
  (select count(*) from public.profiles where id = :'t1' and role = 'admin' and region_id = :'philly'), 1::bigint);
select test.check('the work email is on the account (D-441''s table)',
  (select count(*) from public.profile_emails where profile_id = :'t1' and email = 'ann@example.org'), 1::bigint);
select test.check('...and no longer on the request, which keeps the organization',
  (select count(*) from public.staff_requests where user_id = :'t1' and work_email is null and organization = 'Northside Reentry'), 1::bigint);
select test.check('no audit row holds the email, the organization or the name',
  (select count(*) from public.audit_log
    where target_id = :'t1' and (meta::text ilike '%example.org%' or meta::text ilike '%Northside%' or meta::text ilike '%Ann%')), 0::bigint);

\echo ''
\echo '--- Refused, then asked again (D-525) ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'t2', false);
select public.request_case_manager_access('Ben', 'Ask', 'Philadelphia', 'Southside Services', 'ben@example.org');
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'t2', 'denied');
select set_config('request.jwt.claim.sub', :'t2', false);
select test.check('a refused request can be asked again',
  (select count(*) from (select public.request_case_manager_access('Ben', 'Ask', 'Philadelphia', 'Southside Services', 'ben@example.org')) x(r)
    where r = 'received'), 1::bigint);
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'t2', 'denied');
reset role;
select test.check('the "no" text is queued to the phone',
  (select count(*) from public.outbound_messages
    where template_key = 'staff_request_denied' and regexp_replace(phone, '\D', '', 'g') = '12675557312'), 2::bigint);
select test.check('the refusal''s audit note names no one',
  (select count(*) from public.audit_log where action = 'staff_request.deny' and target_id = :'t2' and meta::text not ilike '%Ben%'), 2::bigint);

-- More requests to forget, and two from people with accounts (a member's program-lead ask, D-525).
set role authenticated;
select set_config('request.jwt.claim.sub', :'t3', false);
select public.request_case_manager_access('Cy', 'Ask', 'Philadelphia', 'Org C', 'cy@example.org');
select set_config('request.jwt.claim.sub', :'t4', false);
select public.request_case_manager_access('Di', 'Ask', 'Philadelphia', 'Org D', 'di@example.org');
select set_config('request.jwt.claim.sub', :'t5', false);
select public.request_case_manager_access('Ed', 'Ask', 'Philadelphia', 'Org E', 'ed@example.org');
select set_config('request.jwt.claim.sub', :'mem', false);
select public.request_staff_access('provider', 'Mo', 'Member', 'Philadelphia', 'Mo''s Program');
select set_config('request.jwt.claim.sub', :'mem2', false);
select public.request_staff_access('provider', 'Mae', 'Member', 'Philadelphia', 'Mae''s Program');
select set_config('request.jwt.claim.sub', :'boss', false);
select public.review_staff_request(:'t3', 'denied');
select public.review_staff_request(:'mem', 'denied');

\echo ''
\echo '--- Nobody but the nightly job can purge ---'
select test.check_raises_like('not the super admin',
  $f$select public.purge_staff_requests()$f$, '%permission denied%');
select test.check_raises_like('nor the sign-in helper',
  $f$select public.remove_temporary_signin('cccccccc-0000-0000-0000-000000007312')$f$, '%permission denied%');
set role anon;
select test.check_raises_like('not anon',
  $f$select public.purge_staff_requests()$f$, '%permission denied%');

\echo ''
\echo '--- The purge: refused after 30 days, unanswered after 90, an account never touched ---'
reset role;
select set_config('request.jwt.claim.sub', '', false);
-- t1 approved long ago; t2 refused 31 days ago; t3 refused 29 days ago; t4 unanswered 91 days;
-- t5 unanswered 89 days; mem (has an account) refused 31 days ago; mem2 (account) unanswered 91 days.
update public.staff_requests set reviewed_at = now() - interval '400 days', created_at = now() - interval '401 days' where user_id = :'t1';
update public.staff_requests set reviewed_at = now() - interval '31 days', created_at = now() - interval '32 days' where user_id = :'t2';
update public.staff_requests set reviewed_at = now() - interval '29 days', created_at = now() - interval '30 days' where user_id = :'t3';
update public.staff_requests set created_at = now() - interval '91 days' where user_id = :'t4';
update public.staff_requests set created_at = now() - interval '89 days' where user_id = :'t5';
update public.staff_requests set reviewed_at = now() - interval '31 days', created_at = now() - interval '32 days' where user_id = :'mem';
update public.staff_requests set created_at = now() - interval '91 days' where user_id = :'mem2';

select test.check('four requests are purged (t2, t4, mem, mem2)',
  (select public.purge_staff_requests())::bigint, 4::bigint);

select test.check('a refused request is gone 30 days after the decision',
  (select count(*) from public.staff_requests where user_id = :'t2'), 0::bigint);
select test.check('...with the sign-in that made it (it had no profile)',
  (select count(*) from auth.users where id = :'t2'), 0::bigint);
select test.check('...the bell rows that named them',
  (select count(*) from public.notifications where subject_type = 'staff_request' and subject_id = :'t2'), 0::bigint);
select test.check('...and the "no" texts addressed to the phone',
  (select count(*) from public.outbound_messages where regexp_replace(phone, '\D', '', 'g') = '12675557312'), 0::bigint);
select test.check('the refusal''s audit note stays',
  (select count(*) from public.audit_log where action = 'staff_request.deny' and target_id = :'t2'), 2::bigint);

select test.check('an unanswered request is gone 90 days after it was made',
  (select count(*) from public.staff_requests where user_id = :'t4'), 0::bigint);
select test.check('...with its sign-in (no profile)',
  (select count(*) from auth.users where id = :'t4'), 0::bigint);

select test.check('a refused request from somebody with an account is gone',
  (select count(*) from public.staff_requests where user_id = :'mem'), 0::bigint);
select test.check('...and their sign-in and account are untouched',
  (select count(*) from auth.users u join public.profiles p on p.id = u.id where u.id = :'mem'), 1::bigint);
select test.check('an unanswered request from somebody with an account is gone',
  (select count(*) from public.staff_requests where user_id = :'mem2'), 0::bigint);
select test.check('...and their sign-in and account are untouched',
  (select count(*) from auth.users u join public.profiles p on p.id = u.id where u.id = :'mem2'), 1::bigint);

select test.check('a request refused 29 days ago stays, with its sign-in',
  (select count(*) from public.staff_requests s join auth.users u on u.id = s.user_id where s.user_id = :'t3'), 1::bigint);
select test.check('a request waiting 89 days stays, with its sign-in',
  (select count(*) from public.staff_requests s join auth.users u on u.id = s.user_id where s.user_id = :'t5'), 1::bigint);
select test.check('an approved request is never purged, however old',
  (select count(*) from public.staff_requests where user_id = :'t1' and decision = 'approved'), 1::bigint);
select test.check('...and the approved case manager keeps their account',
  (select count(*) from public.profiles where id = :'t1'), 1::bigint);
select test.check('running it again purges nothing more',
  (select public.purge_staff_requests())::bigint, 0::bigint);

select test.check('the helper never removes a sign-in with an account',
  (select count(*) from (select public.remove_temporary_signin(:'mem')) x), 1::bigint);
select test.check('...the member is still there',
  (select count(*) from auth.users where id = :'mem'), 1::bigint);

-- Leave nothing behind for the files that run after this one.
delete from public.staff_requests where user_id in (:'t1', :'t3', :'t5');
reset role;
