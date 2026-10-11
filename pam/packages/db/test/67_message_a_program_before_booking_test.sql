-- message a program before booking (test 67).
--
-- Claimed 2026-10-11 on `claude/messages-program-before-booking` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;


-- A check that the statement fails *with this reason*, not just that it fails.
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


\set member  'cccccccc-0000-0000-0000-000000006701'
\set booked  'cccccccc-0000-0000-0000-000000006702'
\set cold    'cccccccc-0000-0000-0000-000000006705'
\set cancel  'cccccccc-0000-0000-0000-000000006706'
\set blk     'cccccccc-0000-0000-0000-000000006707'
\set lead1   'cccccccc-0000-0000-0000-000000006703'
\set lead2   'cccccccc-0000-0000-0000-000000006704'
\set org_a   'dddddddd-0000-0000-0000-000000006701'
\set org_n   'dddddddd-0000-0000-0000-000000006702'
\set svc_a   'eeeeeeee-0000-0000-0000-000000006701'
\set svc_gath 'eeeeeeee-0000-0000-0000-000000006702'
\set svc_nol 'eeeeeeee-0000-0000-0000-000000006703'
\set region_north '11111111-0000-0000-0000-000000000001'

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'member', '12675558671'), (:'booked', '12675558672'),
  (:'lead1', '12675558673'), (:'lead2', '12675558674'),
  (:'cold', '12675558675'), (:'cancel', '12675558676'), (:'blk', '12675558677');
insert into public.orgs (id, name, type, region_id) values
  (:'org_a', 'Msg Org A', 'program', :'region_north'),
  (:'org_n', 'Msg Org With Nobody', 'program', :'region_north');
insert into public.profiles (id, role, first_name, region_id, phone, access_status, org_id) values
  (:'member', 'member', 'Mo', :'region_north', '+12675558671', 'active', null),
  (:'booked', 'member', 'Bo', :'region_north', '+12675558672', 'active', null),
  (:'cold', 'member', 'Cy', :'region_north', '+12675558675', 'active', null),
  (:'cancel', 'member', 'Cal', :'region_north', '+12675558676', 'active', null),
  (:'blk', 'member', 'Bl', :'region_north', '+12675558677', 'active', null),
  (:'lead1', 'provider', 'Ana', :'region_north', '+12675558673', 'active', :'org_a'),
  (:'lead2', 'provider', 'Zed', :'region_north', '+12675558674', 'active', :'org_a');
insert into public.services (id, org_id, name, category, address, source, source_ref, needs_review, is_active) values
  (:'svc_a', :'org_a', 'Msg Program A', 'workforce', '1 Msg St', 'manual', null, false, true),
  (:'svc_gath', null, 'Msg Gathered', 'workforce', '2 Msg St', 'city_import', 'msg-2', false, true),
  (:'svc_nol', :'org_n', 'Msg No Lead', 'workforce', '3 Msg St', 'manual', null, false, true);
insert into public.appointments (member_id, service_id, starts_at, status) values
  (:'booked', :'svc_a', now() + interval '2 days', 'scheduled'),
  (:'cancel', :'svc_a', now() + interval '3 days', 'cancelled');
insert into public.blocks (blocker_id, blocked_id) values (:'lead1', :'blk'), (:'blk', :'lead2');

\echo ''
\echo '--- Message a program before booking ---'
set role authenticated;

select test.as_user(:'member');
create temp table t67 (k text primary key, v uuid);
grant all on t67 to authenticated;
insert into t67 select 'first', public.message_program(:'svc_a');
select test.check('a member with no visit and no enrollment can message a program',
  (select count(*) from public.conversation_members where conversation_id = (select v from t67 where k = 'first')), 2::bigint);
select test.check('...and the person they reach is a lead of that program',
  (select count(*) from public.conversation_members m
    where m.conversation_id = (select v from t67 where k = 'first') and m.profile_id = :'lead1'), 1::bigint);
select test.check('asking again reuses the same conversation',
  (select count(*) from (select public.message_program(:'svc_a') as c) x where c = (select v from t67 where k = 'first')), 1::bigint);
