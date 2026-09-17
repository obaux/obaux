-- Invite lifecycle (§4.1) — the only door into PAM.

\set ON_ERROR_STOP on
set client_min_messages to notice;

\set admin_north '33333333-0000-0000-0000-00000000000a'
\set admin_south '33333333-0000-0000-0000-00000000000b'
\set marcus      '33333333-0000-0000-0000-00000000000c'

\echo ''
\echo '--- Invite creation is admin-only and region-scoped ---'

-- A new person who has verified their phone but has no profile yet.
insert into auth.users (id, phone) values
  ('33333333-0000-0000-0000-0000000000f1', '+15555550111'),
  ('33333333-0000-0000-0000-0000000000f2', '+15555550222');

set role authenticated;
select test.as_user(:'marcus');

do $$
begin
  begin
    perform public.create_invite('member');
    raise exception 'FAIL  a member was able to create an invite';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a member cannot create an invite (%)', left(sqlerrm, 44);
  end;
end;
$$;

select test.as_user(:'admin_north');

do $$
declare
  inv public.invites;
begin
  inv := public.create_invite('member', '+15555550111');
  if inv.code !~ '^[34679ACDEFGHJKMNPQRTUVWXY]{8}$' then
    raise exception 'FAIL  invite code % has an unexpected shape', inv.code;
  end if;
  if inv.region_id is null then
    raise exception 'FAIL  invite did not inherit the admin region';
  end if;
  raise notice 'ok    admin created invite % in their own region', inv.code;
end;
$$;

do $$
begin
  begin
    perform public.create_invite('admin');
    raise exception 'FAIL  an admin invite code was issued';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    admin accounts cannot be created by invite code';
  end;
end;
$$;

\echo ''
\echo '--- Redemption enforces the phone prefill (§4.1 step 2) ---'

-- A brand-new user cannot SELECT from `invites` at all — that is deliberate, so
-- a stolen code cannot be used to enumerate pending invites. The test therefore
-- stashes the code as postgres and hands it over the way a person would: as a
-- string they typed in.
reset role;
select set_config(
  'pam.test_code',
  (select i.code from public.invites i
    where i.phone = '+15555550111' and i.status = 'pending' limit 1),
  false);

set role authenticated;

-- The wrong person tries the code they overheard.
select test.as_user('33333333-0000-0000-0000-0000000000f2');
do $$
declare
  code text := current_setting('pam.test_code');
begin
  begin
    perform public.redeem_invite(code, 'Impostor');
    raise exception 'FAIL  a mismatched phone redeemed the invite';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    -- Must fail on the phone check specifically, not because the row was
    -- invisible: an invisible row would pass this test for the wrong reason.
    if sqlerrm <> 'INVITE_PHONE_MISMATCH' then
      raise exception 'FAIL  expected INVITE_PHONE_MISMATCH, got %', sqlerrm;
    end if;
    raise notice 'ok    a different phone cannot redeem a prefilled invite';
  end;
end;
$$;

-- The intended person redeems it.
select test.as_user('33333333-0000-0000-0000-0000000000f1');
do $$
declare
  code text := current_setting('pam.test_code');
  p public.profiles;
begin
  p := public.redeem_invite(code, 'Rosa', 'es');

  if p.role <> 'member' then raise exception 'FAIL  role came from the client, not the invite'; end if;
  if p.first_name <> 'Rosa' then raise exception 'FAIL  first name not stored'; end if;
  if p.preferred_language <> 'es' then raise exception 'FAIL  language not stored'; end if;
  if p.region_id is null then raise exception 'FAIL  region did not come from the invite'; end if;
  raise notice 'ok    invite redeemed; role and region came from the invite';
end;
$$;

-- Rosa now has a profile, so a second attempt by her stops at the "already set
-- up" guard before the invite is even looked at.
do $$
declare
  code text := current_setting('pam.test_code');
begin
  begin
    perform public.redeem_invite(code);
    raise exception 'FAIL  an existing account re-ran setup';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    an account that is already set up cannot redeem again';
  end;
end;
$$;

-- A used code must also be refused for someone who has NO profile yet, which is
-- the case that actually reaches the invite status check.
reset role;
insert into auth.users (id, phone) values
  ('33333333-0000-0000-0000-0000000000f3', '+15555550333'),
  ('33333333-0000-0000-0000-0000000000f4', '+15555550444');

set role authenticated;
select test.as_user('33333333-0000-0000-0000-00000000000a');
do $$
declare
  inv public.invites;
begin
  -- No phone prefill: the code alone is the credential.
  inv := public.create_invite('member');
  perform set_config('pam.open_code', inv.code, false);
  raise notice 'ok    admin created an open invite %', inv.code;
end;
$$;

select test.as_user('33333333-0000-0000-0000-0000000000f3');
do $$
declare
  p public.profiles;
begin
  p := public.redeem_invite(current_setting('pam.open_code'), 'Dee');
  if p.role <> 'member' then raise exception 'FAIL  unexpected role %', p.role; end if;
  raise notice 'ok    an open invite redeems without a phone prefill';
end;
$$;

select test.as_user('33333333-0000-0000-0000-0000000000f4');
do $$
begin
  begin
    perform public.redeem_invite(current_setting('pam.open_code'), 'Second');
    raise exception 'FAIL  a used code was redeemed twice';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    if sqlerrm <> 'INVITE_ALREADY_USED' then
      raise exception 'FAIL  expected INVITE_ALREADY_USED, got %', sqlerrm;
    end if;
    raise notice 'ok    a used code cannot be redeemed by anyone else';
  end;
end;
$$;

do $$
begin
  begin
    perform public.redeem_invite('QQQQQQQQ', 'Nobody');
    raise exception 'FAIL  an unknown code was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    if sqlerrm <> 'INVITE_NOT_FOUND' then
      raise exception 'FAIL  expected INVITE_NOT_FOUND, got %', sqlerrm;
    end if;
    raise notice 'ok    an unknown code is refused';
  end;
end;
$$;

reset role;

do $$
declare
  n integer;
begin
  select count(*) into n from public.admin_assignments
  where member_id = '33333333-0000-0000-0000-0000000000f1'
    and admin_id = '33333333-0000-0000-0000-00000000000a';
  if n <> 1 then
    raise exception 'FAIL  redeemed member did not land on the inviting admin caseload';
  end if;
  raise notice 'ok    redeemed member landed on the inviting admin caseload';
end;
$$;

\echo ''
\echo '--- Access changes require a reason and are always logged (§4.1) ---'

set role authenticated;
select test.as_user(:'admin_north');

do $$
begin
  begin
    perform public.admin_set_feature_access(
      '33333333-0000-0000-0000-00000000000c', 'map', false, '   ');
    raise exception 'FAIL  a blank reason was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a blank reason is rejected';
  end;
end;
$$;

do $$
declare
  logged integer;
