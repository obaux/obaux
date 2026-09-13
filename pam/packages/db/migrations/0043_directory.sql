-- 0043 — The people directory, for super admins only.
--
-- Until now a super admin could see nothing at all. `admin_covers()` — the one
-- policy arm that lets anybody read somebody else's profile as staff — requires
-- `is_admin()`, which is role = 'admin' exactly. A super admin opening the case
-- manager screen was told it was not for them, which was true: PAM had no
-- screen for the person operating it.
--
-- This is that surface, and it is deliberately a function rather than a policy.
--
--   * A policy widening `profiles` for super admins would widen every query in
--     the product at once — every join, every existing feature, forever. This
--     widens exactly one call, with a fixed column list.
--   * The column list is the point. Name, role, region, status and last-active:
--     the same five facts the case manager caseload already shows, and nothing
--     else. Phone and email are absent, which matters because `phone` is the
--     one column on this table that reaches a person directly.
--   * The guard is INSIDE the function, not on the grant. PostgREST exposes
--     every function in `public`; a caller-supplied id or an ungated body is how
--     this project has been bitten before. `is_super_admin()` is checked in the
--     WHERE clause, so anybody else gets zero rows rather than an error — there
--     is nothing to probe.
--
-- What it does NOT do, on purpose: it reads no goals, no enrollments, no
-- appointments, no messages and no chat metadata. The transparency screen tells
-- a member what the person who invited them can see, and none of that is
-- widened here. A directory is a list of accounts, not a view into anybody.

create or replace function public.directory_people(p_role text default null)
returns table (
  id uuid,
  first_name text,
  role public.user_role,
  region_name text,
  access_status public.access_status,
  last_active_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    p.id,
    p.first_name,
    p.role,
    r.name,
    p.access_status,
    p.last_active_at
  from public.profiles p
  left join public.regions r on r.id = p.region_id
  where public.is_super_admin()
    and (p_role is null or p.role::text = p_role)
  order by p.last_active_at desc nulls last, p.first_name asc, p.id asc;
$$;

comment on function public.directory_people is
  'Every account, for a super admin only, filtered by role. Five columns: name, '
  'role, region, status, last active. Never phone, never anything a member said '
  'or did. Anybody who is not a super admin gets zero rows — the guard is in the '
  'WHERE clause because PostgREST exposes this function to every signed-in '
  'caller (see 0007 and the RPC-surface note in CLAUDE.md).';

-- `anon` is revoked by name as well as through `public`. The Supabase advisor
-- reports a new SECURITY DEFINER function as anon-callable whenever the schema
-- grant reaches it, and while this one answers a signed-out caller with zero
-- rows anyway, a signed-out caller has no business reaching it at all.
revoke all on function public.directory_people(text) from public;
revoke all on function public.directory_people(text) from anon;
grant execute on function public.directory_people(text) to authenticated;