insert into public.messages (conversation_id, sender_id, body)
values ((select v from t67 where k = 'first'), :'member', 'Do you have a place in the welding class?');
select test.check('the member can write in it',
  (select count(*) from public.messages where conversation_id = (select v from t67 where k = 'first')), 1::bigint);
select test.check('a member who has written has a conversation (the Messages tab shows)',
  (select count(*) from public.conversation_partners() where profile_id = :'lead1'), 1::bigint);
select test.check_raises_like('a place gathered from a list has nobody to message',
  format($f$select public.message_program(%L)$f$, :'svc_gath'), '%NO_PROGRAM_LEAD%');
select test.check_raises_like('an organisation with no lead on Pam has nobody to message',
  format($f$select public.message_program(%L)$f$, :'svc_nol'), '%NO_PROGRAM_LEAD%');
select test.check_raises_like('an unknown place is refused',
  format($f$select public.message_program(%L)$f$, gen_random_uuid()), '%NO_PROGRAM_LEAD%');

select test.as_user(:'lead1');
select test.check('the lead sees the member''s first name and nothing else',
  (select count(*) from public.conversation_partners() where profile_id = :'member' and first_name = 'Mo'), 1::bigint);
insert into public.messages (conversation_id, sender_id, body)
values ((select v from t67 where k = 'first'), :'lead1', 'Yes, come Tuesday.');
select test.check('the lead can reply in a conversation the member started',
  (select count(*) from public.messages where conversation_id = (select v from t67 where k = 'first') and sender_id = :'lead1'), 1::bigint);
select test.check_raises('a lead cannot start a message to a member (leads are not members)',
  format($f$select public.message_program(%L)$f$, :'svc_a'));

select test.check('a member who has only written is NOT on the lead''s New message list',
  (select count(*) from public.messageable_people() where profile_id = :'member'), 0::bigint);
select test.check_raises_like('...and the lead cannot open a new conversation with them',
  format($f$select public.open_direct_conversation(%L)$f$, :'member'), '%only message%');
select test.check('...a message is not a link: the lead learns nothing of their activity',
  (select count(*) from public.people_activity() where profile_id = :'member'), 0::bigint);
select test.check('...but the conversation is in the lead''s list, to answer in',
  (select count(*) from public.conversation_members where conversation_id = (select v from t67 where k = 'first') and profile_id = :'lead1'), 1::bigint);

-- A lead cannot open a conversation cold.
select test.check_raises_like('a lead cannot open a conversation with a member who has no tie to them',
  format($f$select public.open_direct_conversation(%L)$f$, :'cold'), '%only message%');
select test.check_raises_like('...a cancelled visit is not a tie',
  format($f$select public.open_direct_conversation(%L)$f$, :'cancel'), '%only message%');
select test.check('...the person list offers neither',
  (select count(*) from public.messageable_people() where profile_id in (:'cold', :'cancel')), 0::bigint);
select test.check('a member with a booked (non-cancelled) visit can be opened to',
  (select count(*) from public.messageable_people() where profile_id = :'booked'), 1::bigint);
select test.check('...and the lead can open that conversation',
  (select count(*) from (select public.open_direct_conversation(:'booked') as c) x where c is not null), 1::bigint);

select test.as_user(:'lead2');
select test.check('a colleague does not get the member either',
  (select count(*) from public.messageable_people() where profile_id = :'member'), 0::bigint);

select test.as_user(:'cold');
select test.check_raises_like('a member cannot open a conversation with a lead through the general door',
  format($f$select public.open_direct_conversation(%L)$f$, :'lead2'), '%only message%');
select test.check('a member with no tie is offered nobody to message',
  (select count(*) from public.messageable_people()), 0::bigint);

select test.as_user(:'blk');
select test.check_raises_like('a member blocked by the lead (or who blocked the other) is refused where no lead is left',
  format($f$select public.message_program(%L)$f$, :'svc_a'), '%NO_PROGRAM_LEAD%');

reset role;
set role anon;
select test.check_raises('someone signed out cannot message a program',
  format($f$select public.message_program(%L)$f$, :'svc_a'));
reset role;
\echo ''
\echo 'message a program before booking: all checks passed'
