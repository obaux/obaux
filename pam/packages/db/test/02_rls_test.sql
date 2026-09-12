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
select test.check('member sees only reviewed, active services',
  (select count(*) from public.services), 2);
select test.check('member cannot see an unreviewed import row',
  (select count(*) from public.services where needs_review), 0);

select test.as_user(:'admin_north');
select test.check('admin sees the unreviewed row for review',
  (select count(*) from public.services where needs_review), 1);

reset role;
