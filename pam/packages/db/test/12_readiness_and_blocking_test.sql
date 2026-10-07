-- The 30 September readiness review (0068) and blocking (0069).
--
-- Every hole 0068 closes is attacked here the way it was found: as a signed-in
-- account doing something the screen never offers. And the phone numbers are
-- stored the way Supabase Auth really stores them — bare digits, no "+" —
-- which is the one thing every earlier fixture got wrong, and why nothing
-- noticed that no invite could be redeemed on the live project.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set admin_north   '33333333-0000-0000-0000-00000000000a'
\set marcus        '33333333-0000-0000-0000-00000000000c'
\set tanya         '33333333-0000-0000-0000-00000000000d'
\set luis          '33333333-0000-0000-0000-00000000000e'
\set alice         '33333333-0000-0000-0000-00000000000f'
\set kim           '33333333-0000-0000-0000-0000000000a1'
\set lee           '33333333-0000-0000-0000-0000000000a2'
\set org_north     '22222222-0000-0000-0000-000000000001'

-- ===========================================================================
\echo ''
\echo '--- Phone numbers: stored as E.164, whatever shape Auth hands over (0068) ---'
-- ===========================================================================
reset role;
select test.check('bare ten digits become a US number',
  (select count(*) from (select 1 where public.to_e164('2675550100') = '+12675550100') x), 1);
select test.check('Auth''s own shape (country code, no plus) gains the plus',
  (select count(*) from (select 1 where public.to_e164('12675550100') = '+12675550100') x), 1);
select test.check('punctuation is dropped from a number that already had its plus',
  (select count(*) from (select 1 where public.to_e164('+1 (267) 555-0100') = '+12675550100') x), 1);
select test.check('nothing stays nothing',
  (select count(*) from (select 1 where public.to_e164(null) is null and public.to_e164('  ') is null) x), 1);
select test.check('the same formatting guards the text-message queue',
  (select count(*) from pg_trigger where tgname = 'outbound_messages_phone_e164' and not tgisinternal), 1);

insert into auth.users (id, phone) values
  (:'kim', '12675550101'),
  (:'lee', '12675550103');

set role authenticated;
select test.as_user(:'kim');
select (public.start_membership('Kim', null, 'North', 'en')).id as kim_profile \gset

reset role;
select test.check('a member who signed up alone has the number they verified, as E.164',
  (select count(*) from public.profiles where id = :'kim' and phone = '+12675550101'), 1);

set role authenticated;
select test.as_user(:'admin_north');
select (public.create_invite('member', '+12675550103', null)).code as lee_code \gset

select test.as_user(:'lee');
select (public.redeem_invite(:'lee_code', 'Lee')).id as lee_profile \gset

reset role;
select test.check('an invite prefilled with E.164 redeems for the Auth number it was made for',
  (select count(*) from public.profiles where id = :'lee' and phone = '+12675550103'), 1);
select test.check('...and Lee was invited by Dana',
  (select count(*) from public.profiles where id = :'lee' and invited_by = :'admin_north'), 1);

-- ===========================================================================
\echo ''
\echo '--- Nobody signed in can read a phone number off a profile (0068) ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'admin_north');
select test.check('a case manager still reads a caseload member''s name',
  (select count(*) from public.profiles where id = :'marcus' and first_name = 'Marcus'), 1);
select test.check_raises('...but not their phone number',
  format($$select phone from public.profiles where id = %L$$, :'marcus'));
select test.check_raises('...not even by asking for every column',
  format($$select * from public.profiles where id = %L$$, :'marcus'));

select test.as_user(:'kim');
select test.check_raises('a member cannot read their own phone through the API either',
  format($$select phone from public.profiles where id = %L$$, :'kim'));

-- ===========================================================================
\echo ''
\echo '--- A request is only ever answered by the person asked (0068) ---'
-- ===========================================================================
select test.as_user(:'tanya');
insert into public.connections (requester_id, receiver_id, kind, status, responded_at)
values (:'tanya', :'luis', 'buddy', 'accepted', now());

reset role;
select test.check('inserting a connection as "accepted" still lands as a request',
  (select count(*) from public.connections
   where requester_id = :'tanya' and receiver_id = :'luis' and status = 'pending' and responded_at is null), 1);

set role authenticated;
select test.as_user(:'tanya');
select test.check_raises('the requester cannot accept their own request',
  format($$update public.connections set status = 'accepted'
           where requester_id = %L and receiver_id = %L$$, :'tanya', :'luis'));
