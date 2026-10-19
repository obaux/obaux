-- contract: this takes a select grant away (profiles.region_id from anon and authenticated), the way 20261016145411 did for last_name and
-- home_city; no column, table or function is dropped, and the one reader that needs the value (a person's own session) gets a function.
--
-- A person's city is read by their own session and the database, not by their partners (Lena's privacy guard; Mira, 19 October).
--
-- 0075 gave `anon` and `authenticated` select on every profile column but the phone, `region_id` among them, and the 0007 policies let a
-- conversation partner (0060), a connection, a discoverable mentor, a linked lead and a case manager read the row. For a member,
-- `region_id` is the city their account is for (`redeem_invite` copies it from the invite), so it is the same exposure 20261016145411
-- closed for `last_name` and `home_city`.
--
-- WHO READS IT, checked before taking the grant away:
--   * The app reads it in one place, `useSession`, for the person's OWN row (`region_id`, and the city's name through the `regions` embed).
--     An embed needs select on the join column too, so that read moves to `my_region_info()`, below.
--   * `caseload`, `cities waiting` and the staff-request screens take a region as an argument (`p_region_id`) from the person's own session;
--     they do not read anybody's `profiles.region_id` as the caller.
--   * Every database function that reads `profiles.region_id` is `security definer` and runs as the owner (`my_region()` among them, which
--     is what the 0007 policies call), so the revoke does not reach it. test 03 and the full suite are the check that no policy or invoker
--     function was missed.
--
-- `my_region_info()` answers the caller's own city (id and name), nothing about anyone else. Expand/revoke only: no drop.

revoke select (region_id) on public.profiles from anon, authenticated;

create or replace function public.my_region_info()
returns table (region_id uuid, name text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.region_id, r.name
  from public.profiles p
  left join public.regions r on r.id = p.region_id
  where p.id = auth.uid();
$$;
revoke all on function public.my_region_info() from public, anon;
grant execute on function public.my_region_info() to authenticated;

comment on column public.profiles.region_id is
  'The city this account is for. Not selectable by anon or authenticated (20261019025010): only the service role and security definer functions '
  'read it; a person reads their own through my_region_info().';
comment on function public.my_region_info() is
  'The signed-in person''s own city, id and name (20261019025010). The only way a client role reads profiles.region_id.';
