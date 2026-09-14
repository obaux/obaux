-- 0046 — Signing up, and closing the hole that made it dangerous.
--
-- ## The hole
--
-- `profiles_insert_self` checks `id = auth.uid()` and nothing else, and
-- `profiles_update_self` does the same. `role` is an ordinary column on that
-- table. So any signed-in person could write:
--
--     update public.profiles set role = 'super_admin' where id = auth.uid();
--
-- and become the person who can see every account in PAM (0043), decide flagged
-- places (0033), and read every caseload. Signing in needs nothing but a phone
-- number. The same is true of `access_status`, so a suspended account could
-- un-suspend itself, and of `region_id`, which is how an admin's reach is
-- scoped.
--
-- Nothing exploited it — the only rows are seeded staff — and nothing in the
-- product wrote those columns from the browser. It was found while building the
-- sign-up screen, which is the first thing that would have had a client create
-- a profile.
--
-- ## The fix
--
-- Column-level privileges, not a policy. RLS decides which ROWS a caller may
-- touch; it cannot say "this row, but not that column". `revoke update (role)`
-- can, it is declarative, and it holds for every present and future code path
-- rather than for the queries somebody remembered to guard. `security definer`
-- functions run as the owner and are unaffected, which is exactly right: role
-- changes belong to `redeem_invite`, to the admin RPCs that write `audit_log`,
-- and to the sign-up function below.
--
-- Insert is revoked wholesale for the same reason: `role` is NOT NULL with no
-- default, so a client insert either names the column (refused) or omits it
-- (refused). A profile is now something only a reviewed path can create.

revoke insert on public.profiles from anon, authenticated;

-- Table-level UPDATE first, and this order is the whole trick. A table-wide
-- grant covers every column, and Postgres will not let a column-level REVOKE
-- carve a hole in it — the revoke succeeds, changes nothing, and the promotion
-- still works. (Found exactly that way: the first version of this migration
-- applied cleanly and a member still made themselves a super admin.) So the
-- table-wide grant goes, and what comes back is a named list.
revoke update on public.profiles from anon, authenticated;

-- What a person may still change about themselves, named explicitly so the next
-- column added to this table is not silently editable.
grant update (
  first_name, display_name, photo_url, preferred_language,
  home_zip, bio, tags, is_mentor, is_public,
  last_active_at, onboarded_at, transparency_ack_at
) on public.profiles to authenticated;

comment on column public.profiles.role is
  'Set by redeem_invite, by an admin RPC that writes audit_log, or by '
  'start_membership. Never writable by the account itself: UPDATE on this '
  'column is revoked from authenticated (0046).';

-- ---------------------------------------------------------------------------
-- What sign-up needs to store

alter table public.profiles
  add column if not exists last_name text,
  add column if not exists home_city text;

grant update (last_name, home_city) on public.profiles to authenticated;

comment on column public.profiles.home_city is
  'The city somebody typed at sign-up, in their own words. Kept even when PAM '
  'does not serve it: it is how we know where to open next.';