select test.check_raises('...nor point it at somebody else',
  format($$update public.connections set receiver_id = %L
           where requester_id = %L and receiver_id = %L$$, :'marcus', :'tanya', :'luis'));
select test.check('so Tanya still cannot read Luis''s profile',
  (select count(*) from public.profiles where id = :'luis'), 0);

select test.as_user(:'luis');
update public.connections set status = 'accepted', responded_at = now()
where requester_id = :'tanya' and receiver_id = :'luis';

reset role;
select test.check('the person asked can accept',
  (select count(*) from public.connections
   where requester_id = :'tanya' and receiver_id = :'luis' and status = 'accepted'), 1);

-- ===========================================================================
\echo ''
\echo '--- A membership is only marked read; a sent message is final (0068) ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'admin_north');
select public.open_direct_conversation(:'marcus') as dana_marcus \gset
select test.as_user(:'alice');
select public.open_direct_conversation(:'marcus') as alice_marcus \gset

select test.as_user(:'admin_north');
select test.check_raises('a member row cannot be moved into somebody else''s conversation',
  format($$update public.conversation_members set conversation_id = %L
           where conversation_id = %L and profile_id = %L$$,
         :'alice_marcus', :'dana_marcus', :'admin_north'));
update public.conversation_members set last_read_at = now()
where conversation_id = :'dana_marcus' and profile_id = :'admin_north';
select test.check('...but it can be marked read',
  (select count(*) from public.conversation_members
   where conversation_id = :'dana_marcus' and profile_id = :'admin_north' and last_read_at is not null), 1);
select test.check('Dana still cannot see into Alice and Marcus''s conversation',
  (select count(*) from public.messages where conversation_id = :'alice_marcus'), 0);

insert into public.messages (conversation_id, sender_id, body)
values (:'dana_marcus', :'admin_north', 'Readiness check: this one stays as written.')
returning id as dana_msg \gset

select test.check_raises('a sender cannot rewrite a message',
  format($$update public.messages set body = 'something else' where id = %L$$, :'dana_msg'));
select test.check_raises('...or clear a report off it',
  format($$update public.messages set flagged_at = null, flag_reason = null where id = %L$$, :'dana_msg'));
select test.check_raises('...or send one already marked as reported',
  format($$insert into public.messages (conversation_id, sender_id, body, flagged_at)
           values (%L, %L, 'hi', now())$$, :'dana_marcus', :'admin_north'));

