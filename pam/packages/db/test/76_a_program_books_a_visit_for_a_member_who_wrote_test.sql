-- A program books a visit for a member who wrote to it, signed up there or planned a visit there (test 76; D-595, a94).
--
-- Will, 17 October: a program may book a visit for a member; it shows on the member's Trips, the bell tells them, the member can
-- cancel it, a case manager sees it was booked by the program. This file attacks each rule of `book_visit_for_member`:
-- who may call it, for whom, where, when, how often; what it writes and does not (no points, no text); who reads that a
-- program booked it (the member, a case manager who covers them) and who still reads nothing (the program, anyone else).
--
-- The files run in name order on one database; ids use the prefix 76767676 and only their own rows are counted.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\set dana    '33333333-0000-0000-0000-00000000000a'
\set ray     '33333333-0000-0000-0000-00000000000b'
\set marcus  '33333333-0000-0000-0000-00000000000c'
\set tanya   '33333333-0000-0000-0000-00000000000d'
\set luis    '33333333-0000-0000-0000-00000000000e'
\set alice   '33333333-0000-0000-0000-00000000000f'
\set bob     '33333333-0000-0000-0000-000000000010'
\set ged     '76767676-0000-0000-0000-000000000050'
\set bobsvc  '76767676-0000-0000-0000-000000000051'
\set org1    '22222222-0000-0000-0000-000000000001'
\set wanda   '76767676-0000-0000-0000-000000000001'
\set wilma   '76767676-0000-0000-0000-000000000002'
\set willa   '76767676-0000-0000-0000-000000000003'

-- ===========================================================================
\echo ''
\echo '--- Fixture: Wanda signed up with Alice''s program, Wilma planned a visit there, Willa only said she was interested; none has written to it ---'
-- ===========================================================================
reset role;
-- Their own places: earlier files remove and unreview the seed's. One of Alice's organisation, one of Bob's.
insert into public.services (id, org_id, name, category, address, is_active, needs_review) values
  (:'ged', :'org1', 'Visit Booking Class', 'education', '1 Test St', true, false),
  (:'bobsvc', '22222222-0000-0000-0000-000000000002', 'Visit Booking Warehouse', 'workforce', '2 Test St', true, false)
on conflict do nothing;
insert into auth.users (id) values (:'wanda'), (:'wilma'), (:'willa') on conflict do nothing;
insert into public.profiles (id, role, first_name, region_id, is_mentor, is_public, access_status)
values (:'wanda', 'member', 'Wanda', '11111111-0000-0000-0000-000000000001', false, true, 'active'),
       (:'wilma', 'member', 'Wilma', '11111111-0000-0000-0000-000000000001', false, true, 'active'),
       (:'willa', 'member', 'Willa', '11111111-0000-0000-0000-000000000001', false, true, 'active')
on conflict do nothing;
insert into public.enrollments (member_id, service_id, status) values (:'wanda', :'ged', 'enrolled'), (:'willa', :'ged', 'interested') on conflict do nothing;
insert into public.appointments (member_id, service_id, starts_at, status)
values (:'wilma', :'ged', now() + interval '20 days', 'scheduled');

select test.check('Marcus has a conversation with Alice (he wrote to the program); Tanya, Wanda and Wilma have none',
  (select count(*) from public.conversation_members c
   where c.profile_id in (:'marcus', :'tanya', :'wanda', :'wilma')
     and exists (select 1 from public.conversation_members o where o.conversation_id = c.conversation_id and o.profile_id = :'alice')), 1);

-- A day that is certainly ahead, at fixed hours, so two bookings can be an hour apart or not.
create temp table t76 as select date_trunc('day', now()) + interval '3 days' as d;
grant select on t76 to authenticated;

-- ===========================================================================
\echo ''
\echo '--- Who may call it ---'
-- ===========================================================================
set role anon;
select test.check_raises('nobody signed in can book',
  format($f$select public.book_visit_for_member(%L, %L, now() + interval '3 days')$f$, :'marcus', :'ged'));
set role authenticated;
select test.as_user(:'marcus');
select test.check_raises_like('a member cannot book for anybody',
  format($f$select public.book_visit_for_member(%L, %L, now() + interval '3 days')$f$, :'marcus', :'ged'), '%NOT_A_PROGRAM_LEAD%');
select test.as_user(:'dana');
select test.check_raises_like('a case manager cannot book',
  format($f$select public.book_visit_for_member(%L, %L, now() + interval '3 days')$f$, :'marcus', :'ged'), '%NOT_A_PROGRAM_LEAD%');

-- ===========================================================================
\echo ''
\echo '--- For whom: a member who has written to this program, signed up with it or planned a visit there ---'
-- ===========================================================================
select test.as_user(:'alice');
select test.check_raises_like('not for a member who has done none of those (Tanya)',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '9 hours' from t76))$f$, :'tanya', :'ged'), '%MEMBER_NOT_LINKED%');
select test.check_raises_like('...nor one who only said she was interested (Willa)',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '9 hours' from t76))$f$, :'willa', :'ged'), '%MEMBER_NOT_LINKED%');
select test.check('...but one who signed up (Wanda) can be booked for',
  (select count(*) from (select public.book_visit_for_member(:'wanda', :'ged', (select d + interval '60 days 9 hours' from t76))) x), 1);
