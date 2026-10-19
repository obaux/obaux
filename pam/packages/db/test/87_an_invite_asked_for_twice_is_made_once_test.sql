-- an invite asked for twice is made once (test 87).
--
-- Claimed 2026-10-19 on `claude/pam-invite-once` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

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

-- Dana and Ray (seed case managers, north and south), Alice (seed program lead, north). Numbers 267 555 87xx are this file's.
\set dana  '33333333-0000-0000-0000-00000000000a'
\set ray   '33333333-0000-0000-0000-00000000000b'
\set alice '33333333-0000-0000-0000-00000000000f'
\set req1  '87000000-0000-4000-8000-000000000001'
\set req2  '87000000-0000-4000-8000-000000000002'
\set req3  '87000000-0000-4000-8000-000000000003'

\echo ''
\echo '--- A member invite asked for twice with the same id is one invite ---'
set role authenticated;
select test.as_user(:'dana');
select (public.create_invite_once(:'req1', 'member', '267-555-8701', null, 'Rosa')).code as first_code \gset
select (public.create_invite_once(:'req1', 'member', '(267) 555-8701', null, '  Rosa ')).code as again_code \gset
reset role;
select test.check('the retry hands back the same code (the number and name written another way are the same details)',
  (select case when :'first_code' = :'again_code' then 1 else 0 end), 1);
select test.check('...and there is one invite for it, carrying the request id',
  (select count(*) from public.invites where phone = '+12675558701' and request_id = :'req1'), 1);

\echo ''
\echo '--- The same id with different details is refused, not answered with somebody else''s invite ---'
set role authenticated;
select test.as_user(:'dana');
select test.check_raises_like('a different name', $$ select public.create_invite_once('87000000-0000-4000-8000-000000000001', 'member', '267-555-8701', null, 'Rose') $$, '%INVITE_REQUEST_REUSED%');
select test.check_raises_like('a different number', $$ select public.create_invite_once('87000000-0000-4000-8000-000000000001', 'member', '267-555-8702', null, 'Rosa') $$, '%INVITE_REQUEST_REUSED%');
select test.check_raises_like('a different role', $$ select public.create_staff_invite_once('87000000-0000-4000-8000-000000000001', 'provider', 'rosa@example.org', '267-555-8701', null, 'Rosa') $$, '%INVITE_REQUEST_REUSED%');
reset role;
select test.check('...and nothing more was made',
  (select count(*) from public.invites where phone in ('+12675558701', '+12675558702')), 1);

\echo ''
\echo '--- A staff invite asked for twice is one invite and one email ---'
set role authenticated;
select test.as_user(:'dana');
select (public.create_staff_invite_once(:'req2', 'admin', 'Cam@Example.org', '267-555-8703', null, 'Cam')).code as staff_code \gset
select (public.create_staff_invite_once(:'req2', 'admin', 'cam@example.org', '267-555-8703', null, 'Cam')).code as staff_again \gset
select test.check_raises_like('the same id with another email is refused', $$ select public.create_staff_invite_once('87000000-0000-4000-8000-000000000002', 'admin', 'kim@example.org', '267-555-8703', null, 'Cam') $$, '%INVITE_REQUEST_REUSED%');
reset role;
select test.check('the retry hands back the same staff code',
  (select case when :'staff_code' = :'staff_again' then 1 else 0 end), 1);
select test.check('...one invite',
  (select count(*) from public.invites where phone = '+12675558703'), 1);
select test.check('...and one email waiting to be sent',
  (select count(*) from public.staff_invite_emails q join public.invites i on i.id = q.invite_id where i.phone = '+12675558703'), 1);

\echo ''
\echo '--- An id is the inviter''s own: another inviter with the same id makes their own invite ---'
set role authenticated;
select test.as_user(:'alice');
select (public.create_invite_once(:'req1', 'member', '267-555-8701', null, 'Rosa')).code as alice_code \gset
reset role;
select test.check('a different inviter with the same id gets a new invite, not Dana''s',
  (select case when :'alice_code' <> :'first_code' then 1 else 0 end), 1);
select test.check('...so the number has two invites, one from each',
  (select count(distinct created_by) from public.invites where phone = '+12675558701' and request_id = :'req1'), 2);

\echo ''
\echo '--- The new doors keep every rule of the old ones, and need an id ---'
set role authenticated;
select test.as_user(:'alice');
select test.check_raises_like('a program still cannot invite a case manager', $$ select public.create_staff_invite_once('87000000-0000-4000-8000-000000000003', 'admin', 'x@example.org', '267-555-8704', null, 'Xan') $$, '%cannot invite a case manager%');
select test.check_raises_like('a staff role through the member door needs an email', $$ select public.create_invite_once('87000000-0000-4000-8000-000000000003', 'provider', '267-555-8704', null, 'Xan') $$, '%INVITE_NEEDS_EMAIL%');
select test.check_raises_like('a number that is not one is refused as before', $$ select public.create_invite_once('87000000-0000-4000-8000-000000000003', 'member', '0267 555 87', null, 'Xan') $$, '%INVITE_NEEDS_PHONE%');
select test.check_raises_like('no id, no invite', $$ select public.create_invite_once(null, 'member', '267-555-8704', null, 'Xan') $$, '%INVITE_NEEDS_REQUEST_ID%');
select test.as_user(:'ray');
select test.check_raises_like('a case manager still cannot invite into another city', $$ select public.create_invite_once('87000000-0000-4000-8000-000000000003', 'member', '267-555-8704', '11111111-0000-0000-0000-000000000001', 'Xan') $$, '%region you do not administer%');
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select test.check_raises_like('a signed-out caller cannot reach the new doors', $$ select public.create_invite_once('87000000-0000-4000-8000-000000000003', 'member', '267-555-8704', null, 'Xan') $$, '%permission denied%');
set role authenticated;
select test.as_user(:'dana');
select test.check_raises_like('...nor anyone the inner function', $$ select public.invite_create_once('87000000-0000-4000-8000-000000000003', 'member', '267-555-8704', null, 'Xan', null) $$, '%permission denied%');
reset role;
select test.check('the id is a column with nothing personal in it, unique per inviter only where set',
  (select count(*) from pg_indexes where schemaname = 'public' and indexname = 'invites_request_once'
     and indexdef like '%(created_by, request_id)%' and indexdef like '%WHERE (request_id IS NOT NULL)%'), 1);
select test.check('the old doors are still there, unchanged, for a live app that has not moved yet',
  (select count(*) from pg_proc where proname in ('create_invite', 'create_staff_invite') and pronamespace = 'public'::regnamespace), 2);

-- Count only our own rows, and leave none behind.
delete from public.invites where phone in ('+12675558701', '+12675558702', '+12675558703', '+12675558704');
