-- Messenger (0063–0065): who may open a conversation is a database rule,
-- a new message lights the bell and nothing else, and a report is seen by
-- exactly the people D-074 named.
--
-- Runs after the 04_* files (the runner's glob is `0[2-9]_*.sql`), which
-- matters: 04_rpc_test.sql's "a case manager cannot read the messages table
-- at all" check must run before this file gives Dana a conversation of her
-- own, and 04_rpc_test.sql is what files the report this file checks the
-- audience of.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set admin_north   '33333333-0000-0000-0000-00000000000a'
\set admin_south   '33333333-0000-0000-0000-00000000000b'
\set marcus        '33333333-0000-0000-0000-00000000000c'
\set tanya         '33333333-0000-0000-0000-00000000000d'
\set luis          '33333333-0000-0000-0000-00000000000e'
\set alice         '33333333-0000-0000-0000-00000000000f'
\set bob           '33333333-0000-0000-0000-000000000010'
\set nia           '33333333-0000-0000-0000-000000000011'
\set root          '33333333-0000-0000-0000-000000000020'
\set convo1        '66666666-0000-0000-0000-000000000001'

-- ===========================================================================
\echo ''
\echo '--- Fixture: a super admin, which the seed has none of ---'
-- ===========================================================================
reset role;
insert into auth.users (id) values (:'root');
insert into public.profiles (id, role, first_name, region_id, is_mentor, is_public, access_status)
values (:'root', 'super_admin', 'Root', null, false, false, 'active');

select count(*) as outbound_before from public.outbound_messages \gset

-- ===========================================================================
\echo ''
\echo '--- The direct routes are closed (0063) ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'marcus');

select test.check_raises('a member cannot insert a conversation row directly',
  $$insert into public.conversations (kind) values ('direct')$$);

select test.as_user(:'tanya');
select test.check_raises('an account cannot add itself to a conversation it learned the id of',
  format($$insert into public.conversation_members (conversation_id, profile_id) values (%L, %L)$$,
         :'convo1', :'tanya'));

select test.as_user(:'admin_north');
select test.check_raises('a case manager cannot insert conversation members directly either',
  format($$insert into public.conversation_members (conversation_id, profile_id) values (%L, %L)$$,
         :'convo1', :'admin_north'));

-- ===========================================================================
\echo ''
\echo '--- Who can I message: the same rule, listed (0063) ---'
-- ===========================================================================
select test.as_user(:'marcus');
select test.check('a member lists their case manager and their program admin, nobody else',
  (select count(*) from public.messageable_people()), 2);
select test.check('...and never another member',
  (select count(*) from public.messageable_people() where role = 'member'), 0);

select test.as_user(:'tanya');
select test.check('a member with no case manager and no enrollment lists nobody',
  (select count(*) from public.messageable_people()), 0);

select test.as_user(:'admin_north');
-- Dana's caseload is Marcus plus whoever 04_rpc_test.sql redeemed an invite
-- onto it — so the checks are membership, not a count.
select test.check('a case manager lists their assigned member',
  (select count(*) from public.messageable_people() where profile_id = :'marcus'), 1);
select test.check('...not a member who merely shares the region',
  (select count(*) from public.messageable_people() where profile_id = :'tanya'), 0);
select test.check('...and nobody who is not a member',
  (select count(*) from public.messageable_people() where role <> 'member'), 0);

select test.as_user(:'alice');
select test.check('a program admin lists members enrolled in their org''s services',
  (select count(*) from public.messageable_people()), 1);

select test.as_user(:'bob');
select test.check('a program admin with no enrolled members lists nobody',
  (select count(*) from public.messageable_people()), 0);

select test.as_user(:'root');
select test.check('a super admin lists nobody (D-171)',
  (select count(*) from public.messageable_people()), 0);

-- ===========================================================================
\echo ''
\echo '--- Opening a conversation: forbidden pairs are refused (0063) ---'
-- ===========================================================================
select test.as_user(:'marcus');
select test.check_raises('member -> member is refused',
  format($$select public.open_direct_conversation(%L)$$, :'nia'));
select test.check_raises('member -> another member in the same region is refused',
  format($$select public.open_direct_conversation(%L)$$, :'tanya'));
select test.check_raises('member -> a case manager who is not theirs is refused',
  format($$select public.open_direct_conversation(%L)$$, :'admin_south'));
select test.check_raises('member -> a program they are not enrolled with is refused',
  format($$select public.open_direct_conversation(%L)$$, :'bob'));

select test.as_user(:'root');
select test.check_raises('super admin -> anyone is refused (D-171)',
  format($$select public.open_direct_conversation(%L)$$, :'marcus'));

select test.as_user(:'admin_north');
select test.check_raises('case manager -> a region-only member is refused',
  format($$select public.open_direct_conversation(%L)$$, :'tanya'));
select test.check_raises('case manager -> a member in another region is refused',
  format($$select public.open_direct_conversation(%L)$$, :'luis'));
select test.check_raises('case manager -> a program admin is refused',
  format($$select public.open_direct_conversation(%L)$$, :'alice'));

select test.as_user(:'bob');
select test.check_raises('cross-org program admin -> member is refused',
  format($$select public.open_direct_conversation(%L)$$, :'marcus'));

-- ===========================================================================
\echo ''
\echo '--- ...and allowed pairs succeed, both directions, reusing what exists ---'
-- ===========================================================================
select test.as_user(:'admin_north');
select public.open_direct_conversation(:'marcus') as dana_marcus \gset
select test.check('case manager -> assigned member opens a conversation',
  (select count(*) from public.conversation_members where conversation_id = :'dana_marcus'), 2);

select test.as_user(:'marcus');
select public.open_direct_conversation(:'admin_north') as marcus_dana \gset
select test.check('member -> their case manager lands in the same conversation, not a second one',
  (select case when :'marcus_dana'::uuid = :'dana_marcus'::uuid then 1 else 0 end), 1);

select public.open_direct_conversation(:'alice') as marcus_alice \gset
select test.check('member -> their program admin reuses the seeded conversation',
  (select case when :'marcus_alice'::uuid = :'convo1'::uuid then 1 else 0 end), 1);

select test.as_user(:'alice');
select public.open_direct_conversation(:'marcus') as alice_marcus \gset
select test.check('program admin -> enrolled member reuses the seeded conversation',
  (select case when :'alice_marcus'::uuid = :'convo1'::uuid then 1 else 0 end), 1);

-- ===========================================================================
\echo ''
\echo '--- A new message lights the recipient''s bell, and only theirs (0064) ---'
-- ===========================================================================
-- Earlier files already put messages into this same conversation (the
-- transparency test seeds it as convo2), so the check is a delta, not a count.
select test.as_user(:'marcus');
select count(*) as marcus_before from public.notifications
  where kind = 'message_received' and subject_id = :'dana_marcus' \gset

select test.as_user(:'admin_north');
insert into public.messages (conversation_id, sender_id, body)
values (:'dana_marcus', :'admin_north', 'Checking in — how did Tuesday go?');

select test.as_user(:'marcus');
select test.check('the recipient gets one more message_received notification',
  (select count(*) from public.notifications
   where kind = 'message_received' and subject_id = :'dana_marcus'), :marcus_before + 1);
select test.check('...naming the sender, with no message text',
  (select count(*) from public.notifications
   where kind = 'message_received'
     and subject_id = :'dana_marcus'
     and body_key = 'notify.message_received'
     and body_vars->>'name' = 'Dana'
     and body_vars::text not like '%Tuesday%'), :marcus_before + 1);
select test.check('...and nothing carries the words that were sent',
  (select count(*) from public.notifications where body_vars::text like '%Tuesday%'), 0);

select test.as_user(:'admin_north');
select test.check('the sender gets none about their own message',
  (select count(*) from public.notifications
   where kind = 'message_received' and subject_id = :'dana_marcus'
     and body_vars->>'name' = 'Dana'), 0);

reset role;
select test.check('no text message was queued for it',
  (select count(*) from public.outbound_messages), :outbound_before);

-- ===========================================================================
\echo ''
\echo '--- A report is seen by the responsible case manager and super admins (0065) ---'
-- ===========================================================================
-- 04_rpc_test.sql filed one report: Marcus, about Alice's message in convo1.
set role authenticated;

select test.as_user(:'admin_north');
-- Earlier files file more than one report about that message, so "sees it"
-- is at-least-one, and the negative checks are exact zeros.
select test.check('the reporter''s case manager sees the report',
  (select count(*) from (select 1 from public.reports where target_type = 'message' limit 1) x), 1);
select test.check('...with the reporter''s and the sender''s first names, via reports_for_review()',
  (select count(*) from (select 1 from public.reports_for_review()
   where reporter_name = 'Marcus' and about_name = 'Alice' and target_excerpt is not null limit 1) x), 1);

select test.as_user(:'admin_south');
select test.check('a case manager in another region sees nothing',
  (select count(*) from public.reports), 0);
select test.check('...through the function either',
  (select count(*) from public.reports_for_review()), 0);

select test.as_user(:'root');
select test.check('a super admin sees the report',
  (select count(*) from (select 1 from public.reports_for_review() limit 1) x), 1);

select test.as_user(:'alice');
select test.check('the person reported about does not see the report',
  (select count(*) from public.reports), 0);

select test.as_user(:'marcus');
select test.check('the reporter still sees their own report',
  (select count(*) from (select 1 from public.reports limit 1) x), 1);

reset role;
