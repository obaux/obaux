-- a new number moves an account only after a person checks it (test 72).
--
-- Claimed 2026-10-13 on `claude/pam-new-number` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

-- Ids and phones used only here: ...0000000072NN and +1267555 72NN.
\set region_north '11111111-0000-0000-0000-000000000001'
\set boss    'cccccccc-0000-0000-0000-000000007201'
\set cm      'cccccccc-0000-0000-0000-000000007202'
\set cm2     'cccccccc-0000-0000-0000-000000007203'
\set mem     'cccccccc-0000-0000-0000-000000007204'
\set lone    'cccccccc-0000-0000-0000-000000007205'
\set lead    'cccccccc-0000-0000-0000-000000007206'
\set tmp1    'cccccccc-0000-0000-0000-000000007211'
\set tmp2    'cccccccc-0000-0000-0000-000000007212'
\set tmp3    'cccccccc-0000-0000-0000-000000007213'
\set tmp4    'cccccccc-0000-0000-0000-000000007214'
\set tmp5    'cccccccc-0000-0000-0000-000000007215'
\set tmp6    'cccccccc-0000-0000-0000-000000007216'

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
  (:'boss', '12675557201'), (:'cm', '12675557202'), (:'cm2', '12675557203'), (:'mem', '12675557204'),
  (:'lone', '12675557205'), (:'lead', '12675557206'),
  -- The temporary sign-ins: each proved a new number with the code, and has no profile.
  (:'tmp1', '12675557211'), (:'tmp2', '12675557212'), (:'tmp3', '12675557213'), (:'tmp4', '12675557214'),
  (:'tmp5', '12675557215'), (:'tmp6', '12675557216');
insert into public.profiles (id, role, first_name, last_name, home_city, region_id, phone, access_status) values
  (:'boss', 'super_admin', 'Bea', 'Boss', 'Philadelphia', :'region_north', '+12675557201', 'active'),
  (:'cm',   'admin',       'Cal', 'Case', 'Philadelphia', :'region_north', '+12675557202', 'active'),
  (:'cm2',  'admin',       'Cora', 'Other', 'Philadelphia', :'region_north', '+12675557203', 'active'),
  (:'mem',  'member',      'Mo',  'Moved', 'Philadelphia', :'region_north', '+12675557204', 'active'),
  (:'lone', 'member',      'Lu',  'Alone', 'Philadelphia', :'region_north', '+12675557205', 'active'),
  (:'lead', 'provider',    'Lee', 'Lead', 'Philadelphia', :'region_north', '+12675557206', 'active');
insert into public.admin_assignments (admin_id, member_id) values (:'cm', :'mem');

\echo ''
\echo '--- Asking: the same answer whatever was typed, and no profile is ever made ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'tmp1', false);
select test.check('a member with a case manager: the reply is "received"',
  (select count(*) from (select public.submit_number_change('+12675557204', 'Mo', 'Moved', 'Philadelphia', 'Cal')) x(r) where r = 'received'), 1::bigint);
select set_config('request.jwt.claim.sub', :'tmp2', false);
select test.check('a number that is nobody''s: the same reply',
  (select count(*) from (select public.submit_number_change('+12675557299', 'Ann', 'Nobody', 'Philadelphia', '')) x(r) where r = 'received'), 1::bigint);
select set_config('request.jwt.claim.sub', :'tmp3', false);
select test.check('a super admin''s number: the same reply',
  (select count(*) from (select public.submit_number_change('+12675557201', 'Bea', 'Boss', 'Philadelphia', '')) x(r) where r = 'received'), 1::bigint);
select set_config('request.jwt.claim.sub', :'tmp4', false);
select public.submit_number_change('+12675557206', 'Lee', 'Lead', 'Philadelphia', 'me');
select set_config('request.jwt.claim.sub', :'tmp5', false);
select public.submit_number_change('+12675557205', 'Lu', 'Alone', 'Philadelphia', '');
reset role;
select id as r_mem from public.number_change_requests where requester_id = :'tmp1'::uuid \gset
select id as r_none from public.number_change_requests where requester_id = :'tmp2'::uuid \gset
select id as r_boss from public.number_change_requests where requester_id = :'tmp3'::uuid \gset
select id as r_lead from public.number_change_requests where requester_id = :'tmp4'::uuid \gset
select id as r_lone from public.number_change_requests where requester_id = :'tmp5'::uuid \gset
select test.check('the temporary sign-ins have no profile, and asking made none',
  (select count(*) from public.profiles where id in (:'tmp1', :'tmp2', :'tmp3', :'tmp4', :'tmp5')), 0::bigint);
select test.check('the new number is the proven one, not typed',
  (select count(*) from public.number_change_requests where requester_id = :'tmp1'::uuid and new_phone = '+12675557211' and old_phone = '+12675557204'), 1::bigint);