begin
  perform public.admin_set_feature_access(
    '33333333-0000-0000-0000-00000000000c', 'buddies', false,
    'Paused at the member''s request while they settle in',
    'The buddy feed is off for now. Call the person who invited you with questions.');

  select count(*) into logged from public.audit_log
  where action = 'access.set' and target_id = '33333333-0000-0000-0000-00000000000c';

  if logged < 1 then raise exception 'FAIL  the access change was not logged'; end if;
  raise notice 'ok    access change applied and written to audit_log';
end;
$$;

-- An admin cannot reach outside their region, even through the RPC.
select test.as_user(:'admin_south');
do $$
begin
  begin
    perform public.admin_set_feature_access(
      '33333333-0000-0000-0000-00000000000c', 'map', false, 'testing cross-region');
    raise exception 'FAIL  an admin changed access for another region''s member';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    an admin cannot change access outside their region';
  end;
end;
$$;

\echo ''
\echo '--- access_controls actually blocks the write it names (§4) ---'

-- Marcus had the buddy feed turned off above. A switched-off feature is refused
-- by the policy, not merely hidden by a screen — otherwise it is decoration.
select test.as_user(:'marcus');
do $$
begin
  begin
    insert into public.activities (member_id, kind, visibility, body)
    values ('33333333-0000-0000-0000-00000000000c', 'note', 'buddies', 'still here?');
    raise exception 'FAIL  a member with the buddy feed disabled could still post';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a switched-off feature blocks the write server-side (%)', left(sqlerrm, 40);
  end;
end;
$$;

\echo ''
\echo '--- ...and messaging is never one of them (0031) ---'
do $$
declare n integer;
begin
  -- The inverse, and the one that matters most: whatever an admin has done,
  -- a member can still reach the people this product connected them to.
  insert into public.messages (conversation_id, sender_id, body)
  values ('66666666-0000-0000-0000-000000000001',
          '33333333-0000-0000-0000-00000000000c', 'can I still talk?');

  select count(*) into n from public.messages
  where sender_id = '33333333-0000-0000-0000-00000000000c'
    and body = 'can I still talk?';

  if n <> 1 then raise exception 'FAIL  a member could not send a message'; end if;
  raise notice 'ok    a member can always send a message';
end;
$$;

\echo ''
\echo '--- Points balance is the ledger sum (§8) ---'
do $$
declare
  bal integer;
  expected integer;
begin
  -- Computed from the ledger rather than hard-coded. It used to assert a flat
  -- 100 and broke the day saving a place started earning points (0045) — the
  -- seed saves places, so the seeded balance moved. A test that has to be
  -- edited every time a real rule lands is a test that stops meaning anything.
  select coalesce(sum(delta), 0) into expected
  from public.points_ledger where member_id = '33333333-0000-0000-0000-00000000000c';

  bal := public.member_points('33333333-0000-0000-0000-00000000000c');
  if bal <> expected then
    raise exception 'FAIL  member_points said %, the ledger says %', bal, expected;
  end if;
  if bal <= 0 then
    raise exception 'FAIL  the seeded member has no points at all, so this proves nothing';
  end if;
  raise notice 'ok    member_points returns the ledger sum (%)', bal;
end;
$$;

reset role;

\echo ''
\echo '--- SECURITY DEFINER helpers do not answer for other people (0010) ---'

set role authenticated;

-- Supabase exposes every public function over PostgREST, so a definer function
-- taking a caller-supplied id is directly callable with someone else's. These
-- assert the self-participation guards hold.
-- Tanya: same region as Marcus, but not a buddy and not on his chats.
select test.as_user('33333333-0000-0000-0000-00000000000d');
do $$
declare
  v integer;
begin
  v := public.member_points('33333333-0000-0000-0000-00000000000c');
  if v is not null then
    raise exception 'FAIL  a member read another member''s points balance (got %)', v;
  end if;
  raise notice 'ok    member_points returns null for someone else''s id';
end;
$$;

do $$
begin
  if public.are_buddies('33333333-0000-0000-0000-00000000000c',
                        '33333333-0000-0000-0000-000000000011') then
    raise exception 'FAIL  a non-participant probed the buddy graph';
  end if;
  raise notice 'ok    are_buddies refuses a pair the caller is not in';
end;
$$;

do $$
begin
  if public.is_blocked_between('33333333-0000-0000-0000-00000000000c',
                               '33333333-0000-0000-0000-000000000013') then
    raise exception 'FAIL  a non-participant probed block relationships';
  end if;
  raise notice 'ok    is_blocked_between refuses a pair the caller is not in';
end;
$$;

do $$
begin
  -- Marcus had chat turned off earlier. A stranger must not learn that.
  if not public.feature_allowed('33333333-0000-0000-0000-00000000000c', 'chat') then
    raise exception 'FAIL  a stranger read another user''s access controls';
  end if;
  raise notice 'ok    feature_allowed hides another user''s access controls';
end;
$$;

-- The people who SHOULD see these still do.
select test.as_user(:'marcus');
do $$
declare
  v integer;
begin
  -- A number, not a specific number: what is being proved here is that the
  -- guard lets the owner through, and the seeded balance moves whenever a real
  -- points rule lands (0045 was the first).
  v := public.member_points('33333333-0000-0000-0000-00000000000c');
  if v is null or v <= 0 then
    raise exception 'FAIL  a member cannot read their own balance (got %)', v;
  end if;
  raise notice 'ok    a member still reads their own balance';
end;
$$;

do $$
begin
  if not public.are_buddies('33333333-0000-0000-0000-00000000000c',
                            '33333333-0000-0000-0000-000000000011') then
    raise exception 'FAIL  a participant cannot see their own buddy link';
  end if;
  raise notice 'ok    a participant still sees their own buddy link';
end;
$$;

select test.as_user(:'admin_north');
do $$
declare
  v integer;
begin
  v := public.member_points('33333333-0000-0000-0000-00000000000c');
  if v is null or v <= 0 then
    raise exception 'FAIL  an admin cannot read caseload points (got %)', v;
  end if;
  raise notice 'ok    an admin still reads their caseload''s points';
end;
$$;

select test.as_user(:'admin_south');
do $$
declare
  v integer;
begin
  v := public.member_points('33333333-0000-0000-0000-00000000000c');
  if v is not null then
    raise exception 'FAIL  an out-of-region admin read points (got %)', v;
  end if;
  raise notice 'ok    an out-of-region admin gets null';
end;
$$;

reset role;

-- ===========================================================================
\echo ''
\echo '--- Messaging is refused through the admin RPC too (0031) ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'admin_north');

do $$
begin
  -- The trigger is the boundary, but this is the path an admin panel takes, so
  -- it is the one worth proving: a case manager cannot cut somebody off from
  -- the people this product exists to connect them to.
  begin
    perform public.admin_set_feature_access(
      '33333333-0000-0000-0000-00000000000c', 'chat', false,
      'Any reason at all', 'Anything at all');
    raise exception 'FAIL  an admin switched off a member''s messages';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    an admin cannot switch off a member''s messages';
  end;
end;
$$;

reset role;

