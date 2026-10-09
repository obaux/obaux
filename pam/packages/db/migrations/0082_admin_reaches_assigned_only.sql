-- 0082 — A case manager reaches the people assigned to them, and no one else.
--
-- `admin_covers()` used to reach a member two ways: an active row in
-- `admin_assignments` (the caseload), or any member whose `region_id` is the
-- caller's own (the city). The second arm meant every case manager in a city
-- could read the profile, goals, enrollments, appointments, connections,
-- points and badges of every member in it — and could limit or pause them —
-- without being the person who invited them or anyone the member had been
-- told about. The transparency screen said "the person who invited you".
--
-- Will (9 October 2026, D-415): "only people assigned to that case manager,
-- and it would also narrow who can read points and badges." So the city arm
-- goes. This one function is the whole change: every policy and RPC that
-- asks `admin_covers()` — profiles (read and update), enrollments,
-- appointments, goals, connections, points, badges, facilitations, access
-- switches, `admin_set_access_status`, `admin_set_feature_access`,
-- `directory_people`'s neighbours, `member_points` — now answers for the
-- caseload alone. `can_message()` and `report_visible_to_me()` already read
-- `admin_assignments` directly and do not move.
--
-- What this makes true that was not: a member who signed up alone, or was
-- invited by a program lead or a super admin, has no case manager and is
-- read by no case manager at all until someone is assigned. There is no
-- screen for assigning yet (STATUS backlog; D-415).
--
-- Same signature, security definer, search_path as 0007, so the grants made by
-- 0011/0012 are untouched.

create or replace function public.admin_covers(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    public.is_admin()
    and exists (
      select 1 from public.admin_assignments a
      where a.admin_id = auth.uid() and a.member_id = target and a.ended_at is null
    );
$$;

comment on function public.admin_covers is
  'True when the caller is a case manager with `target` on their caseload '
  '(an active admin_assignments row). Not the city: until 0082 any member in '
  'the caller''s region also counted; Will removed that on 9 October (D-415).';