select test.check('...and one who planned a visit there (Wilma)',
  (select count(*) from (select public.book_visit_for_member(:'wilma', :'ged', (select d + interval '61 days 9 hours' from t76))) x), 1);
select test.check_raises_like('...not for somebody who is not a member (a lead, Bob)',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '9 hours' from t76))$f$, :'bob', :'ged'), '%MEMBER_NOT_LINKED%');
select test.check_raises_like('...and the answer is the same for a person who does not exist',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '9 hours' from t76))$f$, '76767676-0000-0000-0000-0000000000ff', :'ged'), '%MEMBER_NOT_LINKED%');

-- ===========================================================================
\echo ''
\echo '--- Where: only this program''s own live places ---'
-- ===========================================================================
select test.check_raises_like('not at another program''s place',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '9 hours' from t76))$f$, :'marcus', :'bobsvc'), '%PLACE_NOT_FOUND%');
select test.as_user(:'bob');
select test.check_raises_like('the other program''s lead cannot book at Alice''s place either',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '9 hours' from t76))$f$, :'marcus', :'ged'), '%PLACE_NOT_FOUND%');
select test.check_raises_like('...nor for Marcus at her own place: he has not written to her',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '9 hours' from t76))$f$, :'marcus', :'bobsvc'), '%MEMBER_NOT_LINKED%');

-- ===========================================================================
\echo ''
\echo '--- When ---'
-- ===========================================================================
select test.as_user(:'alice');
select test.check_raises_like('not in the past',
  format($f$select public.book_visit_for_member(%L, %L, now() - interval '1 hour')$f$, :'marcus', :'ged'), '%TRIP_IN_THE_PAST%');
select test.check_raises_like('...nor a year away',
  format($f$select public.book_visit_for_member(%L, %L, now() + interval '200 days')$f$, :'marcus', :'ged'), '%TRIP_TOO_FAR%');

-- ===========================================================================
\echo ''
\echo '--- The booking, and what it writes ---'
-- ===========================================================================
reset role;
select test.check('before: Marcus has no points for planning trips today', (select count(*) from public.points_ledger where member_id = :'marcus' and reason = 'plan_trip'), 0);
select test.check('...and no bell notice of this kind', (select count(*) from public.notifications where recipient_id = :'marcus' and kind = 'visit_booked_for_you'), 0);
set role authenticated;
select test.as_user(:'alice');
select test.check('Alice books Marcus at 9', (select count(*) from (select public.book_visit_for_member(:'marcus', :'ged', (select d + interval '9 hours' from t76))) x), 1);
reset role;
select test.check('the visit is there: Marcus, at her place, scheduled, booked by her organisation',
  (select count(*) from public.appointments
   where member_id = :'marcus' and service_id = :'ged' and status = 'scheduled' and booked_by_org = :'org1'
     and starts_at = (select d + interval '9 hours' from t76)), 1);
select test.check('no points are paid for planning it', (select count(*) from public.points_ledger where member_id = :'marcus' and reason = 'plan_trip'), 0);
select test.check('Marcus has one bell notice, with the place and the time as variables and nothing typed',
  (select count(*) from public.notifications
   where recipient_id = :'marcus' and kind = 'visit_booked_for_you' and body_key = 'notify.visit_booked_for_you'
     and body_vars ? 'place' and body_vars ? 'startsAt' and (select count(*) from jsonb_object_keys(body_vars)) = 3), 1);
select test.check('...and no text is queued for it',
  (select count(*) from public.outbound_messages where member_id = :'marcus' and created_at > now() - interval '1 minute'), 0);
select test.check('the audit log says which lead did it: one row each for Marcus, Wanda and Wilma',
  (select count(*) from public.audit_log where actor_id = :'alice' and action = 'visit.booked_for_member'), 3);

set role authenticated;
select test.as_user(:'alice');
select test.check_raises_like('the same visit again is refused',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '9 hours 30 minutes' from t76))$f$, :'marcus', :'ged'), '%ALREADY_BOOKED%');
select test.check('...and at 12', (select count(*) from (select public.book_visit_for_member(:'marcus', :'ged', (select d + interval '12 hours' from t76))) x), 1);
select test.check('...and at 15', (select count(*) from (select public.book_visit_for_member(:'marcus', :'ged', (select d + interval '15 hours' from t76))) x), 1);
select test.check_raises_like('a fourth booking for the same member in a day is refused',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '18 hours' from t76))$f$, :'marcus', :'ged'), '%RATE_LIMIT%');

-- ===========================================================================
\echo ''
\echo '--- The program as a whole: thirty a day ---'
-- ===========================================================================
reset role;
insert into public.appointments (member_id, service_id, starts_at, status, booked_by_org)
select :'luis', :'ged', (select d from t76) + interval '40 days' + (g * interval '2 hours'), 'scheduled', :'org1'
from generate_series(1, 30) g;
set role authenticated;
select test.as_user(:'alice');
select test.check_raises_like('after thirty in a day the program is refused, whoever it is for',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '21 hours' from t76))$f$, :'marcus', :'ged'), '%RATE_LIMIT%');
reset role;
delete from public.appointments where member_id = :'luis' and booked_by_org = :'org1';