-- ===========================================================================
\echo ''
\echo '--- A case manager sees a message only when somebody reports it (0034) ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'marcus');

do $$
declare
  v_msg uuid;
  rep public.reports;
  ok boolean := false;
begin
  -- Somebody else's message in Marcus's own conversation.
  select id into v_msg from public.messages
  where conversation_id = '66666666-0000-0000-0000-000000000001'
    and sender_id <> '33333333-0000-0000-0000-00000000000c'
  limit 1;

  if v_msg is null then
    raise notice 'skip  no counterpart message in the fixture';
    return;
  end if;

  rep := public.report_message(v_msg, 'This felt threatening');

  -- The quote is the database's copy of what was sent, not the reporter's.
  if rep.target_excerpt is null then
    raise exception 'FAIL  the report carried no excerpt';
  end if;
  if rep.target_excerpt <> (select body from public.messages where id = v_msg) then
    raise exception 'FAIL  the excerpt is not what was actually sent';
  end if;
  raise notice 'ok    the reported message is quoted by the database';

  -- A hand-written "quote" reviewed by somebody with power over you is a way
  -- to do harm with the safety feature. The direct route is closed.
  begin
    insert into public.reports (reporter_id, target_type, target_id, reason, target_excerpt)
    values ('33333333-0000-0000-0000-00000000000c', 'message', v_msg,
            'made up', 'words the other person never wrote');
  exception when others then
    ok := true;
  end;
  if not ok then
    raise exception 'FAIL  a reporter wrote their own excerpt into a report';
  end if;
  raise notice 'ok    a reporter cannot write the quote themselves';
end;
$$;

-- And the boundary that makes option C true at all: an admin cannot read the
-- messages table, reported or not. The excerpt on the report is the only route.
select test.as_user(:'admin_north');
do $$
declare n integer;
begin
  select count(*) into n from public.messages;
  if n <> 0 then
    raise exception 'FAIL  a case manager read % message row(s)', n;
  end if;
  raise notice 'ok    a case manager cannot read the messages table at all';

  select count(*) into n from public.reports
  where target_type = 'message' and target_excerpt is not null;
  if n < 1 then
    raise exception 'FAIL  a case manager cannot see the reported excerpt';
  end if;
  raise notice 'ok    ...and sees the reported message through the report';
end;
$$;

reset role;

-- ===========================================================================
\echo ''
\echo '--- The queue decides who is texted, not the dispatcher (0039) ---'
-- ===========================================================================
-- The dispatcher can be redeployed by anybody with access to the project. These
-- promises cannot be, because they are enforced here: a member who said stop is
-- never texted again, and nobody is woken at 3am.

set local role postgres;

do $$
declare
  marcus uuid := '33333333-0000-0000-0000-00000000000c';
  tanya  uuid := '33333333-0000-0000-0000-00000000000d';
  nia    uuid := '33333333-0000-0000-0000-000000000011';
  n integer;
  claimed_ids uuid[];
begin
  -- Everyone needs a number, or they fail for a different reason than we are
  -- testing. Fixture numbers, not anybody's.
  update public.profiles set phone = '+12025550101' where id = marcus;
  update public.profiles set phone = '+12025550102' where id = tanya;
  update public.profiles set phone = null            where id = nia;

  -- Marcus is available now; Tanya replied STOP; Nia has no number.
  insert into public.notification_preferences (member_id, sms_stopped_at)
  values (tanya, now())
  on conflict (member_id) do update set sms_stopped_at = now();

  insert into public.outbound_messages (id, member_id, template_key, vars) values
    ('aaaaaaa1-0000-0000-0000-000000000001', marcus, 'attendance_check', '{}'),
    ('aaaaaaa1-0000-0000-0000-000000000002', tanya,  'attendance_check', '{}'),
    ('aaaaaaa1-0000-0000-0000-000000000003', nia,    'attendance_check', '{}');

  -- Quiet hours wrap midnight, so the window has to be tested on both sides.
  if not public.in_quiet_hours(marcus, '2026-09-12 22:30:00-04'::timestamptz) then
    raise exception 'FAIL  a member would be texted at 22:30';
  end if;
  if not public.in_quiet_hours(marcus, '2026-09-12 03:00:00-04'::timestamptz) then
    raise exception 'FAIL  a member would be texted at 03:00';
  end if;
  if public.in_quiet_hours(marcus, '2026-09-12 13:00:00-04'::timestamptz) then
    raise exception 'FAIL  a member would not be texted at 13:00';
  end if;
  raise notice 'ok    quiet hours cover the night and wrap midnight';

  select array_agg(id) into claimed_ids from public.claim_outbound_messages(50);

  if not ('aaaaaaa1-0000-0000-0000-000000000001' = any(coalesce(claimed_ids, '{}')))
     and not public.in_quiet_hours(marcus) then
    raise exception 'FAIL  an available member was not claimed';
  end if;

  if 'aaaaaaa1-0000-0000-0000-000000000002' = any(coalesce(claimed_ids, '{}')) then
    raise exception 'FAIL  a member who replied STOP was handed to the dispatcher';
  end if;
  if 'aaaaaaa1-0000-0000-0000-000000000003' = any(coalesce(claimed_ids, '{}')) then
    raise exception 'FAIL  a member with no phone number was handed to the dispatcher';
  end if;
  raise notice 'ok    a STOP and a missing number never reach the dispatcher';

  select count(*) into n from public.outbound_messages
  where id = 'aaaaaaa1-0000-0000-0000-000000000002' and status = 'cancelled';
  if n <> 1 then
    raise exception 'FAIL  a STOP left the message queued to be retried forever';
  end if;
  raise notice 'ok    a STOP takes the message out of the queue for good';

  -- Claiming is what stops two overlapping runs sending the same reminder.
  select count(*) into n from public.claim_outbound_messages(50);
  if n <> 0 then
    raise exception 'FAIL  a second run claimed % message(s) the first one took', n;
  end if;
  raise notice 'ok    a second run finds nothing left to send';
end;
$$;

-- The dispatcher reporting a failure has to be able to correct the optimistic
-- claim, or a message nobody received stays recorded as sent.
do $$
declare
  v_status text;
begin
  perform public.mark_outbound_failed(
    'aaaaaaa1-0000-0000-0000-000000000001', 'copy is not signed off');

  select status::text into v_status from public.outbound_messages
  where id = 'aaaaaaa1-0000-0000-0000-000000000001';

  if v_status <> 'failed' then
    raise exception 'FAIL  a message that never sent is still recorded as %', v_status;
  end if;
  raise notice 'ok    a message that did not send stops being recorded as sent';
end;
$$;

delete from public.outbound_messages
where id in ('aaaaaaa1-0000-0000-0000-000000000001',
             'aaaaaaa1-0000-0000-0000-000000000002',
             'aaaaaaa1-0000-0000-0000-000000000003');

reset role;

\echo ''
\echo '--- The people directory is a super admin surface, and only that ---'

