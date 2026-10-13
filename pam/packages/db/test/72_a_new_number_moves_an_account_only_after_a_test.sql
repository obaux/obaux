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
select test.check('a member''s number: the reply is "received"',
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
  (select count(*) from public.number_change_requests where id = :'r_mem' and new_phone = '+12675557211' and old_phone = '+12675557204'), 1::bigint);

\echo ''
\echo '--- The super admin decides every one; a super admin''s account is protected ---'
select test.check('every request goes to the super admin, a member with a case manager included',
  (select count(*) from public.number_change_requests where id in (:'r_mem', :'r_none', :'r_boss', :'r_lead', :'r_lone') and routed_to = 'super_admin' and case_manager_id is null), 5::bigint);
select test.check('a super admin''s account is protected',
  (select count(*) from public.number_change_requests where id = :'r_boss' and is_protected), 1::bigint);

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
\echo '--- Only the super admin sees and opens them (not the member''s case manager, for now) ---'
select set_config('request.jwt.claim.sub', :'cm', false);
select test.check('the member''s own case manager sees none (transparency.ts: not without Will''s signature)',
  (select count(*) from public.number_changes_to_decide()), 0::bigint);
select test.check_raises_like('...and cannot open one',
  format($f$select * from public.number_change_detail(%L)$f$, :'r_mem'), '%REQUEST_NOT_FOUND%');
select test.check_raises_like('...or decide one',
  format($f$select public.decide_number_change(%L, 'approved', true)$f$, :'r_mem'), '%REQUEST_NOT_FOUND%');
select set_config('request.jwt.claim.sub', :'lead', false);
select test.check('a program lead sees none',
  (select count(*) from public.number_changes_to_decide()), 0::bigint);
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check('the super admin sees all five',
  (select count(*) from public.number_changes_to_decide()), 5::bigint);
select test.check('the protected one is marked',
  (select count(*) from public.number_changes_to_decide() where is_protected), 1::bigint);

\echo ''
\echo '--- The side by side ---'
select test.check('typed beside the account, the last 4 of the old number, the new number in full, the tick asked for',
  (select count(*) from public.number_change_detail(:'r_mem')
     where first_name = 'Mo' and account_first = 'Mo' and old_phone_last4 = '7204' and new_phone = '+12675557211' and must_speak), 1::bigint);
select test.check('a staff account is marked as staff',
  (select count(*) from public.number_change_detail(:'r_lead') where is_staff), 1::bigint);

\echo ''
\echo '--- Deciding ---'
select test.check_raises_like('a super admin''s account is never moved',
  format($f$select public.decide_number_change(%L, 'approved', true)$f$, :'r_boss'), '%CANNOT_MOVE%');
select test.check_raises_like('no account: nothing to approve',
  format($f$select public.decide_number_change(%L, 'approved', true)$f$, :'r_none'), '%NO_ACCOUNT%');
select test.check_raises_like('no Approve without the tick',
  format($f$select public.decide_number_change(%L, 'approved', false)$f$, :'r_mem'), '%MUST_SPEAK%');
select public.decide_number_change(:'r_mem', 'approved', true);
select public.decide_number_change(:'r_boss', 'denied', false);
select test.check_raises_like('decided once',
  format($f$select public.decide_number_change(%L, 'denied', false)$f$, :'r_mem'), '%REQUEST_ALREADY_DECIDED%');
set role authenticated;
select set_config('request.jwt.claim.sub', :'mem', false);
select test.check_raises_like('a member cannot decide (not even their own)',
  format($f$select public.decide_number_change(%L, 'approved', true)$f$, :'r_lone'), '%REQUEST_NOT_FOUND%');
reset role;
select test.check('a no deletes the temporary sign-in at once',
  (select count(*) from auth.users where id = :'tmp3'::uuid), 0::bigint);
select test.check('...and the request remembers the no, without the sign-in',
  (select count(*) from public.number_change_requests where id = :'r_boss' and status = 'denied' and requester_id is null), 1::bigint);
select test.check('a no never deletes a sign-in that has an account',
  (select count(*) from auth.users where id = :'boss'::uuid), 1::bigint);
select test.check('the yes keeps the tick',
  (select count(*) from public.number_change_requests where id = :'r_mem' and status = 'approved' and spoke_to_them), 1::bigint);