-- ===========================================================================
\echo ''
\echo '--- A block ends it, either way round ---'
-- ===========================================================================
insert into public.blocks (blocker_id, blocked_id) values (:'tanya', :'alice') on conflict do nothing;
insert into public.conversations (id, kind) values ('76767676-0000-0000-0000-0000000000c1', 'direct') on conflict do nothing;
insert into public.conversation_members (conversation_id, profile_id)
values ('76767676-0000-0000-0000-0000000000c1', :'tanya'), ('76767676-0000-0000-0000-0000000000c1', :'alice') on conflict do nothing;
set role authenticated;
select test.as_user(:'alice');
select test.check_raises_like('a member who blocked the lead cannot be booked for, though they have written',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '10 hours' from t76))$f$, :'tanya', :'ged'), '%MEMBER_NOT_LINKED%');
reset role;
delete from public.blocks where blocker_id = :'tanya' and blocked_id = :'alice';
insert into public.blocks (blocker_id, blocked_id) values (:'alice', :'tanya') on conflict do nothing;
set role authenticated;
select test.as_user(:'alice');
select test.check_raises_like('...nor one the lead blocked',
  format($f$select public.book_visit_for_member(%L, %L, (select d + interval '10 hours' from t76))$f$, :'tanya', :'ged'), '%MEMBER_NOT_LINKED%');
reset role;
delete from public.blocks where blocker_id = :'alice' and blocked_id = :'tanya';

-- ===========================================================================
\echo ''
\echo '--- Who reads that a program booked it ---'
-- ===========================================================================
set role authenticated;
select test.as_user(:'marcus');
select test.check('the member reads which of their visits a program booked: the three',
  (select count(*) from public.my_trip_booked_by()), 3);
select test.check('...and my_trips lists them as any visit',
  (select count(*) from public.my_trips() t where t.id in (select appointment_id from public.my_trip_booked_by())), 3);
select test.as_user(:'tanya');
select test.check('another member reads none', (select count(*) from public.my_trip_booked_by()), 0);
select test.as_user(:'dana');
select test.check('a case manager who covers Marcus reads that the program booked them',
  (select count(*) from public.appointments where member_id = :'marcus' and booked_by_org is not null), 3);
select test.as_user(:'ray');
select test.check('...one who does not cover him reads nothing of them', (select count(*) from public.appointments where member_id = :'marcus'), 0);
select test.as_user(:'alice');
select test.check('the program reads no appointment row (test 65 still holds)', (select count(*) from public.appointments), 0);
select test.check('...but its own visits through its door, first name only, with Marcus''s three',
  (select count(*) from public.my_program_visits() where member_id = :'marcus'
     and starts_at in (select d + interval '9 hours' from t76 union all select d + interval '12 hours' from t76 union all select d + interval '15 hours' from t76)), 3);
select test.check_raises('...and it still cannot write a visit directly (test 69 still holds)',
  format($s$insert into public.appointments (member_id, service_id, starts_at) values (%L, %L, now() + interval '8 days')$s$, :'marcus', :'ged'));

-- ===========================================================================
\echo ''
\echo '--- The member can cancel it like any visit ---'
-- ===========================================================================
select test.as_user(:'marcus');
select test.check('Marcus cancels the 9 o''clock one',
  (select count(*) from public.cancel_trip((select id from public.appointments where member_id = :'marcus' and starts_at = (select d + interval '9 hours' from t76))) where status = 'cancelled'), 1);
select test.check('...and it is no longer in his trips',
  (select count(*) from public.my_trips() where starts_at = (select d + interval '9 hours' from t76)), 0);
reset role;


-- ===========================================================================
\echo ''
\echo '--- The list Book a visit shows: the same three kinds, each once, first name only ---'
-- ===========================================================================
select test.as_user(:'alice');
select test.check('Alice is offered Marcus (wrote), Wanda (signed up) and Wilma (planned a visit), and not Willa',
  (select count(*) from public.my_program_bookable_members() where member_id in (:'marcus', :'wanda', :'wilma', :'willa')), 3);
select test.check('...Willa, who only said she was interested, is not offered',
  (select count(*) from public.my_program_bookable_members() where member_id = :'willa'), 0);
select test.check('...nobody twice',
  (select count(*) - count(distinct member_id) from public.my_program_bookable_members()), 0);
select test.check('...with a first name and nothing else',
  (select count(*) from pg_proc where proname = 'my_program_bookable_members' and pg_get_function_result(oid) = 'TABLE(member_id uuid, first_name text)'), 1);
select test.as_user(:'bob');
select test.check('the other program''s lead is offered none of them',
  (select count(*) from public.my_program_bookable_members() where member_id in (:'marcus', :'wanda', :'wilma')), 0);
select test.as_user(:'marcus');
select test.check('a member is offered nobody',
  (select count(*) from public.my_program_bookable_members()), 0);