\echo ''
\echo '--- Routing ---'
select test.check('a member with a case manager goes to the case manager',
  (select count(*) from public.number_change_requests where requester_id = :'tmp1'::uuid and routed_to = 'case_manager' and case_manager_id = :'cm'::uuid), 1::bigint);
select test.check('no account: the super admin',
  (select count(*) from public.number_change_requests where requester_id = :'tmp2'::uuid and routed_to = 'super_admin' and profile_id is null), 1::bigint);
select test.check('a super admin''s account is protected',
  (select count(*) from public.number_change_requests where requester_id = :'tmp3'::uuid and is_protected), 1::bigint);
select test.check('a staff account skips the case manager',
  (select count(*) from public.number_change_requests where requester_id = :'tmp4'::uuid and routed_to = 'super_admin' and not is_protected), 1::bigint);
select test.check('a member with no case manager: the super admin',
  (select count(*) from public.number_change_requests where requester_id = :'tmp5'::uuid and routed_to = 'super_admin'), 1::bigint);

\echo ''
\echo '--- Nobody reads the table directly; the asker sees only a status ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check_raises_like('not even the super admin reads the table',
  $f$select count(*) from public.number_change_requests$f$, '%permission denied%');
set role anon;
select test.check_raises_like('anon cannot ask',
  $f$select public.submit_number_change('+12675557204', 'X', 'Y', 'Z', '')$f$, '%permission denied%');
set role authenticated;
select set_config('request.jwt.claim.sub', :'tmp3', false);
select test.check('the protected request reads "waiting" to the asker, like any other',
  (select count(*) from public.my_number_change() where status = 'waiting'), 1::bigint);
select test.check_raises_like('one waiting request at a time',
  $f$select public.submit_number_change('+12675557201', 'Bea', 'Boss', 'Philadelphia', '')$f$, '%ALREADY_WAITING%');
select set_config('request.jwt.claim.sub', :'mem', false);
select test.check_raises_like('a number with an account signs in instead',
  $f$select public.submit_number_change('+12675557205', 'Mo', 'Moved', 'Philadelphia', '')$f$, '%HAS_ACCOUNT%');

\echo ''
\echo '--- Who sees what to decide ---'
select set_config('request.jwt.claim.sub', :'cm', false);
select test.check('the case manager sees the one routed to them, with their member',
  (select count(*) from public.number_changes_to_decide() where member_id = :'mem'::uuid), 1::bigint);
select test.check('...and nothing else',
  (select count(*) from public.number_changes_to_decide()), 1::bigint);
select set_config('request.jwt.claim.sub', :'cm2', false);
select test.check('another case manager sees none',
  (select count(*) from public.number_changes_to_decide()), 0::bigint);
select test.check_raises_like('...and cannot open one',
  format($f$select * from public.number_change_detail(%L)$f$,
         :'r_mem'), '%REQUEST_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('the super admin sees the four routed to them, not the case manager''s (not yet 24 hours)',
  (select count(*) from public.number_changes_to_decide()), 4::bigint);
select test.check('the protected one is marked',
  (select count(*) from public.number_changes_to_decide() where is_protected), 1::bigint);
select set_config('request.jwt.claim.sub', :'lead', false);
select test.check('a program lead sees none',
  (select count(*) from public.number_changes_to_decide()), 0::bigint);

reset role;
update public.number_change_requests set created_at = now() - interval '25 hours' where requester_id = :'tmp1'::uuid;
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('after 24 hours undecided, the super admin sees it too, marked as escalated',
  (select count(*) from public.number_changes_to_decide() where escalated), 1::bigint);

\echo ''
\echo '--- The side by side ---'
select set_config('request.jwt.claim.sub', :'cm', false);
select test.check('the case manager sees the typed name beside the account''s, the last 4 of the old number, and no tick asked of them',
  (select count(*) from public.number_change_detail(:'r_mem')
     where first_name = 'Mo' and account_first = 'Mo' and old_phone_last4 = '7204' and new_phone = '+12675557211' and not must_speak), 1::bigint);
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('the super admin is asked for the tick',
  (select count(*) from public.number_change_detail(:'r_lone') where must_speak), 1::bigint);
select test.check('a staff account is marked as staff',
  (select count(*) from public.number_change_detail(:'r_lead') where is_staff), 1::bigint);

\echo ''
\echo '--- Deciding ---'
select test.check_raises_like('a super admin''s account is never moved',
  format($f$select public.decide_number_change(%L, 'approved', true)$f$, :'r_boss'), '%CANNOT_MOVE%');
select test.check_raises_like('no account: nothing to approve',
  format($f$select public.decide_number_change(%L, 'approved', true)$f$, :'r_none'), '%NO_ACCOUNT%');
select test.check_raises_like('the super admin cannot approve without the tick',
  format($f$select public.decide_number_change(%L, 'approved', false)$f$, :'r_lone'), '%MUST_SPEAK%');
