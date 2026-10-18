-- Who reads a Pam conversation, and who can write in it (test 80; D-605, D-606; migration 20261018072101).
--
-- Claimed 2026-10-18 on `claude/messages-pam-s0-s1a` with `pnpm claim test`. The files run in name order on one database.
--
-- The seed's people: Marcus (member) is the one who writes to Pam. Dana is Marcus's case manager (his guide). Alice is a program
-- lead who has a direct conversation with Marcus. South is a case manager with nothing to do with either. Root is a super admin
-- (added by 05). Rosa is another member. The attack: nobody but the Pam team reads a Pam conversation; the Pam team reads no
-- other conversation; a limited account can write to Pam and nowhere else; and no client can make a Pam conversation.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

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

\set dana    '33333333-0000-0000-0000-00000000000a'
\set south   '33333333-0000-0000-0000-00000000000b'
\set marcus  '33333333-0000-0000-0000-00000000000c'
\set alice   '33333333-0000-0000-0000-00000000000f'
\set root    '33333333-0000-0000-0000-000000000020'
\set rosa    'cccccccc-0000-0000-0000-000000008001'
\set pam_c   'ffffffff-0000-0000-0000-000000008001'
\set direct_c '66666666-0000-0000-0000-000000000001'
\set region_north '11111111-0000-0000-0000-000000000001'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values (:'rosa', '12675550801');
insert into public.profiles (id, role, first_name, region_id, phone, access_status) values
  (:'rosa', 'member', 'Rosa', :'region_north', '+12675550801', 'active');

-- Marcus's one Pam conversation, with two messages: one from him, one from the team.
insert into public.conversations (id, kind) values (:'pam_c', 'support');
insert into public.conversation_members (conversation_id, profile_id) values (:'pam_c', :'marcus');
insert into public.pam_threads (conversation_id, asker_id) values (:'pam_c', :'marcus');
insert into public.messages (conversation_id, sender_id, body) values
  (:'pam_c', :'marcus', 'I cannot find my program'),
  (:'pam_c', :'root',   'We can help with that');
insert into storage.objects (bucket_id, name, owner)
  values ('message-photos', :'pam_c' || '/shot.jpg', :'marcus');

\echo ''
\echo '--- The Pam team reads a Pam conversation, and only a Pam conversation ---'
set role authenticated;
select test.as_user(:'root');
select test.check('the Pam team reads both messages in Marcus''s Pam conversation',
  (select count(*) from public.messages where conversation_id = :'pam_c'), 2);
select test.check('...and its conversation row and its one member',
  (select count(*) from public.conversations where id = :'pam_c')
  + (select count(*) from public.conversation_members where conversation_id = :'pam_c'), 2);
select test.check('...and the thread row',
  (select count(*) from public.pam_threads where conversation_id = :'pam_c'), 1);
select test.check('...and the photo in its folder',
  (select count(*) from storage.objects where bucket_id = 'message-photos' and name = :'pam_c' || '/shot.jpg'), 1);
select test.check('the Pam team reads NOTHING in a direct conversation it is not in (Marcus and Alice)',
  (select count(*) from public.messages where conversation_id = :'direct_c'), 0);
select test.check('...nor that conversation''s row or members',
  (select count(*) from public.conversations where id = :'direct_c')
  + (select count(*) from public.conversation_members where conversation_id = :'direct_c'), 0);

\echo ''
\echo '--- Nobody else reads it ---'
select test.as_user(:'dana');
select test.check('Marcus''s case manager reads no message in his Pam conversation',
  (select count(*) from public.messages where conversation_id = :'pam_c'), 0);
select test.check('...nor its conversation, members, thread row or photo',
  (select count(*) from public.conversations where id = :'pam_c')
  + (select count(*) from public.conversation_members where conversation_id = :'pam_c')
  + (select count(*) from public.pam_threads)
  + (select count(*) from storage.objects where bucket_id = 'message-photos' and name = :'pam_c' || '/shot.jpg'), 0);
select test.as_user(:'south');
select test.check('another case manager reads nothing of it',
  (select count(*) from public.messages where conversation_id = :'pam_c'), 0);
select test.as_user(:'alice');
select test.check('a program lead who talks to Marcus reads nothing of it',
  (select count(*) from public.messages where conversation_id = :'pam_c'), 0);
select test.as_user(:'rosa');
select test.check('another member reads nothing of it',
  (select count(*) from public.messages where conversation_id = :'pam_c')
  + (select count(*) from public.pam_threads)
  + (select count(*) from storage.objects where bucket_id = 'message-photos' and name = :'pam_c' || '/shot.jpg'), 0);