select test.check('the audit rows carry the tick and no phone, name or city',
  (select count(*) from public.audit_log where action like 'number_change.%' and meta::text !~ '\+1267|7204|Philadelphia|Mo|Bea'
     and target_id in (:'mem', :'boss')), 2::bigint);
select test.check('approving changes nothing on the account by itself: the move is the function''s',
  (select count(*) from public.profiles where id = :'mem'::uuid and phone = '+12675557204'), 1::bigint);

\echo ''
\echo '--- Moving (service role, as the move-number function) ---'
set role service_role;
select test.check('only the approver''s own request is offered to move',
  (select count(*) from public.number_change_to_move(:'r_mem', :'cm')), 0::bigint);
select test.check('...the approver gets it',
  (select count(*) from public.number_change_to_move(:'r_mem', :'boss') where profile_id = :'mem'::uuid and new_phone = '+12675557211'), 1::bigint);
-- The function removes the temporary sign-in and moves the auth phone; here, as it would.
reset role;
delete from auth.users where id = :'tmp1'::uuid;
update auth.users set phone = '12675557211' where id = :'mem'::uuid;
set role service_role;
select public.number_change_moved(:'r_mem');
reset role;
select test.check('the account now has the new number, and the old one is not on it',
  (select count(*) from public.profiles where id = :'mem'::uuid and phone = '+12675557211'), 1::bigint);
select test.check('the request says it moved, and forgets the temporary sign-in',
  (select count(*) from public.number_change_requests where id = :'r_mem' and moved_at is not null and requester_id is null), 1::bigint);
set role authenticated;
select set_config('request.jwt.claim.sub', :'boss', false);
select test.check_raises_like('the move functions are not for signed-in people',
  format($f$select public.number_change_moved(%L)$f$, :'r_mem'), '%permission denied%');
select test.check_raises_like('nor is removing a sign-in',
  format($f$select public.remove_temporary_signin(%L)$f$, :'tmp5'), '%permission denied%');
set role anon;
select test.check_raises_like('nor for anon',
  format($f$select public.remove_temporary_signin(%L)$f$, :'tmp5'), '%permission denied%');
reset role;
select public.remove_temporary_signin(:'lone');
select test.check('it refuses a sign-in that has a profile',
  (select count(*) from auth.users where id = :'lone'::uuid), 1::bigint);

\echo ''
\echo '--- Limits ---'
reset role;
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
delete from public.number_change_requests where old_phone = '+12675557205' and requester_id is null;
-- Decided 91 days ago (the no above), made 91 days ago and never decided (Lu's), and a recent yes.
update public.number_change_requests set decided_at = now() - interval '91 days' where id = :'r_boss';
update public.number_change_requests set created_at = now() - interval '91 days' where id = :'r_lone';
-- Approved 91 days ago, but the move never ran: its temporary sign-in still holds the new number.
insert into public.number_change_requests (requester_id, new_phone, old_phone, first_name, last_name, city, routed_to, status, decided_at, created_at)
values (:'tmp6', '+12675557216', '+12675557204', 'X', 'Y', 'Z', 'super_admin', 'approved', now() - interval '91 days', now() - interval '92 days')
returning id as r_stuck \gset
select public.purge_number_change_requests();
select test.check('a request decided more than 90 days ago is gone, with both numbers',
  (select count(*) from public.number_change_requests where id = :'r_boss'), 0::bigint);
select test.check('one nobody decided in 90 days is gone',
  (select count(*) from public.number_change_requests where id = :'r_lone'), 0::bigint);
select test.check('...and took its temporary sign-in with it',
  (select count(*) from auth.users where id = :'tmp5'::uuid), 0::bigint);
select test.check('an approved request whose move never ran is gone',
  (select count(*) from public.number_change_requests where id = :'r_stuck'), 0::bigint);
select test.check('...with its temporary sign-in (the new number goes with the request)',
  (select count(*) from auth.users where id = :'tmp6'::uuid), 0::bigint);
select test.check('...but never the account its old number belongs to',
  (select count(*) from auth.users where id = :'lone'::uuid), 1::bigint);
select test.check('a recent one stays',
  (select count(*) from public.number_change_requests where id = :'r_mem'), 1::bigint);
delete from public.profiles where id = :'lead'::uuid;
select test.check('deleting the account deletes its requests',
  (select count(*) from public.number_change_requests where id = :'r_lead'), 0::bigint);
