-- Case managers no longer write `admin_assignments` straight from the client
-- (D-446). Contract step for the migration before this one.
--
-- contract: no release of the app ever wrote admin_assignments from the client — redeem_invite and the new assign_guide / hand_over_member write it as definer
--
-- 0007's `admin_assignments_admin` policy was `for all`, checked only that the
-- row named the caller as the admin, and nothing revoked the table grants.
-- So any case manager could, through PostgREST, insert a row assigning
-- themselves any member who had no guide (of any role — a program lead, a
-- super admin), with no audit_log row, or move one of their own rows to a
-- different member. Since 0082 that row is the whole of who reads a member's
-- profile, goals, points and badges and may limit or pause them. Found while
-- planning the assigning screen (D-446), not by a test: nothing attacked it.
--
-- After this a case manager can still read their own rows and a member can
-- still read who supports them (`admin_assignments_select_member`, the
-- transparency promise). Every write goes through a function that checks its
-- caller and writes audit_log. Functions run as the table owner, which
-- bypasses row-level security (checked on the live project, 10 October).

drop policy if exists admin_assignments_admin on public.admin_assignments;

create policy admin_assignments_select_admin on public.admin_assignments
  for select using (admin_id = auth.uid() and public.is_admin());

revoke insert, update, delete on public.admin_assignments from anon, authenticated;