-- ===========================================================================
\echo ''
\echo '--- One unvouched account cannot empty the catalogue (0068) ---'
-- ===========================================================================
reset role;
insert into public.services (id, org_id, name, category, subcategory, is_active, needs_review)
select ('66666666-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, :'org_north',
       'Readiness place ' || n, 'education', 'ged_high_school', true, false
from generate_series(1, 14) as n;

set role authenticated;
select test.as_user(:'kim');
select (public.flag_service('66666666-0000-0000-0000-000000000001', 'closed')).id as kim_flag \gset

reset role;
select test.check('a flag from an account nobody vouched for is recorded',
  (select count(*) from public.service_flags where id = :'kim_flag' and status = 'pending'), 1);
select test.check('...and the place stays up',
  (select count(*) from public.services where id = '66666666-0000-0000-0000-000000000001' and is_active), 1);

set role authenticated;
select test.as_user(:'kim');
select test.check('saying it twice is one flag, not two',
  (select count(*) from (select public.flag_service('66666666-0000-0000-0000-000000000001', 'moved')) x), 1);
reset role;
select test.check('...so the place is still up',
  (select count(*) from public.services where id = '66666666-0000-0000-0000-000000000001' and is_active), 1);

set role authenticated;
select test.as_user(:'tanya');
select public.flag_service('66666666-0000-0000-0000-000000000001', 'closed');
reset role;
select test.check('a second, different account hides it',
  (select count(*) from public.services where id = '66666666-0000-0000-0000-000000000001' and is_active), 0);

set role authenticated;
select test.as_user(:'admin_north');
select public.flag_service('66666666-0000-0000-0000-000000000002', 'closed');
reset role;
select test.check('a case manager''s flag still hides a place at once (D-071)',
  (select count(*) from public.services where id = '66666666-0000-0000-0000-000000000002' and is_active), 0);

set role authenticated;
select test.as_user(:'lee');
select public.flag_service('66666666-0000-0000-0000-000000000003', 'moved');
reset role;
select test.check('...and so does a member their case manager invited',
  (select count(*) from public.services where id = '66666666-0000-0000-0000-000000000003' and is_active), 0);

set role authenticated;
select test.as_user(:'kim');
do $$
declare n integer;
begin
  -- Kim has one flag today already; nine more reach the day's ten.
  for n in 4..12 loop
    perform public.flag_service(('66666666-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, 'closed');
  end loop;
end;
$$;
select test.check_raises('an eleventh flag in a day is refused',
  $$select public.flag_service('66666666-0000-0000-0000-000000000013', 'closed')$$);
reset role;
select test.check('...and every one of Kim''s ten places is still up',
  (select count(*) from public.services
   where id::text like '66666666-0000-0000-0000-%' and is_active
     and id not in ('66666666-0000-0000-0000-000000000001',
                    '66666666-0000-0000-0000-000000000002',
                    '66666666-0000-0000-0000-000000000003')), 11);

-- ===========================================================================
\echo ''
\echo '--- Blocking, from inside a conversation (0069) ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'marcus');
select test.check('no block to begin with',
  (select count(*) from public.conversation_block_state(:'dana_marcus') where not i_blocked and not blocked_me), 1);

select public.block_in_conversation(:'dana_marcus');

select test.check('Marcus sees that he blocked Dana',
  (select count(*) from public.conversation_block_state(:'dana_marcus') where i_blocked and not blocked_me), 1);
select test.check('...and the block is his to read',
  (select count(*) from public.blocks where blocker_id = :'marcus' and blocked_id = :'admin_north'), 1);
select test.check_raises('Marcus cannot send into the conversation',
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hi')$$,
         :'dana_marcus', :'marcus'));
select test.check('...but everything already said is still there to read',
  (select count(*) from public.messages where id = :'dana_msg'), 1);
select test.check('...and to report',
  (select count(*) from (select public.report_message(:'dana_msg', 'unwanted')) x), 1);

select test.as_user(:'admin_north');
select test.check('Dana sees that she was blocked',
  (select count(*) from public.conversation_block_state(:'dana_marcus') where blocked_me and not i_blocked), 1);
select test.check('...but not the block row itself',
  (select count(*) from public.blocks), 0);
select test.check_raises('Dana cannot send to Marcus',
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hi')$$,
         :'dana_marcus', :'admin_north'));
select test.check('Marcus is gone from Dana''s New message list',
  (select count(*) from public.messageable_people() where profile_id = :'marcus'), 0);
select test.check_raises('...and Dana cannot open a new conversation with him',
  format($$select public.open_direct_conversation(%L)$$, :'marcus'));
select test.check_raises('Dana cannot write a block row of her own',
  format($$insert into public.blocks (blocker_id, blocked_id) values (%L, %L)$$, :'admin_north', :'luis'));

select public.unblock_in_conversation(:'dana_marcus');
select test.as_user(:'marcus');
select test.check('Dana cannot lift a block Marcus made',
  (select count(*) from public.conversation_block_state(:'dana_marcus') where i_blocked), 1);

select test.as_user(:'alice');
select test.check('Alice, in her own conversation with Marcus, is untouched by it',
  (select count(*) from public.conversation_block_state(:'alice_marcus') where not i_blocked and not blocked_me), 1);
select test.check_raises('...and cannot ask about a conversation she is not in',
  format($$select public.block_in_conversation(%L)$$, :'dana_marcus'));
select test.check('...where the state question answers nothing at all',
  (select count(*) from public.conversation_block_state(:'dana_marcus')), 0);

select test.as_user(:'marcus');
select public.unblock_in_conversation(:'dana_marcus');
select test.check('Marcus can lift his own block',
  (select count(*) from public.conversation_block_state(:'dana_marcus') where not i_blocked and not blocked_me), 1);

select test.as_user(:'admin_north');
insert into public.messages (conversation_id, sender_id, body)
values (:'dana_marcus', :'admin_north', 'Glad we can talk again.');
select test.check('...after which Dana can send again',
  (select count(*) from public.messages
   where conversation_id = :'dana_marcus' and body = 'Glad we can talk again.'), 1);

reset role;
select test.check('anon cannot block anybody',
  (select count(*) from (select 1 where has_function_privilege('anon', 'public.block_in_conversation(uuid)', 'execute')) x), 0);
select test.check('...or lift a block',
  (select count(*) from (select 1 where has_function_privilege('anon', 'public.unblock_in_conversation(uuid)', 'execute')) x), 0);
select test.check('both are in the audit log',
  (select count(*) from public.audit_log
   where actor_id = :'marcus' and action in ('profile.block', 'profile.unblock')), 2);