select public.decide_number_change(:'r_lone', 'approved', true);
select public.decide_number_change(:'r_boss', 'denied', false);
select set_config('request.jwt.claim.sub', :'mem', false);
select test.check_raises_like('a member cannot decide (not even their own)',
  format($f$select public.decide_number_change(%L, 'approved', true)$f$, :'r_mem'), '%REQUEST_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'cm', false);
select public.decide_number_change(:'r_mem', 'approved', false);
select test.check_raises_like('decided once',
  format($f$select public.decide_number_change(%L, 'denied', false)$f$, :'r_mem'), '%REQUEST_ALREADY_DECIDED%');
reset role;
select test.check('the super admin''s yes keeps the tick; the case manager''s needs none',
  (select count(*) from public.number_change_requests where (requester_id = :'tmp5'::uuid and spoke_to_them) or (requester_id = :'tmp1'::uuid and spoke_to_them is null and status = 'approved')), 2::bigint);
select test.check('the audit rows carry the tick and no phone or name',
  (select count(*) from public.audit_log where action like 'number_change.%' and meta::text !~ '\+1267' and meta::text !~ 'Mo|Lu|Bea'
     and target_id in (:'mem', :'lone', :'boss')), 3::bigint);
select test.check('approving changes nothing on the account by itself: the move is the function''s',
  (select count(*) from public.profiles where id = :'mem'::uuid and phone = '+12675557204'), 1::bigint);

\echo ''
\echo '--- Moving (service role, as the move-number function) ---'
set role service_role;
select test.check('only the approver''s own request is offered to move',
  (select count(*) from public.number_change_to_move(:'r_mem', :'boss')), 0::bigint);
select test.check('...the approver gets it',
  (select count(*) from public.number_change_to_move(:'r_mem', :'cm')
     where profile_id = :'mem'::uuid and new_phone = '+12675557211'), 1::bigint);
-- The function removes the temporary sign-in and moves the auth phone; here, as it would.
reset role;
delete from auth.users where id = :'tmp1'::uuid;
update auth.users set phone = '12675557211' where id = :'mem'::uuid;
set role service_role;
select public.number_change_moved(:'r_mem');
reset role;
select test.check('the account now has the new number',
  (select count(*) from public.profiles where id = :'mem'::uuid and phone = '+12675557211'), 1::bigint);
select test.check('the request says it moved, and forgets the temporary sign-in',
  (select count(*) from public.number_change_requests where old_phone = '+12675557204' and moved_at is not null and requester_id is null), 1::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'cm', false);
select test.check_raises_like('the move functions are not for signed-in people',
  format($f$select public.number_change_moved(%L)$f$, :'r_mem'), '%permission denied%');

\echo ''
\echo '--- Limits ---'
reset role;
delete from public.number_change_requests where requester_id = :'tmp6'::uuid;
insert into public.number_change_requests (requester_id, new_phone, old_phone, first_name, last_name, city, routed_to, status, created_at)
select :'tmp6', '+12675557216', '+12675557288', 'X', 'Y', 'Z', 'super_admin', 'denied', now() - interval '1 hour' from generate_series(1, 3);
set role authenticated;
select set_config('request.jwt.claim.sub', :'tmp6', false);
select test.check_raises_like('three a day from one new number',
  $f$select public.submit_number_change('+12675557277', 'X', 'Y', 'Z', '')$f$, '%TOO_MANY%');
reset role;
delete from public.number_change_requests where requester_id = :'tmp6'::uuid;
insert into public.number_change_requests (requester_id, new_phone, old_phone, first_name, last_name, city, routed_to, status, created_at)
select null, '+1267555729' || g, '+12675557205', 'X', 'Y', 'Z', 'super_admin', 'denied', now() - interval '2 days' from generate_series(1, 3) g;
set role authenticated;
select set_config('request.jwt.claim.sub', :'tmp6', false);
select test.check_raises_like('three a week for one old number',
  $f$select public.submit_number_change('+12675557205', 'Lu', 'Alone', 'Philadelphia', '')$f$, '%TOO_MANY%');

\echo ''
\echo '--- Forgetting ---'
reset role;
update public.number_change_requests set decided_at = now() - interval '91 days' where old_phone = '+12675557201';
select public.purge_number_change_requests();
select test.check('a request decided more than 90 days ago is gone',
  (select count(*) from public.number_change_requests where old_phone = '+12675557201'), 0::bigint);
select test.check('...a recent one stays',
  (select count(*) from public.number_change_requests where old_phone = '+12675557204'), 1::bigint);
delete from public.profiles where id = :'lead'::uuid;
select test.check('deleting the account deletes its requests',
  (select count(*) from public.number_change_requests where old_phone = '+12675557206'), 0::bigint);
