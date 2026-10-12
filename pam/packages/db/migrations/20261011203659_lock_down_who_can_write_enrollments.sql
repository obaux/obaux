-- Who can write enrollments (D-541). Tightening only: revoke and alter policy.
--
-- Before: `enrollments_own` was FOR ALL, and anon/authenticated held INSERT,
-- UPDATE and DELETE on the table. A member could therefore insert an enrollment
-- at any program's service and, because can_message() links a program lead and
-- a member through enrollments, unlock messaging with that program's leads.
-- `enrollments_update_provider` also had `with check (true)`, so a lead could
-- repoint a row (member_id, service_id) at somebody else's.
--
-- After: a member can only read their own enrollments. A program lead can change
-- only status, notes and updated_at, and only on a row of their own org's
-- service. Nothing in the app writes enrollments today (0 rows live); the
-- server (postgres / service_role) still can.

revoke insert, update, delete on public.enrollments from anon, authenticated;

-- A lead can change what the program tracks, not who or where.
grant update (status, notes, updated_at) on public.enrollments to authenticated;

-- `for all` cannot be narrowed to `for select` by ALTER POLICY, so it keeps its
-- name and loses every write: `using` still answers SELECT, `with check (false)`
-- refuses any insert or update this policy would otherwise allow.
alter policy enrollments_own on public.enrollments
  using (member_id = auth.uid())
  with check (false);

alter policy enrollments_update_provider on public.enrollments
  using (exists (
    select 1 from public.services s
    where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
  ))
  with check (exists (
    select 1 from public.services s
    where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
  ));