-- 0043 added the first read a super admin has over other people's accounts.
-- PostgREST exposes every function in `public`, so the interesting question is
-- not "does it work for Will" but "what does it hand to everybody else".
do $$
declare
  v_marcus uuid := '33333333-0000-0000-0000-00000000000c';
  v_admin  uuid := '33333333-0000-0000-0000-00000000000a';
  n integer;
  v_role text;
begin
  -- A member calling it directly gets nothing. Not an error — nothing. There is
  -- no difference between "you may not" and "there is no one", so there is
  -- nothing to probe.
  perform set_config('request.jwt.claim.sub', v_marcus::text, true);
  select count(*) into n from public.directory_people(null);
  if n <> 0 then
    raise exception 'FAIL  a member read % rows of the people directory', n;
  end if;
  raise notice 'ok    a member gets nothing from the directory';

  -- A case manager is not a super admin either. Their own caseload is theirs;
  -- everybody else's is not.
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  select count(*) into n from public.directory_people(null);
  if n <> 0 then
    raise exception 'FAIL  a case manager read % rows of the people directory', n;
  end if;
  raise notice 'ok    a case manager gets nothing from the directory';

  -- Promoted, the same call answers.
  update public.profiles set role = 'super_admin' where id = v_admin;
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  select count(*) into n from public.directory_people(null);
  if n < 2 then
    raise exception 'FAIL  a super admin sees % accounts, expected the seed', n;
  end if;
  raise notice 'ok    a super admin sees the accounts';

  -- And the filter filters, rather than being decoration over the same list.
  select count(*) into n from public.directory_people('member');
  if n = 0 then
    raise exception 'FAIL  filtering to members returned nothing';
  end if;
  select count(*) into n
  from public.directory_people('member') d
  where d.role <> 'member';
  if n <> 0 then
    raise exception 'FAIL  filtering to members returned % rows that are not', n;
  end if;
  raise notice 'ok    the role filter returns only that role';

  -- The column list is the promise. A phone number is the one field on this
  -- table that reaches a person directly, and it is not here — this fails at
  -- parse time if somebody ever adds it.
  begin
    execute 'select phone from public.directory_people(null)';
    raise exception 'FAIL  the directory now returns a phone number';
  exception
    when undefined_column then
      raise notice 'ok    the directory carries no contact details';
  end;

  update public.profiles set role = 'admin' where id = v_admin;
  select role::text into v_role from public.profiles where id = v_admin;
  if v_role <> 'admin' then
    raise exception 'FAIL  the test left the case manager promoted';
  end if;
end;
$$;

\echo ''
\echo '--- A linked provider reads a name, never activity info (0062, D-166) ---'

-- Replaces the raw profiles_select_provider_linked policy this suite used to
-- exercise directly (see 02_rls_test.sql). Same two questions
-- directory_people's own coverage above asks of a different function: does
-- the guard actually gate it, and is the column list actually short.
do $$
declare
  v_marcus uuid := '33333333-0000-0000-0000-00000000000c';
  v_alice  uuid := '33333333-0000-0000-0000-00000000000f'; -- linked (enrolled) provider
  v_bob    uuid := '33333333-0000-0000-0000-000000000010'; -- unlinked provider
  n integer;
begin
  -- A member calling it gets nothing — this is a provider-only function.
  perform set_config('request.jwt.claim.sub', v_marcus::text, true);
  select count(*) into n from public.provider_linked_members();
  if n <> 0 then
    raise exception 'FAIL  a member read % rows from provider_linked_members()', n;
  end if;
  raise notice 'ok    a member gets nothing from provider_linked_members()';

  -- The unlinked provider is a provider, but this member is not theirs.
  perform set_config('request.jwt.claim.sub', v_bob::text, true);
  select count(*) into n from public.provider_linked_members() where id = v_marcus;
  if n <> 0 then
    raise exception 'FAIL  an unlinked provider read the member anyway';
  end if;
  raise notice 'ok    an unlinked provider gets nothing for this member';

  -- The linked provider is the actual case this function exists for.
  perform set_config('request.jwt.claim.sub', v_alice::text, true);
  select count(*) into n from public.provider_linked_members() where id = v_marcus;
  if n <> 1 then
    raise exception 'FAIL  a linked provider read % rows for their own enrolled member', n;
  end if;
  raise notice 'ok    a linked provider reads their enrolled member';

  -- The column list is the promise, the same way it is for directory_people.
  -- last_active_at is the fact Will named explicitly; phone is the contact
  -- detail 0043 already treats as the one column that must never be here.
  begin
    execute 'select last_active_at from public.provider_linked_members()';
    raise exception 'FAIL  provider_linked_members() now returns last_active_at';
  exception
    when undefined_column then
      raise notice 'ok    provider_linked_members() carries no activity info';
  end;

  begin
    execute 'select phone from public.provider_linked_members()';
    raise exception 'FAIL  provider_linked_members() now returns a phone number';
  exception
    when undefined_column then
      raise notice 'ok    provider_linked_members() carries no contact details';
  end;
end;
$$;

\echo ''
\echo '--- Saved places come back as places, and only your own ---'

-- 0044. The table has existed since 0003 with nothing writing to it; this is
-- the read behind the Save button, and the question worth asking is whether one
-- member can reach another member's list.
do $$
declare
  v_marcus uuid := '33333333-0000-0000-0000-00000000000c';
  v_tanya  uuid;
  v_service uuid;
  n integer;
  v_lat double precision;
begin
  -- Deliberately specific about which row. `where geo is not null limit 1`
  -- was picking whatever the heap handed back first, and by this point in the
  -- suite earlier tests have deactivated one place (0035) and flagged another
  -- (0033) — so the row was sometimes one a member is not allowed to see, and
  -- this assertion failed for a reason that had nothing to do with saving.
  -- Found when 0050 rewrote every description and changed the heap order.
  select id into v_service from public.services
  where geo is not null and is_active and not needs_review
  order by id
  limit 1;
  if v_service is null then
    raise exception 'FAIL  the seed has no visible service with a point to save';
  end if;

  select id into v_tanya from public.profiles
  where role = 'member' and id <> v_marcus limit 1;

  set local role postgres;
  insert into public.saved_places (member_id, service_id)
  values (v_marcus, v_service)
  on conflict do nothing;
  set local role authenticated;

  perform set_config('request.jwt.claim.sub', v_marcus::text, true);
  select count(*) into n from public.saved_places_mine();
  if n < 1 then
    raise exception 'FAIL  a member cannot read the place they just saved';
  end if;
  raise notice 'ok    a member reads their own saved places';

  -- The point comes back as a number, not as geography. A card builds its
  -- directions link from this, and an address string is what 0023 replaced.
  select lat into v_lat from public.saved_places_mine() limit 1;
  if v_lat is null then
    raise exception 'FAIL  a saved place came back without its own coordinates';
  end if;
  raise notice 'ok    a saved place carries the point, not an address string';

  if v_tanya is not null then
    perform set_config('request.jwt.claim.sub', v_tanya::text, true);
    select count(*) into n from public.saved_places_mine();
    if n <> 0 then
      raise exception 'FAIL  another member read % rows of somebody else''s saved list', n;
    end if;
    raise notice 'ok    one member cannot read another member''s saved places';
  end if;

  set local role postgres;
  delete from public.saved_places where member_id = v_marcus and service_id = v_service;
  set local role authenticated;
