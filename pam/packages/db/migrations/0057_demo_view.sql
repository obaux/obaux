-- 0057 — A demo view a super admin can grant, for showing PAM off.
--
-- Will, 17 September: a way to show PAM to somebody without showing them a
-- real person's real data — flipped per account, from the Everyone list, by
-- a super admin, and once on it should show the example data everywhere in
-- the app, not only on the screen that already had one (the existing
-- `USE_DUMMY_PEOPLE` empty-state fallback in `packages/config`, which shows
-- example rows only when a screen's real query comes back genuinely empty).
--
-- This migration adds the flag and the RPC to set it. It does not touch
-- `USE_DUMMY_PEOPLE`'s own screens — that is `useDemoView()` on the client
-- side, wired in screen by screen; see the session log for which ones are
-- done and which are still the real-data-or-genuinely-empty check alone.

alter table public.profiles
  add column if not exists is_demo boolean not null default false;

comment on column public.profiles.is_demo is
  'Set only by set_demo_view, a super admin action (0057). When true, every '
  'screen that has an example/dummy data set shows it regardless of whether '
  'this account''s real data is empty — for showing PAM off without showing '
  'anybody''s real information.';

-- Exposed on directory_people (0043) so the Everyone list can show and
-- toggle it per row — the same surface that already lists everyone's role,
-- region and status, nothing more sensitive than what is already there.
-- Dropped first: adding a column changes the OUT-parameter row type, which
-- `create or replace` cannot do on its own.
drop function if exists public.directory_people(text);

create function public.directory_people(p_role text default null)
returns table (
  id uuid,
  first_name text,
  role public.user_role,
  region_name text,
  access_status public.access_status,
  last_active_at timestamptz,
  is_demo boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.id, p.first_name, p.role, r.name, p.access_status, p.last_active_at, p.is_demo
  from public.profiles p
  left join public.regions r on r.id = p.region_id
  where public.is_super_admin()
    and (p_role is null or p.role::text = p_role)
  order by p.role, p.first_name nulls last;
$$;

comment on function public.directory_people is
  'Every account, for the person operating PAM. Returns zero rows to anybody '
  'who is not a super admin (0043) — the check is inside the function, RLS '
  'does not cover the RPC surface. Carries is_demo (0057) alongside the five '
  'facts it has always shown; still no phone, no goals, no messages.';

revoke all on function public.directory_people(text) from public, anon;
grant execute on function public.directory_people(text) to authenticated;

/** Grants or revokes the demo view on one account. Super admin only. */
create or replace function public.set_demo_view(p_user_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can set this';
  end if;

  update public.profiles set is_demo = p_enabled where id = p_user_id;
  if not found then
    raise exception 'No such account';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (auth.uid(), 'profile.set_demo_view', 'profile', p_user_id,
          jsonb_build_object('enabled', p_enabled));
end;
$$;

comment on function public.set_demo_view is
  'Grants or revokes the demo view on one account (0057). Super admin only, '
  'checked inside the function body, written to audit_log like every other '
  'admin action that changes what an account can do.';

revoke all on function public.set_demo_view(uuid, boolean) from public, anon;
grant execute on function public.set_demo_view(uuid, boolean) to authenticated;

-- A member reads their own is_demo the same way they already read their own
-- role and access_status: a column on the row RLS already scopes to them.
-- Nothing new to grant — profiles_select_own (0002) already covers it, and
-- is_demo was added with a default rather than a NOT NULL-with-no-default,
-- so no backfill is needed either.
