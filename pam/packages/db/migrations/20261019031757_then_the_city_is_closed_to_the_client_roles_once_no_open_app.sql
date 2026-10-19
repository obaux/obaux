-- contract: this takes a select grant away (profiles.region_id from anon and authenticated), the way 20261016145411 did for last_name and
-- home_city; no column, table or function is dropped.
--
-- A person's city is read by their own session and the database, not by their partners, STEP 2 of 2 (Lena's privacy guard; Mira, 19 October).
--
-- DO NOT APPLY THIS UNTIL the app that reads `my_region_info()` (20261019025010) has been live long enough for every open copy of the old one to
-- reload (the desk's wait: a day). The old app's own profile read selects `region_id` and embeds `regions(name)`; with this revoke that read is
-- denied, and an old copy shows the session error screen (not a signed-out one) until it is reloaded.
--
-- 0075 gave `anon` and `authenticated` select on every profile column but the phone, `region_id` among them, and the 0007 policies let a
-- conversation partner (0060), a connection, a discoverable mentor, a linked lead and a case manager read the row. For a member,
-- `region_id` is the city their account is for (`redeem_invite` copies it from the invite), so it is the same exposure 20261016145411
-- closed for `last_name` and `home_city`.
--
-- WHO READS IT, checked before taking the grant away:
--   * The app reads it in one place, `useSession`, for the person's OWN row, through `my_region_info()` (step 1) since the change that shipped
--     before this. An embed needs select on the join column too, so that read moved to the function.
--   * `caseload`, `cities waiting` and the staff-request screens take a region as an argument (`p_region_id`) from the person's own session;
--     they do not read anybody's `profiles.region_id` as the caller.
--   * Every database function that reads `profiles.region_id` is `security definer` and runs as the owner (`my_region()` among them, which is
--     what the 0007 policies call), so the revoke does not reach it. test 88 and the full suite are the check.

revoke select (region_id) on public.profiles from anon, authenticated;

comment on column public.profiles.region_id is
  'The city this account is for. Not selectable by anon or authenticated (20261019031757): only the service role and security definer functions '
  'read it; a person reads their own through my_region_info() (20261019025010).';