end;
$$;

\echo ''
\echo '--- Saving a place earns points, once ---'

-- 0045. The rule has been in the config since it was written; this is the
-- first thing to implement it, and the interesting case is the second save.
do $$
declare
  v_marcus uuid := '33333333-0000-0000-0000-00000000000c';
  v_admin  uuid := '33333333-0000-0000-0000-00000000000a';
  v_service uuid;
  v_before integer;
  v_after integer;
  n integer;
begin
  -- A place he has never saved — never, not "does not have saved now". The
  -- award is once per place forever, so a place he saved and unsaved earlier in
  -- this file still has its ledger row and would earn nothing. (That is the
  -- rule working; it is just not what this first assertion is measuring.)
  set local role postgres;
  select s.id into v_service
  from public.services s
  where not exists (
    select 1 from public.saved_places sp
    where sp.service_id = s.id and sp.member_id = v_marcus
  )
  and not exists (
    select 1 from public.points_ledger pl
    where pl.subject_id = s.id and pl.member_id = v_marcus
  )
  limit 1;
  if v_service is null then
    raise exception 'FAIL  the seed has no unsaved service to test with';
  end if;

  select coalesce(sum(delta), 0) into v_before
  from public.points_ledger where member_id = v_marcus;

  insert into public.saved_places (member_id, service_id) values (v_marcus, v_service);

  select coalesce(sum(delta), 0) into v_after
  from public.points_ledger where member_id = v_marcus;
  if v_after - v_before <> 5 then
    raise exception 'FAIL  saving a place earned % points, expected 5', v_after - v_before;
  end if;
  raise notice 'ok    saving a place earns five points';

  -- Unsave, save again: the farm. It earns nothing the second time, and the
  -- first award is still there.
  delete from public.saved_places where member_id = v_marcus and service_id = v_service;
  select coalesce(sum(delta), 0) into v_after
  from public.points_ledger where member_id = v_marcus;
  if v_after - v_before <> 5 then
    raise exception 'FAIL  unsaving changed the balance by %', v_after - v_before - 5;
  end if;
  raise notice 'ok    unsaving takes nothing back';

  insert into public.saved_places (member_id, service_id) values (v_marcus, v_service);
  select coalesce(sum(delta), 0) into v_after
  from public.points_ledger where member_id = v_marcus;
  if v_after - v_before <> 5 then
    raise exception 'FAIL  saving the same place twice earned % points', v_after - v_before;
  end if;
  raise notice 'ok    saving the same place again earns nothing';

  -- Staff are not on the board.
  insert into public.saved_places (member_id, service_id) values (v_admin, v_service);
  select count(*) into n from public.points_ledger where member_id = v_admin;
  if n <> 0 then
    raise exception 'FAIL  a case manager earned points for saving a place';
  end if;
  raise notice 'ok    staff earn nothing: points are a member mechanic';

  -- The saved rows go; the ledger rows stay, because the ledger is append-only
  -- (0007) and tidying up after a test is not a reason to rewrite somebody's
  -- history. Later assertions read the sum rather than a fixed number for
  -- exactly this reason.
  delete from public.saved_places where service_id = v_service
    and member_id in (v_marcus, v_admin);
  set local role authenticated;
end;
$$;

\echo ''
\echo '--- Nobody promotes themselves (0046) ---'

-- This suite exists because for several weeks they could. `profiles_update_self`
-- checks `id = auth.uid()` and stops there, and `role` is an ordinary column on
-- that table, so one UPDATE from the browser turned any account into the one
-- that can see every account in PAM. The fix is column-level privilege, and a
-- privilege is exactly the kind of thing that gets dropped by a later migration
-- recreating a grant. These assertions are the tripwire.

set role authenticated;
select test.as_user(:'marcus');

do $$
declare
  v_role public.user_role;
begin
  begin
    update public.profiles set role = 'super_admin' where id = auth.uid();
    raise exception 'FAIL  a member promoted themselves to super_admin';
  exception when insufficient_privilege then
    raise notice 'ok    a member cannot write their own role';
  end;

  -- A refusal that leaves the value changed would be worse than no refusal.
  select role into v_role from public.profiles where id = auth.uid();
  if v_role <> 'member' then
    raise exception 'FAIL  the role is now %', v_role;
  end if;
end;
$$;

do $$
begin
  begin
    update public.profiles set access_status = 'active' where id = auth.uid();
    raise exception 'FAIL  an account can un-suspend itself';
  exception when insufficient_privilege then
    raise notice 'ok    a member cannot write their own access_status';
  end;

  begin
    update public.profiles set region_id = '11111111-0000-0000-0000-000000000002'
    where id = auth.uid();
    raise exception 'FAIL  a member moved themselves to another region';
  exception when insufficient_privilege then
    raise notice 'ok    a member cannot move themselves between regions';
  end;

  begin
    update public.profiles set phone = '+15555559999' where id = auth.uid();
    raise exception 'FAIL  a member rewrote their own verified phone';
  exception when insufficient_privilege then
    raise notice 'ok    a member cannot rewrite the phone they verified with';
  end;
end;
$$;

-- The columns a person is supposed to own still work. A lockdown that also
-- locks out the settings screen is a bug found by a user rather than a test.
do $$
begin
  update public.profiles set first_name = 'Marcus', bio = 'Back home.'
  where id = auth.uid();
  raise notice 'ok    a member still edits their own name and bio';
end;
$$;

do $$
begin
  begin
    insert into public.profiles (id, role) values
      ('33333333-0000-0000-0000-0000000000f3', 'super_admin');
    raise exception 'FAIL  a client created a profile';
  exception when insufficient_privilege then
    raise notice 'ok    a profile cannot be created from the browser';
  end;
end;
$$;

\echo ''
\echo '--- Signing up (0046) ---'

reset role;
insert into auth.users (id, phone) values
  ('33333333-0000-0000-0000-0000000000aa', '+15555550991'),
  ('33333333-0000-0000-0000-0000000000ab', '+15555550992'),
  ('33333333-0000-0000-0000-0000000000ac', '+15555550993');

set role authenticated;
select test.as_user('33333333-0000-0000-0000-0000000000aa');

do $$
declare
  p public.profiles;
begin
  -- Lower case and a stray space, the way a phone keyboard hands it over.
  p := public.start_membership('Dee', 'Reeves', '  north ', 'es');
  if p.role <> 'member' then
    raise exception 'FAIL  start_membership created a %', p.role;
  end if;
  if p.region_id is null then
    raise exception 'FAIL  the city did not resolve to a region';
  end if;
  if p.first_name <> 'Dee' or p.last_name <> 'Reeves' then
    raise exception 'FAIL  the name came back as % %', p.first_name, p.last_name;
  end if;
  if p.preferred_language <> 'es' then
    raise exception 'FAIL  the language came back as %', p.preferred_language;
  end if;
  raise notice 'ok    signing up makes a member in the city they typed';

  begin
    perform public.start_membership('Dee', 'Reeves', 'North');
    raise exception 'FAIL  signing up twice made a second profile';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    an account can only be created once';
  end;
