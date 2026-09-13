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
  select id into v_service from public.services where geo is not null limit 1;
  if v_service is null then
    raise exception 'FAIL  the seed has no service with a point to save';
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