select test.as_user(:'marcus');
select test.check('Marcus reads his own two messages',
  (select count(*) from public.messages where conversation_id = :'pam_c'), 2);
select test.check('...and the photo, but not the thread row (that is the team''s)',
  (select count(*) from storage.objects where bucket_id = 'message-photos' and name = :'pam_c' || '/shot.jpg')
  + (select count(*) from public.pam_threads), 1);

\echo ''
\echo '--- Who can write in it ---'
select test.as_user(:'root');
insert into public.messages (conversation_id, sender_id, body) values (:'pam_c', :'root', 'Did that help?');
select test.check('the Pam team can write in a Pam conversation',
  (select count(*) from public.messages where conversation_id = :'pam_c' and body = 'Did that help?'), 1);
select test.check_raises_like('...but not in a direct conversation it is not in',
  format($$ insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hello') $$, :'direct_c', :'root'),
  '%row-level security%');
select test.as_user(:'dana');
select test.check_raises_like('a case manager cannot write in someone''s Pam conversation',
  format($$ insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hello') $$, :'pam_c', :'dana'),
  '%row-level security%');
select test.as_user(:'rosa');
select test.check_raises_like('another member cannot write in it',
  format($$ insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hello') $$, :'pam_c', :'rosa'),
  '%row-level security%');
select test.check_raises_like('...nor make themselves a member of it',
  format($$ insert into public.conversation_members (conversation_id, profile_id) values (%L, %L) $$, :'pam_c', :'rosa'),
  '%row-level security%');
select test.check_raises_like('no client can make a Pam conversation',
  $$ insert into public.conversations (kind) values ('support') $$, '%row-level security%');
select test.check_raises_like('no client can make a thread row',
  format($$ insert into public.pam_threads (conversation_id, asker_id) values (%L, %L) $$, :'pam_c', :'rosa'), '%permission denied%');
select test.as_user(:'marcus');
update public.pam_threads set status = 'closed' where conversation_id = :'pam_c';
reset role;
select test.check('Marcus cannot close his own thread (it is the team''s): it stays open',
  (select count(*) from public.pam_threads where conversation_id = :'pam_c' and status = 'open'), 1);
set role authenticated;

\echo ''
\echo '--- A limited account writes to Pam and nowhere else (D-413 is narrowed for Pam only) ---'
reset role;
update public.profiles set access_status = 'limited' where id = :'marcus';
set role authenticated;
select test.as_user(:'marcus');
insert into public.messages (conversation_id, sender_id, body) values (:'pam_c', :'marcus', 'Why is my account limited?');
select test.check('a limited account can write to Pam',
  (select count(*) from public.messages where conversation_id = :'pam_c' and body = 'Why is my account limited?'), 1);
insert into storage.objects (bucket_id, name, owner)
  values ('message-photos', :'pam_c' || '/screenshot.jpg', :'marcus');
select test.check('...and put a photo in it',
  (select count(*) from storage.objects where bucket_id = 'message-photos' and name = :'pam_c' || '/screenshot.jpg'), 1);
select test.check_raises_like('...but still cannot write in a direct conversation (D-413)',
  format($$ insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hello') $$, :'direct_c', :'marcus'),
  '%row-level security%');
reset role;
update public.profiles set access_status = 'suspended' where id = :'marcus';
set role authenticated;
select test.as_user(:'marcus');
select test.check_raises_like('a suspended account cannot write to Pam',
  format($$ insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hello') $$, :'pam_c', :'marcus'),
  '%row-level security%');
reset role;
update public.profiles set access_status = 'active' where id = :'marcus';

\echo ''
\echo '--- What the rule rests on ---'
select test.check('pam_threads has RLS on',
  (select count(*) from pg_class where oid = 'public.pam_threads'::regclass and relrowsecurity), 1);
select test.check('is_pam_team is a security definer with the fixed search path',
  (select count(*) from pg_proc p where p.oid = 'public.is_pam_team()'::regprocedure and p.prosecdef
     and 'search_path=public, extensions' = any (p.proconfig)), 1);
select test.check('one Pam conversation per person: a second thread row for Marcus is refused',
  (select 1), 1);
do $$
begin
  begin
    insert into public.conversations (id, kind) values ('ffffffff-0000-0000-0000-000000008002', 'support');
    insert into public.pam_threads (conversation_id, asker_id) values ('ffffffff-0000-0000-0000-000000008002', '33333333-0000-0000-0000-00000000000c');
    raise exception 'FAIL  a second Pam conversation for the same person was allowed';
  exception when unique_violation then
    raise notice 'ok    a second Pam conversation for the same person is refused';
  end;
end;
$$;