end;
$$;

-- The property that makes this function safe to expose: there is no argument
-- that names a role, so there is nothing to pass 'admin' to. Proven by asking
-- the catalogue rather than by reading the source.
reset role;
select test.check(
  'start_membership takes no role argument',
  (select count(*)
     from pg_proc p, unnest(coalesce(p.proargnames, '{}')) as a
    where p.proname = 'start_membership'
      and p.pronamespace = 'public'::regnamespace
      and a ilike '%role%')::int,
  0);

set role authenticated;
select test.as_user('33333333-0000-0000-0000-0000000000ab');

do $$
declare n int;
begin
  begin
    perform public.start_membership('Ray', 'Ortiz', 'Scranton');
    raise exception 'FAIL  a city PAM does not serve made a profile anyway';
  exception when sqlstate 'P0002' then
    raise notice 'ok    an unserved city is refused, and says so';
  end;

  select count(*) into n from public.profiles where id = auth.uid();
  if n <> 0 then
    raise exception 'FAIL  a half-made profile was left behind';
  end if;

  perform public.join_waiting_city('Scranton', true);
  select count(*) into n from public.waiting_cities
  where user_id = auth.uid() and wants_updates;
  if n <> 1 then
    raise exception 'FAIL  the waiting list did not record the opt-in';
  end if;
  raise notice 'ok    an unserved city can leave a name and ask to hear back';
end;
$$;

select test.as_user('33333333-0000-0000-0000-0000000000ac');

do $$
declare n int;
begin
  perform public.request_staff_access('admin', 'Val', 'Okonkwo', 'North');

  select count(*) into n from public.profiles where id = auth.uid();
  if n <> 0 then
    raise exception 'FAIL  claiming a staff role created an account';
  end if;
  raise notice 'ok    claiming a staff role creates no account';

  select count(*) into n from public.staff_requests
  where user_id = auth.uid() and wants_role = 'admin';
  if n <> 1 then
    raise exception 'FAIL  the request was not recorded';
  end if;

  begin
    perform public.request_staff_access('super_admin', 'Val', 'Okonkwo', 'North');
    raise exception 'FAIL  somebody asked to be a super admin';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    super admin is not a role anybody can ask for';
  end;
end;
$$;

-- One person's claim is not another person's business.
select test.as_user(:'marcus');
select test.check(
  'a member cannot read somebody else''s staff request',
  (select count(*) from public.staff_requests), 0);
select test.check(
  'a member cannot read somebody else''s waiting-list row',
  (select count(*) from public.waiting_cities), 0);

\echo ''
\echo '--- Finishing setup earns the first points (0047) ---'

set role authenticated;
select test.as_user('33333333-0000-0000-0000-0000000000aa');

do $$
declare
  v_before bigint;
  v_after  bigint;
begin
  select coalesce(sum(delta), 0) into v_before
  from public.points_ledger where member_id = auth.uid();

  update public.profiles set onboarded_at = now() where id = auth.uid();

  select coalesce(sum(delta), 0) into v_after
  from public.points_ledger where member_id = auth.uid();
  if v_after - v_before <> 25 then
    raise exception 'FAIL  finishing setup earned % points, expected 25', v_after - v_before;
  end if;
  raise notice 'ok    finishing setup earns twenty-five points';

  -- A client that writes the column in a loop must not farm it.
  update public.profiles set onboarded_at = now() where id = auth.uid();
  select coalesce(sum(delta), 0) into v_after
  from public.points_ledger where member_id = auth.uid();
  if v_after - v_before <> 25 then
    raise exception 'FAIL  finishing setup twice earned % points', v_after - v_before;
  end if;
  raise notice 'ok    it cannot be earned twice';
end;
$$;

-- Staff finish setup too, and points are a member mechanic.
select test.as_user(:'admin_north');
do $$
declare n bigint;
begin
  update public.profiles set onboarded_at = now() where id = auth.uid();
  select count(*) into n from public.points_ledger
  where member_id = auth.uid() and reason = 'finish_setup';
  if n <> 0 then
    raise exception 'FAIL  a case manager earned points for finishing setup';
  end if;
  raise notice 'ok    staff earn nothing for finishing setup';
end;
$$;

\echo ''
\echo '--- The cities PAM serves are public; the regions table is not (0048) ---'

set role anon;
select set_config('request.jwt.claim.sub', '', false);

select test.check(
  'a signed-out visitor still reads no region rows',
  (select count(*) from public.regions), 0);

-- Two from the fixture (North, South) plus Philadelphia, which 0009 seeds into
-- every build. Counted through the function precisely because `regions` itself
-- reads as empty from here.
select test.check(
  'a signed-out visitor can see which cities PAM is in',
  (select count(*) from public.served_cities()), 3);

do $$
begin
  -- Names only. An id is what ties an account to a region.
  if (select count(*) from pg_proc p
      where p.proname = 'served_cities'
        and p.pronamespace = 'public'::regnamespace
        and pg_get_function_result(p.oid) ilike '%uuid%') > 0 then
    raise exception 'FAIL  served_cities returns an id';
  end if;
  raise notice 'ok    served_cities returns names and nothing else';
end;
$$;

set role authenticated;

\echo ''
\echo '--- Four kinds of people, four ways in (0049) ---'

-- A super admin of their own, so this block does not depend on what an earlier
-- one did to admin_north.
reset role;
insert into auth.users (id, phone) values
  ('33333333-0000-0000-0000-0000000000b0', '+15555550880'),
  ('33333333-0000-0000-0000-0000000000b1', '+15555550881'),
  ('33333333-0000-0000-0000-0000000000b2', '+15555550882');
insert into public.profiles (id, role, first_name, access_status)
values ('33333333-0000-0000-0000-0000000000b0', 'super_admin', 'Owner', 'active');

set role authenticated;
select test.as_user(:'admin_north');

do $$
begin
  begin
    perform public.create_invite('admin');
    raise exception 'FAIL  a case manager made a case manager';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a case manager cannot invite a case manager';
  end;
end;
$$;

select test.as_user('33333333-0000-0000-0000-0000000000b0');

do $$
declare
  inv public.invites;
  n   int;