-- Somebody who signed up from a city PAM is not in yet. No profile is created
-- for them — there is nothing for them to use — so this table is the only
-- record that they came, and the only thing that can tell them when it opens.
create table if not exists public.waiting_cities (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  city          text not null,
  wants_updates boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.waiting_cities is
  'People who signed up from a city PAM does not serve yet. One row per person, '
  'their own only. `wants_updates` is an active choice made on the screen — '
  'nothing is sent to anybody who did not tick it (A2P 30925).';

alter table public.waiting_cities enable row level security;
alter table public.waiting_cities force row level security;

drop policy if exists waiting_cities_own on public.waiting_cities;
create policy waiting_cities_own on public.waiting_cities
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Somebody who says they run a program, or that they are a parole officer.
-- Deliberately NOT a profile: those roles can see other people, and a claim
-- typed into a form is not a credential. A human at PAM checks and invites.
create table if not exists public.staff_requests (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  wants_role   public.user_role not null,
  first_name   text,
  last_name    text,
  city         text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid references public.profiles (id) on delete set null
);

comment on table public.staff_requests is
  'Somebody claiming a staff role at sign-up. A claim, not a grant: these roles '
  'read other people''s information, so a human verifies and sends an invite. '
  'The requester can see their own row and nothing else.';

alter table public.staff_requests enable row level security;
alter table public.staff_requests force row level security;

drop policy if exists staff_requests_own on public.staff_requests;
create policy staff_requests_own on public.staff_requests
  for select using (user_id = auth.uid());

drop policy if exists staff_requests_super_admin on public.staff_requests;
create policy staff_requests_super_admin on public.staff_requests
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Signing up

/**
 * Create the caller's own member profile.
 *
 * The only path from "signed in" to "has a profile" that does not involve an
 * invite, and it can create exactly one kind of account: a member. The role is
 * a literal in this function, not an argument — there is no parameter to pass
 * 'admin' to, which is the property that makes this safe to expose.
 *
 * The region is resolved from the city the person typed. No match means PAM
 * does not serve them: no profile is created and the caller is told, so the
 * screen can offer to tell them when it opens.
 */
create or replace function public.start_membership(
  p_first_name text,
  p_last_name  text,
  p_city       text,
  p_language   text default 'en'
)
returns public.profiles
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller     uuid := auth.uid();
  v_region   uuid;
  v_profile  public.profiles;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;

  if exists (select 1 from public.profiles where id = caller) then
    raise exception 'This account already exists';
  end if;

  if coalesce(btrim(p_first_name), '') = '' then
    raise exception 'We need a first name';
  end if;

  -- Case- and space-insensitive, because somebody typing "philadelphia" on a
  -- phone keyboard means Philadelphia.
  select id into v_region
  from public.regions
  where lower(btrim(name)) = lower(btrim(coalesce(p_city, '')))
  limit 1;

  if v_region is null then
    raise exception 'PAM is not in that city yet' using errcode = 'P0002';
  end if;

  insert into public.profiles (
    id, role, first_name, last_name, home_city, region_id, preferred_language
  )
  values (
    caller, 'member', btrim(p_first_name), nullif(btrim(coalesce(p_last_name, '')), ''),
    btrim(p_city), v_region, coalesce(nullif(btrim(p_language), ''), 'en')
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

comment on function public.start_membership is
  'Creates the caller''s own profile as a member. The role is a literal, not a '
  'parameter: there is nothing to pass ''admin'' to. Raises P0002 when PAM does '
  'not serve the city, so the screen can offer the waiting list instead.';

revoke all on function public.start_membership(text, text, text, text) from public, anon;
grant execute on function public.start_membership(text, text, text, text) to authenticated;

/**
 * Record a claim to a staff role, and create nothing.
 *
 * Somebody who runs a program or carries a caseload can see other people. That
 * is a decision a human makes about a real organisation, not a radio button —
 * so this writes a request and the screen says somebody will call.
 */
create or replace function public.request_staff_access(
  p_wants_role text,
  p_first_name text,
  p_last_name  text,
  p_city       text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if p_wants_role not in ('provider', 'admin') then
    raise exception 'That is not a role somebody can ask for';
  end if;

  insert into public.staff_requests (user_id, wants_role, first_name, last_name, city)
  values (
    caller, p_wants_role::public.user_role,
    nullif(btrim(coalesce(p_first_name, '')), ''),
    nullif(btrim(coalesce(p_last_name, '')), ''),
    nullif(btrim(coalesce(p_city, '')), '')
  )
  on conflict (user_id) do update
    set wants_role = excluded.wants_role,
        first_name = excluded.first_name,
        last_name  = excluded.last_name,
        city       = excluded.city,
        created_at = now();
end;
$$;

comment on function public.request_staff_access is
  'Records a claim to a staff role. Creates no profile and grants nothing: '
  'these roles read other people, and a claim typed into a form is not a '
  'credential.';

revoke all on function public.request_staff_access(text, text, text, text) from public, anon;
grant execute on function public.request_staff_access(text, text, text, text) to authenticated;

/** Join the list for a city PAM does not serve yet. */
create or replace function public.join_waiting_city(p_city text, p_wants_updates boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if coalesce(btrim(p_city), '') = '' then
    raise exception 'We need a city';
  end if;

  insert into public.waiting_cities (user_id, city, wants_updates)
  values (caller, btrim(p_city), coalesce(p_wants_updates, false))
  on conflict (user_id) do update
    set city = excluded.city,
        wants_updates = excluded.wants_updates,
        created_at = now();
end;
$$;

revoke all on function public.join_waiting_city(text, boolean) from public, anon;
grant execute on function public.join_waiting_city(text, boolean) to authenticated;
