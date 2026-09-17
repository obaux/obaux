-- The §4.1 transparency contract, tested against the real database rather
-- than only documented in packages/config/transparency.ts.
--
-- Will asked for this directly: `transparency.ts`'s own file comment used to
-- claim an `admin_visibility.test.ts` enforces `ADMIN_CAN_SEE` against live
-- RLS. It did not exist anywhere in this repository (D-153, D-156). This is
-- that test, scoped specifically to what changed across today's three
-- messaging sessions (D-152 through D-156) — not a restatement of the whole
-- suite.
--
-- Four things, matching the four lines of the contract that moved today:
--
--   1. A case manager who IS a conversation participant reads its full
--      history (`transparency.canSee.directMessages`).
--   2. A case manager who is NOT a participant in a given conversation reads
--      nothing from it, even one they cover on their caseload — the report
--      path (D-074, `flagged_messages_routed_through_reports`) is NOT
--      re-tested here; `04_rpc_test.sql`'s "A case manager sees a message
--      only when somebody reports it (0034)" block already covers that in
--      full and this file does not duplicate it.
--   3. A program admin never receives `last_active_at` or `phone` for a
--      member through either read path that reaches one —
--      `conversation_partners()` (0055) or `provider_linked_members()`
--      (0056) — matching `transparency.cannotSee.programActivity`.
--   4. A case manager never receives a member's message content except
--      through participation (point 1) or a report (point 2's boundary) —
--      restated here as the single positive claim the other two points
--      prove between them, checked once more from a fresh angle: total
--      message-table visibility, not per-conversation.
--
-- This file runs after `04_rpc_test.sql` in file-sort order (`0[234]_*.sql`,
-- alphabetical — "rpc" sorts before "transparency"), which matters: that
-- file's own "a case manager cannot read the messages table at all" check
-- (admin_north, expecting zero rows) runs and passes against the *original*
-- fixture, before this file adds a conversation admin_north genuinely
-- participates in. Order is load-bearing; if this file is ever renamed to
-- sort earlier, that assertion in `04_rpc_test.sql` would need updating too.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set admin_north '33333333-0000-0000-0000-00000000000a'
\set admin_south '33333333-0000-0000-0000-00000000000b'
\set marcus      '33333333-0000-0000-0000-00000000000c'
-- alice is provider_north, linked to Marcus via an enrollment (01_seed.sql).
\set alice       '33333333-0000-0000-0000-00000000000f'

-- convo1 is the conversation 01_seed.sql already seeds: Marcus + Alice.
-- convo2 is new here: Dana (admin_north) + Marcus.
\set convo1 '66666666-0000-0000-0000-000000000001'
\set convo2 '66666666-0000-0000-0000-000000000002'

-- convo1 does not hold a fixed number of messages by the time this file
-- runs: 04_rpc_test.sql's own "0031: messaging is never switchable off"
-- check sends a real message into it earlier in the suite. Captured here,
-- as postgres (bypassing RLS), rather than hardcoded, so this file does not
-- silently start asserting the wrong number the next time some earlier test
-- adds one more message to the same seeded conversation.
select count(*) as convo1_msg_count from public.messages where conversation_id = :'convo1' \gset

-- ===========================================================================
\echo ''
\echo '--- Fixture: a conversation a case manager actually participates in ---'
-- ===========================================================================
-- Inserted as the table owner, the same way 01_seed.sql sets up its own
-- conversation — this file is testing read policies against a known state,
-- not the insert path (D-152 already covers what that needs and flags what
-- it still does not enforce).
set local role postgres;

insert into public.conversations (id, kind) values (:'convo2', 'direct');

insert into public.conversation_members (conversation_id, profile_id) values
  (:'convo2', :'admin_north'),
  (:'convo2', :'marcus');

insert into public.messages (id, conversation_id, sender_id, body) values
  ('77777777-0000-0000-0000-000000000010', :'convo2', :'admin_north',
   'Hi Marcus, checking in on the GED class.'),
  ('77777777-0000-0000-0000-000000000011', :'convo2', :'marcus',
   'Going well, thanks Dana.');

set role authenticated;

-- ===========================================================================
\echo ''
\echo '--- 1. A participating case manager reads the full conversation (transparency.canSee.directMessages) ---'
-- ===========================================================================
select test.as_user(:'admin_north');

select test.check('a case manager who is a participant reads every message in that conversation',
  (select count(*) from public.messages where conversation_id = :'convo2'), 2);

select test.check('...including the member''s own words in it, not just their own',
  (select count(*) from public.messages
    where conversation_id = :'convo2' and sender_id = :'marcus'), 1);

-- ===========================================================================
\echo ''
\echo '--- 2. The same case manager, in a conversation covering the same member but NOT participating, reads nothing ---'
-- ===========================================================================
-- Dana covers Marcus (admin_assignments, 01_seed.sql) and is a real
-- participant in convo2 above — proving participation, not caseload
-- coverage, is what grants access. convo1 is Marcus's conversation with
-- Alice; Dana was never added to it.
select test.check('caseload coverage alone grants nothing: a non-participant case manager reads 0 rows from a covered member''s OTHER conversation',
  (select count(*) from public.messages where conversation_id = :'convo1'), 0);

select test.check('a case manager''s total message visibility is exactly the conversation they participate in, no more',
  (select count(*) from public.messages), 2);

-- ===========================================================================
\echo ''
\echo '--- 3. A program admin never receives activity info through either read path (transparency.cannotSee.programActivity) ---'
-- ===========================================================================
-- Alice is genuinely both: provider_linked_to Marcus (enrollment, 01_seed.sql)
-- AND a conversation_members row in convo1 (also 01_seed.sql) — the two read
-- paths D-154/D-155 each closed, exercised from the same real account.
select test.as_user(:'alice');

select test.check('a linked, participating program admin still reads the conversation content itself',
  (select count(*) from public.messages where conversation_id = :'convo1'), :convo1_msg_count);

do $$
begin
  begin
    execute 'select last_active_at from public.conversation_partners()';
    raise exception 'FAIL  conversation_partners() now returns last_active_at to a program admin';
  exception
    when undefined_column then
      raise notice 'ok    conversation_partners() carries no activity info (checked as a program admin)';
  end;

  begin
    execute 'select phone from public.conversation_partners()';
    raise exception 'FAIL  conversation_partners() now returns a phone number to a program admin';
  exception
    when undefined_column then
      raise notice 'ok    conversation_partners() carries no contact details (checked as a program admin)';
  end;

  -- Same two checks against the other path (0056). Deliberately duplicates
  -- part of that migration's own test block in 04_rpc_test.sql: that block
  -- proves the function itself is correct; this one proves the transparency
  -- *contract* holds across BOTH functions a program admin can call, which
  -- is the actual promise members read.
  begin
    execute 'select last_active_at from public.provider_linked_members()';
    raise exception 'FAIL  provider_linked_members() now returns last_active_at';
  exception
    when undefined_column then
      raise notice 'ok    provider_linked_members() carries no activity info (re-checked here as the transparency contract, not just the migration)';
  end;

  begin
    execute 'select phone from public.provider_linked_members()';
    raise exception 'FAIL  provider_linked_members() now returns a phone number';
  exception
    when undefined_column then
      raise notice 'ok    provider_linked_members() carries no contact details (re-checked here as the transparency contract, not just the migration)';
  end;
end;
$$;

-- A program admin reaching this member through conversation_partners() gets
-- a name and a role, and specifically Marcus's own role — proving the
-- function actually answers, not merely that it lacks two columns.
select test.check('conversation_partners() actually returns the member''s role alongside the name',
  (select count(*) from public.conversation_partners()
    where conversation_id = :'convo1' and profile_id = :'marcus' and role = 'member'), 1);

-- ===========================================================================
\echo ''
\echo '--- 4. A non-participating case manager gets nothing from conversation_partners() either ---'
-- ===========================================================================
-- Ray (admin_south) covers nobody in convo1 or convo2 and is a member of
-- neither. conversation_partners() has no caseload/region arm at all — it is
-- purely "conversations you are actually in" — so this should be the
-- simplest possible zero.
select test.as_user(:'admin_south');

select test.check('a case manager who participates in nothing gets nothing from conversation_partners()',
  (select count(*) from public.conversation_partners()), 0);

select test.check('...and nothing from the messages table either',
  (select count(*) from public.messages), 0);

\echo ''
\echo 'ok    transparency contract (D-155, D-156) holds against the live database'