begin
  select count(*) into n from public.regions;
  if n < 2 then
    raise exception 'FAIL  a super admin reads % regions and cannot say which city an invite is for', n;
  end if;
  raise notice 'ok    a super admin can see the regions';

  begin
    perform public.create_invite('admin');
    raise exception 'FAIL  an admin invite was made for no city';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a super admin has to say which city a case manager is for';
  end;

  begin
    perform public.create_invite('super_admin', null, '11111111-0000-0000-0000-000000000002');
    raise exception 'FAIL  somebody was invited to be a super admin';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    nobody is invited to be a super admin';
  end;

  inv := public.create_invite('admin', null, '11111111-0000-0000-0000-000000000002');
  if inv.role <> 'admin' or inv.region_id <> '11111111-0000-0000-0000-000000000002' then
    raise exception 'FAIL  the admin invite came back as % in %', inv.role, inv.region_id;
  end if;
  if inv.assigned_admin_id is not null then
    raise exception 'FAIL  a super admin invite carries a caseload';
  end if;
  perform set_config('pam.admin_code', inv.code, false);
  raise notice 'ok    a super admin can invite a case manager into a city';

  inv := public.create_invite('member', null, '11111111-0000-0000-0000-000000000001');
  perform set_config('pam.member_code', inv.code, false);
  raise notice 'ok    ...and a member, who lands on nobody''s caseload';
end;
$$;

-- The code a super admin made turns a verified phone into a case manager for
-- the south, with the two columns sign-up asks for filled in.
select test.as_user('33333333-0000-0000-0000-0000000000b1');
do $$
declare p public.profiles;
begin
  p := public.redeem_invite(current_setting('pam.admin_code'), 'Kim', 'en', 'Adeyemi', 'South');
  if p.role <> 'admin' then
    raise exception 'FAIL  redeemed as %', p.role;
  end if;
  if p.region_id <> '11111111-0000-0000-0000-000000000002' then
    raise exception 'FAIL  the case manager landed in the wrong region';
  end if;
  if p.last_name <> 'Adeyemi' or p.home_city <> 'South' then
    raise exception 'FAIL  last name and city did not reach the profile';
  end if;
  raise notice 'ok    redeeming the code makes a case manager, with a last name and a city';
end;
$$;

select test.as_user('33333333-0000-0000-0000-0000000000b2');
do $$
declare p public.profiles; n int;
begin
  p := public.redeem_invite(current_setting('pam.member_code'), 'Ana');
  if p.role <> 'member' then
    raise exception 'FAIL  redeemed as %', p.role;
  end if;
  select count(*) into n from public.admin_assignments where member_id = p.id;
  if n <> 0 then
    raise exception 'FAIL  a member a super admin invited was put on a caseload';
  end if;
  raise notice 'ok    the three-argument call still works, and no caseload is invented';
end;
$$;

\echo ''
\echo '--- Every place says what it is (0050) ---'

set role authenticated;
select test.as_user(:'marcus');

do $$
declare
  n_blank   int;
  n_long    int;
  v_desc    text;
begin
  -- The seed's services are fixture rows, so this asserts the shape of the
  -- rule rather than a count that changes with every import.
  select count(*) into n_long from public.services
  where description_plain is not null and length(description_plain) > 200;
  if n_long <> 0 then
    raise exception 'FAIL  % descriptions are over 200 characters', n_long;
  end if;
  raise notice 'ok    no description runs past 200 characters';

  -- As the owner, not as a member: a member has no UPDATE on `services` at
  -- all, so the statement would touch no rows, raise nothing, and "pass" while
  -- proving the constraint does not exist.
  set local role postgres;
  begin
    update public.services set description_plain = repeat('x', 201)
    where id = (select id from public.services order by id limit 1);
    raise exception 'FAIL  a 201-character description was accepted';
  exception when check_violation then
    raise notice 'ok    the length is a constraint, not an intention';
  end;
  set local role authenticated;
end;
$$;

-- What a member is entitled to see about one place, and what they are not.
reset role;
insert into public.services (id, name, category, address, is_active, needs_review, is_walk_in, description_plain, audience)
values
  ('55555555-0000-0000-0000-000000000001', 'Open Door Center', 'education',
   '1 Main St', true, false, true, 'A place that says what it is.', 'students'),
  ('55555555-0000-0000-0000-000000000002', 'Not Reviewed Yet', 'education',
   '2 Main St', true, true, true, 'Should not be readable.', null);

-- Writing plain-language copy raises `needs_review` on insert too (0020), so
-- the published row has to be approved the way a person would approve it.
update public.services set needs_review = false
where id = '55555555-0000-0000-0000-000000000001';

set role authenticated;
select test.as_user(:'marcus');

do $$
declare
  r record;
  n int;
begin
  select * into r from public.service_detail('55555555-0000-0000-0000-000000000001');
  if r.id is null then
    raise exception 'FAIL  a member cannot read a published place';
  end if;
  if r.description_plain is null or r.audience <> 'students' then
    raise exception 'FAIL  the detail call dropped the description or the audience';
  end if;
  raise notice 'ok    a member reads one place, with what it is and who it is for';

  select count(*) into n from public.service_detail('55555555-0000-0000-0000-000000000002');
  if n <> 0 then
    raise exception 'FAIL  a place still under review answered %', n;
  end if;
  raise notice 'ok    a place under review answers nothing';
end;
$$;

-- `audience` is the badge's source, so it may only ever hold what the UI knows
-- how to draw.
reset role;
do $$
begin
  begin
    insert into public.services (id, name, category, address, is_active, audience)
    values ('55555555-0000-0000-0000-000000000003', 'Bad Audience', 'education', '3 Main St', true, 'grown-ups');
    raise exception 'FAIL  an unknown audience was accepted';
  exception when check_violation then
    raise notice 'ok    audience holds only the values the screen can draw';
  end;
end;
$$;

delete from public.services where id in (
  '55555555-0000-0000-0000-000000000001',
  '55555555-0000-0000-0000-000000000002');
set role authenticated;

\echo ''
\echo '--- A place hands back the point it was sorted by (0051) ---'

set role authenticated;
select test.as_user(:'marcus');

do $$
declare r record;
begin
  -- Philadelphia City Hall, which the seed centres the region on.
  select * into r from public.services_near(39.9526, -75.1652, null, 1);
  if r.id is null then
    raise exception 'FAIL  nothing near the middle of the pilot city';
  end if;
  if r.lat is null or r.lon is null then
    raise exception 'FAIL  the nearest place came back without a point, so directions fall back to a string';
  end if;
  -- Not asserting a description here: the fixture's services are inserted by
  -- the seed, which runs after the migration that writes them, so these rows
  -- legitimately have none. That the column comes back at all is the part this
  -- can prove, and 0050's own tests cover the words.
  raise notice 'ok    the list carries the point it sorted by';
end;
$$;

\echo ''
\echo '--- Deciding a staff request, for real (0054) ---'

reset role;
insert into auth.users (id, phone) values
  ('33333333-0000-0000-0000-0000000000c0', '+15555550970'),
  ('33333333-0000-0000-0000-0000000000c1', '+15555550971'),
  ('33333333-0000-0000-0000-0000000000c2', '+15555550972');
insert into public.profiles (id, role, first_name, access_status)
values ('33333333-0000-0000-0000-0000000000c0', 'super_admin', 'Owner', 'active');

set role authenticated;
select test.as_user('33333333-0000-0000-0000-0000000000c1');
do $$ begin perform public.request_staff_access('admin', 'Priya', 'Nair', 'North'); end; $$;

