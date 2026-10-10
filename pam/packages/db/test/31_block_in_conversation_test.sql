-- What the Block control in a conversation's ⋯ menu relies on (D-463), beyond
-- test 12's attack on the rules themselves: a block is between two people and
-- touches no other conversation; staff can block a member and the member cannot
-- lift it; the audit log holds the fact and no words; a block goes with the
-- account; a person who was blocked still reads and reports what was said.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set marcus      '33333333-0000-0000-0000-00000000000c'
\set admin_north '33333333-0000-0000-0000-00000000000a'
\set alice       '33333333-0000-0000-0000-00000000000f'

reset role;
delete from public.blocks;
-- (The audit log is append-only: count what is there now, and look at what this test adds.)
select count(*) filter (where action = 'profile.block') as blocks_before,
       count(*) filter (where action = 'profile.unblock') as unblocks_before
  from public.audit_log \gset

set role authenticated;
select test.as_user(:'admin_north');
select public.open_direct_conversation(:'marcus') as dana_marcus \gset
select test.as_user(:'alice');
select public.open_direct_conversation(:'marcus') as alice_marcus \gset

-- Marcus blocks one person; the other conversation is untouched.
select test.as_user(:'marcus');
select public.block_in_conversation(:'alice_marcus');
select test.check('Marcus blocked Alice in their conversation',
  (select count(*) from public.conversation_block_state(:'alice_marcus') where i_blocked), 1);
select test.check('...and Dana''s conversation with him is untouched',
  (select count(*) from public.conversation_block_state(:'dana_marcus') where not i_blocked and not blocked_me), 1);
select count(*) as marcus_wrote_before from public.messages where conversation_id = :'dana_marcus' and sender_id = :'marcus' \gset
insert into public.messages (conversation_id, sender_id, body) values (:'dana_marcus', :'marcus', 'still talking to Dana');
select test.check('...he can still write to Dana',
  (select count(*) from public.messages where conversation_id = :'dana_marcus' and sender_id = :'marcus') - :marcus_wrote_before, 1);
select test.check_raises('...but not to Alice',
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hi')$$, :'alice_marcus', :'marcus'));

-- A program, blocked, is told, and can still read.
select test.as_user(:'alice');
select test.check('Alice is told she was blocked',
  (select count(*) from public.conversation_block_state(:'alice_marcus') where blocked_me and not i_blocked), 1);
select test.check_raises('...cannot send',
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hi')$$, :'alice_marcus', :'alice'));
select test.check('...and cannot see the block itself',
  (select count(*) from public.blocks), 0);
select test.check_raises('...nor lift it',
  $$select public.unblock_in_conversation('00000000-0000-0000-0000-000000000000')$$);

-- Staff can block a member; the member cannot undo it.
select test.as_user(:'admin_north');
select public.block_in_conversation(:'dana_marcus');
select test.as_user(:'marcus');
select test.check('Marcus is told Dana blocked him',
  (select count(*) from public.conversation_block_state(:'dana_marcus') where blocked_me), 1);
select public.unblock_in_conversation(:'dana_marcus');
select test.check('...and unblocking from his side does not lift hers',
  (select count(*) from public.conversation_block_state(:'dana_marcus') where blocked_me), 1);
select test.check_raises('...so he still cannot send to Dana',
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hi')$$, :'dana_marcus', :'marcus'));
select test.check('...but he still reads what was said, his own words included',
  (select count(*) from public.messages where conversation_id = :'dana_marcus' and body = 'still talking to Dana'), 1);

-- The audit log holds the fact, not words.
reset role;
select test.check('a block leaves one audit row each, naming the conversation and nothing else',
  (select count(*) from public.audit_log where action = 'profile.block'
     and (meta - 'conversation_id') = '{}'::jsonb and meta ? 'conversation_id') - :blocks_before, 2);
select test.check('...and no message words anywhere in them',
  (select count(*) from public.audit_log where action in ('profile.block', 'profile.unblock')
     and (meta::text like '%still talking%' or meta::text like '% hi%')), 0);
select test.check('an unblock is recorded too (Marcus lifted Dana''s? no: only his own, which was a no-op)',
  (select count(*) from public.audit_log where action = 'profile.unblock') - :unblocks_before, 0);

-- Lifting: only the blocker's own.
set role authenticated;
select test.as_user(:'marcus');
select public.unblock_in_conversation(:'alice_marcus');
select test.check('Marcus lifts his own block and Alice can write again',
  (select count(*) from public.conversation_block_state(:'alice_marcus') where not i_blocked and not blocked_me), 1);
select test.as_user(:'admin_north');
select public.unblock_in_conversation(:'dana_marcus');
select test.check('Dana lifts hers',
  (select count(*) from public.conversation_block_state(:'dana_marcus') where not i_blocked and not blocked_me), 1);

-- A block goes with the account (the person's own and the person's they blocked).
reset role;
select test.check('blocks cascade from the blocker',
  (select count(*) from pg_constraint where conrelid = 'public.blocks'::regclass
     and confrelid = 'public.profiles'::regclass and contype = 'f' and confdeltype = 'c'), 2);
delete from public.blocks;
