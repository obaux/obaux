-- A member who has only written to a program is not linked to it (test 68; D-541, D-543).
--
-- Will, 11 October 2026: members must be able to message a program before booking, and members must be told what the
-- program sees even before they book. The merge desk decided the rule that keeps that small: messaging a program makes
-- a CONVERSATION, not a link. A member who has only written to a program:
--
--   * is NOT in the program's `messageable_people()` (its "New message" list),
--   * is NOT in its `people_activity()` (so a program never learns when they saved a place),
--   * is NOT in its `provider_linked_members()`, and has no visit in `my_program_visits()`,
--   * and the program reads, of them, their first name and what they wrote, in that conversation, and may reply there.
--
-- It reads nothing else: not their profile row, their saved places, their enrollments or their appointments.
-- What the Privacy page, the "A program can see:" card and the site tell a member is exactly this
-- (`program-sees-before-a-visit.test.ts`).
--
-- This file builds the conversation by hand, as the superuser, so it does not depend on HOW the app starts one; it
-- holds on whatever D-541 part 2 does, and fails if that work makes a first message into a link.
--
-- The files run in name order on one database; ids use the prefix 68686868 and only their own rows are counted.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set alice   '33333333-0000-0000-0000-00000000000f'
\set marcus  '33333333-0000-0000-0000-00000000000c'
\set ged     '44444444-0000-0000-0000-000000000001'
\set wanda   '68686868-0000-0000-0000-000000000001'
\set convo   '68686868-0000-0000-0000-0000000000c1'

-- ===========================================================================
\echo ''
\echo '--- Fixture: Wanda, not signed up with Alice''s program, writes to it and has saved a place ---'
-- ===========================================================================
reset role;
insert into auth.users (id) values (:'wanda') on conflict do nothing;
insert into public.profiles (id, role, first_name, region_id, is_mentor, is_public, access_status)
values (:'wanda', 'member', 'Wanda', '11111111-0000-0000-0000-000000000001', false, true, 'active')
on conflict do nothing;
insert into public.conversations (id, kind) values (:'convo', 'direct') on conflict do nothing;
insert into public.conversation_members (conversation_id, profile_id)
values (:'convo', :'wanda'), (:'convo', :'alice')
on conflict do nothing;
insert into public.messages (conversation_id, sender_id, body)
values (:'convo', :'wanda', 'Do you have a GED class?');
insert into public.saved_places (member_id, service_id, saved_at)
values (:'wanda', :'ged', now() - interval '1 hour')
on conflict do nothing;
-- The control: Marcus IS signed up with Alice's program (01_seed.sql), so the checks below are not vacuous.
insert into public.saved_places (member_id, service_id, saved_at)
values (:'marcus', :'ged', now() - interval '30 minutes')
on conflict do nothing;

select test.check('Wanda has no enrollment and no appointment with any program',
  (select (select count(*) from public.enrollments where member_id = :'wanda')
        + (select count(*) from public.appointments where member_id = :'wanda')), 0);

-- ===========================================================================
\echo ''
\echo '--- The program reads her first name and what she wrote, in that conversation, and can reply ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'alice');
select test.check('the program sees her as a partner of a conversation, by first name',
  (select count(*) from public.conversation_partners()
   where profile_id = :'wanda' and first_name = 'Wanda' and conversation_id = :'convo'), 1);
select test.check('...and reads what she wrote',
  (select count(*) from public.messages where conversation_id = :'convo' and sender_id = :'wanda'), 1);
insert into public.messages (conversation_id, sender_id, body) values (:'convo', :'alice', 'Yes: Tuesday and Thursday.');
select test.check('...and can reply in it',
  (select count(*) from public.messages where conversation_id = :'convo' and sender_id = :'alice'), 1);

reset role;
select test.check('a partner row carries a first name, a role and a program name, and no phone, last name or region',
  (select count(*) from pg_proc p, unnest(p.proargnames, p.proargmodes) as a(n, m)
   where p.proname = 'conversation_partners' and p.pronamespace = 'public'::regnamespace and m = 't'
     and n not in ('conversation_id', 'profile_id', 'first_name', 'role', 'program_name')), 0);

-- ===========================================================================
\echo ''
\echo '--- She is not on the program''s lists: a conversation is not a link ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'alice');
select test.check('control: Marcus, signed up with the program, is in its linked members',
  (select count(*) from public.provider_linked_members() where id = :'marcus'), 1);
select test.check('control: ...and in its New message list',
  (select count(*) from public.messageable_people() where profile_id = :'marcus'), 1);
select test.check('control: ...and the program learns when he saved a place',
  (select count(*) from public.people_activity() where profile_id = :'marcus'), 1);

select test.check('she is not in the program''s linked members',
  (select count(*) from public.provider_linked_members() where id = :'wanda'), 0);
select test.check('she is not in its New message list: the program cannot start a chat with her',
  (select count(*) from public.messageable_people() where profile_id = :'wanda'), 0);
select test.check('the program does not learn that she saved a place, or when',
  (select count(*) from public.people_activity() where profile_id = :'wanda'), 0);

-- my_program_visits() arrives with D-526 part A; call it only where it exists, so this file holds before and after.
reset role;
do $$
begin
  if to_regprocedure('public.my_program_visits()') is not null then
    set local role authenticated;
    perform test.as_user('33333333-0000-0000-0000-00000000000f');
    perform set_config('test.wanda_visits',
      (select count(*)::text from public.my_program_visits() as v where v.member_id = '68686868-0000-0000-0000-000000000001'),
      false);
    reset role;
  else
    perform set_config('test.wanda_visits', '0', false);
  end if;
end;
$$;
select test.check('she has no visit in the program''s list of visits', current_setting('test.wanda_visits')::bigint, 0);

-- ===========================================================================
\echo ''
\echo '--- Nothing else of hers is readable by the program ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'alice');
select test.check('the program cannot read her profile row (phone, region, language...)',
  (select count(*) from public.profiles where id = :'wanda'), 0);
select test.check('...her saved places', (select count(*) from public.saved_places where member_id = :'wanda'), 0);
select test.check('...her enrollments', (select count(*) from public.enrollments where member_id = :'wanda'), 0);
select test.check('...her appointments', (select count(*) from public.appointments where member_id = :'wanda'), 0);
select test.check('...her points', (select count(*) from public.points_ledger where member_id = :'wanda'), 0);

-- ===========================================================================
\echo ''
\echo '--- And nobody else gains a view of her either ---'
-- ===========================================================================
select test.as_user('33333333-0000-0000-0000-00000000000a');  -- Dana, a case manager in her region, not assigned to her
select test.check('a case manager who is not her guide does not see her messages to the program',
  (select count(*) from public.messages where conversation_id = :'convo'), 0);
select test.check('...nor her in their people list', (select count(*) from public.people_activity() where profile_id = :'wanda'), 0);

reset role;
