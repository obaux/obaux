-- a program lead reads a small card for a linked member (test 66).
--
-- Claimed 2026-10-11 on `claude/places-programs-im-here` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set tanya  '33333333-0000-0000-0000-00000000000d'
\set lead1  'cccccccc-0000-0000-0000-000000006602'
\set lead2  'cccccccc-0000-0000-0000-000000006603'
\set mem_e  'cccccccc-0000-0000-0000-000000006604'
\set mem_w  'cccccccc-0000-0000-0000-000000006605'
\set mem_n  'cccccccc-0000-0000-0000-000000006606'
\set org1   'dddddddd-0000-0000-0000-000000006601'
\set org2   'dddddddd-0000-0000-0000-000000006602'
\set prog1  'eeeeeeee-0000-0000-0000-000000006601'
\set prog2  'eeeeeeee-0000-0000-0000-000000006602'
\set conv   'bbbbbbbb-0000-0000-0000-000000006601'

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

reset role;
select set_config('request.jwt.claim.sub', '', false);
insert into auth.users (id, phone) values
  (:'lead1', '12675558662'), (:'lead2', '12675558663'), (:'mem_e', '12675558664'), (:'mem_w', '12675558665'), (:'mem_n', '12675558666');
insert into public.orgs (id, name, type, region_id) values
  (:'org1', 'Card Org One', 'program', '11111111-0000-0000-0000-000000000001'),
  (:'org2', 'Card Org Two', 'program', '11111111-0000-0000-0000-000000000001');
insert into public.profiles (id, role, first_name, last_name, region_id, phone, access_status, org_id) values
  (:'lead1', 'provider', 'Lou', null, '11111111-0000-0000-0000-000000000001', '+12675558662', 'active', :'org1'),
  (:'lead2', 'provider', 'Lee', null, '11111111-0000-0000-0000-000000000001', '+12675558663', 'active', :'org2'),
  (:'mem_e', 'member', 'Erin', 'Enrolled', '11111111-0000-0000-0000-000000000001', '+12675558664', 'active', null),
  (:'mem_w', 'member', 'Wes', 'Wrote', '11111111-0000-0000-0000-000000000001', '+12675558665', 'active', null),
  (:'mem_n', 'member', 'Nina', 'Nolink', '11111111-0000-0000-0000-000000000001', '+12675558666', 'active', null);
insert into public.services (id, org_id, name, category, address, source, needs_review, is_active) values
  (:'prog1', :'org1', 'Card Program One', 'workforce', '1 Card St', 'manual', false, true),
  (:'prog2', :'org2', 'Card Program Two', 'workforce', '2 Card St', 'manual', false, true);
insert into public.enrollments (member_id, service_id) values (:'mem_e', :'prog1');
-- Tanya has a visit at program one and a cancelled one; Erin also has a visit at program TWO that program one must not see
insert into public.appointments (id, member_id, service_id, starts_at, status) values
  ('aaaaaaaa-0000-0000-0000-000000006601', :'tanya', :'prog1', now() + interval '2 days', 'scheduled'),
  ('aaaaaaaa-0000-0000-0000-000000006602', :'tanya', :'prog1', now() + interval '3 days', 'cancelled'),
  ('aaaaaaaa-0000-0000-0000-000000006603', :'mem_e', :'prog2', now() + interval '4 days', 'scheduled');
insert into public.conversations (id) values (:'conv');
insert into public.conversation_members (conversation_id, profile_id) values (:'conv', :'mem_w'), (:'conv', :'lead1');

\echo ''
\echo '--- A program lead reads a small card for a member linked to their program ---'
set role authenticated;
select set_config('request.jwt.claim.sub', :'lead1', false);
select test.check('a member with a visit: first name and the visit, and the cancelled one is not shown',
  (select jsonb_array_length(public.program_member_card(:'tanya')->'visits')), 1);
select test.check('...the first name is there',
  (select (public.program_member_card(:'tanya')->>'first_name') is not null)::int, 1);
select test.check('the card has exactly three keys: no last name, phone, photo, points or last active',
  (select count(*) from jsonb_object_keys(public.program_member_card(:'tanya'))), 3::bigint);
select test.check('...and a visit has no column that says how it was marked, or where',
  (select count(*) from jsonb_object_keys(public.program_member_card(:'tanya')->'visits'->0) k
   where k not in ('appointment_id', 'starts_at', 'ends_at', 'status', 'service_name', 'checked_in_at')), 0::bigint);
select test.check('an enrolled member with no visit: the card, with no visits',
  (select jsonb_array_length(public.program_member_card(:'mem_e')->'visits')), 0);
select test.check('...their visit at ANOTHER program is not shown',
  (select public.program_member_card(:'mem_e')->>'first_name' = 'Erin')::int, 1);
select test.check('a member who wrote to the program: the card',
  (select public.program_member_card(:'mem_w')->>'first_name' = 'Wes')::int, 1);
select test.check_raises_like('a member with no link is refused', $q$ select public.program_member_card('cccccccc-0000-0000-0000-000000006606') $q$, '%MEMBER_NOT_LINKED%');
select test.check_raises_like('a person who is not a member is refused', $q$ select public.program_member_card('cccccccc-0000-0000-0000-000000006603') $q$, '%MEMBER_NOT_LINKED%');
select set_config('request.jwt.claim.sub', :'lead2', false);
select test.check_raises_like('another program''s lead sees nothing of Tanya', $q$ select public.program_member_card('33333333-0000-0000-0000-00000000000d') $q$, '%MEMBER_NOT_LINKED%');
select test.check('...and nothing of the visits of Erin at program one (only their own program two)',
  (select jsonb_array_length(public.program_member_card(:'mem_e')->'visits')), 1);
select set_config('request.jwt.claim.sub', :'tanya', false);
select test.check_raises_like('a member cannot ask', $q$ select public.program_member_card('cccccccc-0000-0000-0000-000000006604') $q$, '%NOT_A_PROGRAM_LEAD%');
reset role;
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select test.check_raises_like('nobody signed out can ask', $q$ select public.program_member_card('cccccccc-0000-0000-0000-000000006604') $q$, '%permission denied%');
reset role;

\echo ''
\echo 'program member card: all checks passed'
