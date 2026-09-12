-- RLS penetration suite (SOP §13 Phase 7, §14 "RLS verified with a test user
-- of each role").
--
-- Every check below is a promise from §4 / §4.1 written as an attack: one role
-- reaching for something another role owns. A failure here is a privacy breach,
-- not a broken test, so the suite stops on the first one.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

create schema if not exists test;
grant usage on schema test to authenticated, anon, service_role;

create or replace function test.check(label text, actual bigint, expected bigint)
returns void
language plpgsql
as $$
begin
  if actual is distinct from expected then
    raise exception E'FAIL  %\n        got % row(s), expected %', label, actual, expected;
  end if;
  raise notice 'ok    %', label;
end;
$$;

create or replace function test.check_raises(label text, stmt text)
returns void
language plpgsql
as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'ok    % (blocked: %)', label, left(sqlerrm, 60);
    return;
  end;
  raise exception 'FAIL  % — the statement was allowed and should not have been', label;
end;
$$;

-- Switches the acting user. Returns void so psql prints nothing.
create or replace function test.as_user(u uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', u::text, false);
end;
$$;

grant execute on all functions in schema test to authenticated, anon, service_role;

\set admin_north   '33333333-0000-0000-0000-00000000000a'
\set admin_south   '33333333-0000-0000-0000-00000000000b'
\set marcus        '33333333-0000-0000-0000-00000000000c'
\set tanya         '33333333-0000-0000-0000-00000000000d'
\set luis          '33333333-0000-0000-0000-00000000000e'
\set alice         '33333333-0000-0000-0000-00000000000f'
\set bob           '33333333-0000-0000-0000-000000000010'
\set nia           '33333333-0000-0000-0000-000000000011'
\set jo            '33333333-0000-0000-0000-000000000012'
\set sam           '33333333-0000-0000-0000-000000000013'

-- ===========================================================================
\echo ''
\echo '--- Members reach only their own rows (§4) ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'marcus');

select test.check('member sees own profile',
  (select count(*) from public.profiles where id = :'marcus'), 1);

select test.check('member cannot read another member''s enrollments',
  (select count(*) from public.enrollments where member_id <> :'marcus'), 0);

select test.check('member cannot read another member''s points ledger',
  (select count(*) from public.points_ledger where member_id <> :'marcus'), 0);

select test.check('member sees own points ledger',
  (select count(*) from public.points_ledger where member_id = :'marcus'), 1);

select test.check_raises('member cannot award itself points',
  format('insert into public.points_ledger (member_id, delta, reason) values (%L, 500, %L)',
         :'marcus', 'self_award'));

-- ===========================================================================
\echo ''
\echo '--- Discovery respects is_public and blocks (§4, §6.2) ---'
-- ===========================================================================
select test.check('private mentor is hidden from discovery',
  (select count(*) from public.profiles where id = :'jo'), 0);

select test.check('public mentor is discoverable',
  (select count(*) from public.profiles where id = :'nia'), 1);

select test.check('blocked user is invisible to the blocker',
  (select count(*) from public.profiles where id = :'sam'), 0);

select test.as_user(:'sam');
select test.check('blocker is invisible to the blocked user',
  (select count(*) from public.profiles where id = :'marcus'), 0);

-- ===========================================================================
\echo ''
\echo '--- Admin scope: caseload and region only, never another region (§4) ---'
-- ===========================================================================
select test.as_user(:'admin_north');

select test.check('admin sees a member on their caseload',
  (select count(*) from public.profiles where id = :'marcus'), 1);

select test.check('admin sees an unassigned member in their own region',
  (select count(*) from public.profiles where id = :'tanya'), 1);

select test.check('admin CANNOT see a member in another region',
  (select count(*) from public.profiles where id = :'luis'), 0);

select test.check('admin sees caseload enrollments',
  (select count(*) from public.enrollments where member_id = :'marcus'), 1);

select test.check('admin sees caseload points',
  (select count(*) from public.points_ledger where member_id = :'marcus'), 1);

select test.as_user(:'admin_south');
select test.check('other-region admin sees nothing of Marcus',
  (select count(*) from public.profiles where id = :'marcus'), 0);
select test.check('other-region admin sees no Marcus enrollments',
  (select count(*) from public.enrollments where member_id = :'marcus'), 0);

-- ===========================================================================
\echo ''
\echo '--- Admin ≠ surveillance: no message bodies, no buddy feed (§4.1) ---'
-- ===========================================================================
select test.as_user(:'admin_north');

select test.check('admin CANNOT read message bodies, even for their caseload',
  (select count(*) from public.messages), 0);

select test.check('admin CANNOT read a conversation they introduced',
  (select count(*) from public.conversations), 0);

select test.check('admin CANNOT read buddy feed posts',
  (select count(*) from public.activities where visibility = 'buddies'), 0);

select test.check('admin CAN see that a connection exists, and its kind',
  (select count(*) from public.connections where requester_id = :'marcus'), 2);

-- ===========================================================================
\echo ''
\echo '--- Messages reach conversation members only (§4) ---'
-- ===========================================================================
select test.as_user(:'marcus');
select test.check('participant reads the conversation',
  (select count(*) from public.messages), 1);

select test.as_user(:'tanya');
select test.check('non-participant reads nothing',
  (select count(*) from public.messages), 0);

select test.check_raises('non-participant cannot post into a conversation',
  format('insert into public.messages (conversation_id, sender_id, body) values (%L, %L, %L)',
         '66666666-0000-0000-0000-000000000001', :'tanya', 'let me in'));

-- ===========================================================================
\echo ''
\echo '--- Buddy feed: accepted buddies only (§6.3) ---'
-- ===========================================================================
select test.as_user(:'nia');
select test.check('buddy sees a shared activity',
  (select count(*) from public.activities where member_id = :'marcus'), 1);

select test.check('buddy does NOT see a private activity',
  (select count(*) from public.activities
    where member_id = :'marcus' and visibility = 'private'), 0);

select test.as_user(:'tanya');
select test.check('non-buddy sees no activities at all',
  (select count(*) from public.activities where member_id = :'marcus'), 0);

-- ===========================================================================
\echo ''
\echo '--- Providers reach members only through a link (§4) ---'
-- ===========================================================================
select test.as_user(:'alice');
select test.check('linked provider sees the enrolled member',
  (select count(*) from public.profiles where id = :'marcus'), 1);
select test.check('linked provider sees the enrollment',
  (select count(*) from public.enrollments where member_id = :'marcus'), 1);

select test.as_user(:'bob');
select test.check('unlinked provider sees no enrollment',
  (select count(*) from public.enrollments where member_id = :'marcus'), 0);
select test.check('unlinked provider cannot read the member profile',
  (select count(*) from public.profiles where id = :'marcus'), 0);

-- ===========================================================================
\echo ''
\echo '--- Import review queue is hidden from members (§5.2) ---'
-- ===========================================================================
select test.as_user(:'marcus');
-- Scoped to the fixture rows: migrations seed a real catalogue (0025), and a
-- bare count here would break every time a place is added, which is not what
-- this test is about.
select test.check('member sees only reviewed, active services',
  (select count(*) from public.services
   where id in ('44444444-0000-0000-0000-000000000001',
                '44444444-0000-0000-0000-000000000002',
                '44444444-0000-0000-0000-000000000003')), 2);
select test.check('member cannot see an unreviewed import row',
  (select count(*) from public.services where needs_review), 0);

select test.as_user(:'admin_north');
select test.check('admin sees the unreviewed row for review',
  (select count(*) from public.services where needs_review), 1);

reset role;

-- ===========================================================================
\echo ''
\echo '--- app_settings: world-readable, admin-writable (§0 never dead-end) ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'marcus');

select test.check('a member can read the support number',
  (select count(*) from public.app_settings where key = 'support_phone'), 1);

-- An RLS-filtered UPDATE matches no rows and returns quietly rather than
-- raising, so the meaningful assertion is that the value did not move.
do $$
declare
  before_value text;
  after_value text;
begin
  select value into before_value from public.app_settings where key = 'support_phone';
  update public.app_settings set value = '+15555550000' where key = 'support_phone';
  select value into after_value from public.app_settings where key = 'support_phone';

  if after_value is distinct from before_value then
    raise exception 'FAIL  a member changed the support number (% -> %)',
      before_value, after_value;
  end if;
  raise notice 'ok    a member cannot change the support number';
end;
$$;

-- Anonymous too: someone who cannot sign in still has to be able to reach help.
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select test.check('a signed-out visitor can still read the support number',
  (select count(*) from public.app_settings where key = 'support_phone'), 1);

set role authenticated;
select test.as_user(:'admin_north');
select test.check('an admin can read it',
  (select count(*) from public.app_settings where key = 'support_phone'), 1);

reset role;

-- ===========================================================================
\echo ''
\echo '--- A signed-out visitor can still reach the public catalogue (§0) ---'
-- ===========================================================================
-- Regression guard for 0011/0012. A `for all` policy is evaluated on SELECT
-- too, so revoking EXECUTE on a helper one of them calls turns a public read
-- into "permission denied for function" rather than an empty result.
set role anon;
select set_config('request.jwt.claim.sub', '', false);

-- Two of the three fixture services are published; the third is an unreviewed
-- import row, which must stay hidden from everyone but an admin (§5.2).
select test.check('anon can read published services',
  (select count(*) from public.services
   where id in ('44444444-0000-0000-0000-000000000001',
                '44444444-0000-0000-0000-000000000002',
                '44444444-0000-0000-0000-000000000003')), 2);
select test.check('anon cannot see the unreviewed import row',
  (select count(*) from public.services where needs_review), 0);
select test.check('anon can read orgs',
  (select count(*) from public.orgs
   where id in ('22222222-0000-0000-0000-000000000001',
                '22222222-0000-0000-0000-000000000002')), 2);
select test.check('anon can read the subcategory list',
  (select count(*) from public.service_subcategories), 18);
select test.check('anon can read badges',
  (select count(*) from public.badges), 6);
select test.check('anon still sees no profiles',
  (select count(*) from public.profiles), 0);
select test.check('anon still sees no messages',
  (select count(*) from public.messages), 0);
select test.check('anon still sees no invites',
  (select count(*) from public.invites), 0);
select test.check('anon still sees no enrollments',
  (select count(*) from public.enrollments), 0);

-- The guards, not the grants, are what protect these. Assert that directly:
-- a signed-out caller gets a useless answer from every one.
do $$
begin
  if public.are_buddies('33333333-0000-0000-0000-00000000000c',
                        '33333333-0000-0000-0000-000000000011') then
    raise exception 'FAIL  anon probed the buddy graph';
  end if;
  if public.is_blocked_between('33333333-0000-0000-0000-00000000000c',
                               '33333333-0000-0000-0000-000000000013') then
    raise exception 'FAIL  anon probed block relationships';
  end if;
  if public.admin_covers('33333333-0000-0000-0000-00000000000c') then
    raise exception 'FAIL  anon passed an admin_covers check';
  end if;
  if not public.feature_allowed('33333333-0000-0000-0000-00000000000c', 'chat') then
    raise exception 'FAIL  anon read another user''s access controls';
  end if;
  raise notice 'ok    every helper is information-free for a signed-out caller';
end;
$$;

reset role;
