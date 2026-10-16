-- A person's last name and city are read only by the Pam team (Lena's privacy guard, D-587; Mira, 16 October).
--
-- 0075 gave `anon` and `authenticated` select on every profile column but the phone, so the 0007 policies let a
-- regional case manager, an accepted buddy and anyone reading a public mentor's profile select `last_name` and
-- `home_city` too. No screen reads them. The person types them on About you; the super admin sees them on a staff
-- request, which reads `staff_requests`, not `profiles`.
--
-- Checked before taking the grant away (every reader of the two columns):
--   * the app selects neither from `profiles` anywhere, the person's own row included: About you starts empty and
--     never prefills them, and Profile, Home, the caseload and the invite flow never ask for them;
--   * every database function that reads them is `security definer` and runs as the owner, so the grant does not
--     reach it: `start_membership`, `redeem_invite`, `request_staff_access`, `review_staff_request`, `invites_log`;
--   * `updateMyDetails` writes them with the update grant of 0046 (`grant update (last_name, home_city)`), which
--     stays. An update needs select only on the columns its filter and its returning name, and it filters on `id`.
--
-- So no own-row function is needed. Only the service role and the definer functions read the two columns now.

revoke select (last_name, home_city) on public.profiles from anon, authenticated;

comment on column public.profiles.last_name is
  'Optional, typed on About you. Not selectable by anon or authenticated (20261016145411): only the service role '
  'and security definer functions read it. The person writes it with the update grant of 0046.';
comment on column public.profiles.home_city is
  'Typed or picked on About you. Not selectable by anon or authenticated (20261016145411): only the service role '
  'and security definer functions read it. The person writes it with the update grant of 0046.';