select test.as_user(:'admin_north');
do $$
begin
  begin
    perform public.review_staff_request('33333333-0000-0000-0000-0000000000c1', 'approved',
      '11111111-0000-0000-0000-000000000001');
    raise exception 'FAIL  a case manager decided a staff request';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    only a super admin can decide a staff request';
  end;
end;
$$;

select test.as_user('33333333-0000-0000-0000-0000000000c0');
do $$
declare
  p public.profiles;
  req public.staff_requests;
  n int;
begin
  begin
    perform public.review_staff_request('33333333-0000-0000-0000-0000000000c1', 'approved');
    raise exception 'FAIL  approval went through with no city named';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    approving still has to say which city (like create_invite, 0049)';
  end;

  req := public.review_staff_request('33333333-0000-0000-0000-0000000000c1', 'approved',
    '11111111-0000-0000-0000-000000000001');
  if req.decision <> 'approved' or req.reviewed_by <> auth.uid() or req.reviewed_at is null then
    raise exception 'FAIL  the request was not marked decided';
  end if;
  raise notice 'ok    approving records the decision, reviewer and time';

  select * into p from public.profiles where id = '33333333-0000-0000-0000-0000000000c1';
  if p.role <> 'admin' or p.region_id <> '11111111-0000-0000-0000-000000000001' then
    raise exception 'FAIL  the approved account came back as % in %', p.role, p.region_id;
  end if;
  if p.phone <> '+15555550971' or p.first_name <> 'Priya' or p.last_name <> 'Nair' then
    raise exception 'FAIL  the approved profile is missing what the request carried';
  end if;
  raise notice 'ok    approving creates the real account, phone pulled from auth.users';

  begin
    perform public.review_staff_request('33333333-0000-0000-0000-0000000000c1', 'approved',
      '11111111-0000-0000-0000-000000000001');
    raise exception 'FAIL  an already-decided request was decided again';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    a decided request cannot be decided again';
  end;
end;
$$;

-- outbound_messages carries no admin carve-out (0035: "what a member is being
-- texted is not on the §4.1 list") — checked with RLS bypassed, the same way
-- 03_invariants.sql checks the equivalent queue for 0035/0036/0037.
reset role;
do $$
declare n int;
begin
  select count(*) into n from public.outbound_messages
  where member_id = '33333333-0000-0000-0000-0000000000c1'
    and template_key = 'staff_request_approved';
  if n <> 1 then
    raise exception 'FAIL  the approval text was not queued';
  end if;
  raise notice 'ok    approving queues the approval text through the normal outbox';
end;
$$;
set role authenticated;

-- A denial: no profile, no queued message, decision recorded.
select test.as_user('33333333-0000-0000-0000-0000000000c2');
do $$ begin perform public.request_staff_access('provider', 'Sam', 'Reyes', 'South'); end; $$;

select test.as_user('33333333-0000-0000-0000-0000000000c0');
do $$
declare
  req public.staff_requests;
  n int;
begin
  req := public.review_staff_request('33333333-0000-0000-0000-0000000000c2', 'denied');
  if req.decision <> 'denied' then
    raise exception 'FAIL  the denial was not recorded';
  end if;

  select count(*) into n from public.profiles where id = '33333333-0000-0000-0000-0000000000c2';
  if n <> 0 then
    raise exception 'FAIL  a denied request still got an account';
  end if;
  raise notice 'ok    denying records the decision and creates no account';
end;
$$;

-- The denial text is queued straight to the phone (0055) — checked with RLS
-- bypassed, since a phone-only row's member_id is null and matches nobody's
-- auth.uid(), including the super admin who just made the decision.
reset role;
do $$
declare n int;
begin
  select count(*) into n from public.outbound_messages
  where phone = '+15555550972' and member_id is null and template_key = 'staff_request_denied';
  if n <> 1 then
    raise exception 'FAIL  the denial text was not queued to the phone';
  end if;
  raise notice 'ok    denying queues the denial text straight to the phone, no profile needed';
end;
$$;
set role authenticated;

-- Approving a program lead who left program details adds the program too.
reset role;
insert into auth.users (id, phone) values ('33333333-0000-0000-0000-0000000000c3', '+15555550973');
set role authenticated;
select test.as_user('33333333-0000-0000-0000-0000000000c3');
do $$
begin
  perform public.request_staff_access(
    'provider', 'Jo', 'Alvarez', 'North',
    'Northside Tutoring', 'education', 'literacy_esl',
    'Free reading help, evenings.', '10 Elm St', '+15555550001', 'https://example.org'
  );
end;
$$;

select test.as_user('33333333-0000-0000-0000-0000000000c0');
do $$
begin
  perform public.review_staff_request('33333333-0000-0000-0000-0000000000c3', 'approved',
    '11111111-0000-0000-0000-000000000001');
end;
$$;

reset role;
do $$
declare n int;
begin
  select count(*) into n from public.services
  where name = 'Northside Tutoring' and category = 'education' and subcategory = 'literacy_esl';
  if n <> 1 then
    raise exception 'FAIL  the program was not added on approval';
  end if;
  raise notice 'ok    approving a program lead with program details adds it to services';
end;
$$;
delete from public.services where name = 'Northside Tutoring';
set role authenticated;

\echo ''
\echo '--- The demo view, granted per account (0057) ---'

select test.as_user(:'marcus');
do $$
declare v_marcus uuid := '33333333-0000-0000-0000-00000000000c';
begin
  begin
    perform public.set_demo_view(v_marcus, true);
    raise exception 'FAIL  a member granted themselves the demo view';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    only a super admin can grant the demo view';
  end;
end;
$$;

select test.as_user('33333333-0000-0000-0000-0000000000c0');
do $$
declare
  v_marcus uuid := '33333333-0000-0000-0000-00000000000c';
  n int;
begin
  perform public.set_demo_view(v_marcus, true);
  select count(*) into n from public.directory_people(null) where id = v_marcus and is_demo;
  if n <> 1 then
    raise exception 'FAIL  the directory does not show the demo flag as set';
  end if;
  raise notice 'ok    granting shows up on the directory';

  perform public.set_demo_view(v_marcus, false);
  select count(*) into n from public.directory_people(null) where id = v_marcus and is_demo;
  if n <> 0 then
    raise exception 'FAIL  revoking did not clear the flag';
  end if;
  raise notice 'ok    revoking clears it again';

  begin
    perform public.set_demo_view('99999999-0000-0000-0000-000000000000', true);
    raise exception 'FAIL  an account that does not exist was granted the demo view';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    granting it to nobody is refused';
  end;
end;
$$;

-- Somebody else's claim is still not this super admin's business to skip past.
do $$
begin
  begin
    perform public.review_staff_request('99999999-0000-0000-0000-000000000000', 'approved',
      '11111111-0000-0000-0000-000000000001');
    raise exception 'FAIL  a request that does not exist was decided';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok    deciding a request that does not exist is refused';
  end;
end;
$$;
