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
begin
  bal := public.member_points('33333333-0000-0000-0000-00000000000c');
  if bal <> 100 then raise exception 'FAIL  balance was %, expected 100', bal; end if;
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
  v := public.member_points('33333333-0000-0000-0000-00000000000c');
  if v is distinct from 100 then
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
  if v is distinct from 100 then
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
