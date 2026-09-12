-- Deterministic fixture for the RLS suite. Fixed UUIDs so a failure names a
-- recognisable actor ("admin_north") rather than a random id.
--
-- The shape deliberately mirrors the risky real-world situation: two regions,
-- an admin in each, members on and off a caseload, two provider orgs, a private
-- member, a blocked pair, and a conversation an admin introduced but cannot read.

set local role postgres;

insert into public.regions (id, name) values
  ('11111111-0000-0000-0000-000000000001', 'North'),
  ('11111111-0000-0000-0000-000000000002', 'South');

insert into public.orgs (id, name, verified, region_id) values
  ('22222222-0000-0000-0000-000000000001', 'Riverside Learning Center', true,
   '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000002', 'Southside Works', true,
   '11111111-0000-0000-0000-000000000002');

insert into auth.users (id) values
  ('33333333-0000-0000-0000-00000000000a'), -- admin_north
  ('33333333-0000-0000-0000-00000000000b'), -- admin_south
  ('33333333-0000-0000-0000-00000000000c'), -- member_north (on caseload)
  ('33333333-0000-0000-0000-00000000000d'), -- member_north_2 (same region, no caseload)
  ('33333333-0000-0000-0000-00000000000e'), -- member_south
  ('33333333-0000-0000-0000-00000000000f'), -- provider_north
  ('33333333-0000-0000-0000-000000000010'), -- provider_south
  ('33333333-0000-0000-0000-000000000011'), -- mentor_public
  ('33333333-0000-0000-0000-000000000012'), -- member_private (is_public = false)
  ('33333333-0000-0000-0000-000000000013'); -- member_blocked

insert into public.profiles (id, role, first_name, region_id, org_id, is_mentor, is_public, access_status)
values
  ('33333333-0000-0000-0000-00000000000a', 'admin', 'Dana',
   '11111111-0000-0000-0000-000000000001', null, false, false, 'active'),
  ('33333333-0000-0000-0000-00000000000b', 'admin', 'Ray',
   '11111111-0000-0000-0000-000000000002', null, false, false, 'active'),
  ('33333333-0000-0000-0000-00000000000c', 'member', 'Marcus',
   '11111111-0000-0000-0000-000000000001', null, false, true, 'active'),
  ('33333333-0000-0000-0000-00000000000d', 'member', 'Tanya',
   '11111111-0000-0000-0000-000000000001', null, false, true, 'active'),
  ('33333333-0000-0000-0000-00000000000e', 'member', 'Luis',
   '11111111-0000-0000-0000-000000000002', null, false, true, 'active'),
  ('33333333-0000-0000-0000-00000000000f', 'provider', 'Alice',
   '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', true, true, 'active'),
  ('33333333-0000-0000-0000-000000000010', 'provider', 'Bob',
   '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', true, true, 'active'),
  ('33333333-0000-0000-0000-000000000011', 'member', 'Nia',
   '11111111-0000-0000-0000-000000000001', null, true, true, 'active'),
  ('33333333-0000-0000-0000-000000000012', 'member', 'Jo',
   '11111111-0000-0000-0000-000000000001', null, true, false, 'active'),
  ('33333333-0000-0000-0000-000000000013', 'member', 'Sam',
   '11111111-0000-0000-0000-000000000001', null, true, true, 'active');

-- Marcus is on Dana's caseload. Tanya is in Dana's region but unassigned.
insert into public.admin_assignments (admin_id, member_id) values
  ('33333333-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-00000000000c');

insert into public.services (id, org_id, name, category, subcategory, is_active, needs_review)
values
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
   'GED Classes', 'education', 'ged_high_school', true, false),
  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002',
   'Warehouse Job Training', 'workforce', 'job_training', true, false),
  -- Imported but not yet reviewed: must be invisible to members (§5.2 step 6).
  ('44444444-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001',
   'Unreviewed Import Row', 'family_services', 'food', true, true);

-- Marcus is enrolled with the northern org, which is what lets Alice see him.
insert into public.enrollments (id, member_id, service_id, status) values
  ('55555555-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c',
   '44444444-0000-0000-0000-000000000001', 'enrolled');

-- Marcus and Nia are accepted buddies; Marcus and Sam are blocked.
insert into public.connections (requester_id, receiver_id, kind, status, blocked_by) values
  ('33333333-0000-0000-0000-00000000000c', '33333333-0000-0000-0000-000000000011',
   'buddy', 'accepted', null),
  ('33333333-0000-0000-0000-00000000000c', '33333333-0000-0000-0000-000000000013',
   'mentor', 'blocked', '33333333-0000-0000-0000-00000000000c');

-- A conversation Dana introduced. Dana is NOT a member of it (§4.1 step 3).
insert into public.conversations (id, kind, introduced_by) values
  ('66666666-0000-0000-0000-000000000001', 'direct', '33333333-0000-0000-0000-00000000000a');

insert into public.conversation_members (conversation_id, profile_id) values
  ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c'),
  ('66666666-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000f');

insert into public.messages (id, conversation_id, sender_id, body) values
  ('77777777-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001',
   '33333333-0000-0000-0000-00000000000c', 'Hi, I would like help with GED classes.');

-- Buddy-visible and private activities for the feed tests.
insert into public.activities (id, member_id, type, points, visibility) values
  ('88888888-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c',
   'attended', 100, 'buddies'),
  ('88888888-0000-0000-0000-000000000002', '33333333-0000-0000-0000-00000000000c',
   'visited', 5, 'private');

insert into public.points_ledger (id, member_id, delta, reason) values
  ('99999999-0000-0000-0000-000000000001', '33333333-0000-0000-0000-00000000000c',
   100, 'attend_appointment_verified');
