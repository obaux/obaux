-- 0010 — Close two function-exposure holes found by Supabase's security
-- advisors after the first deploy.
--
-- Supabase exposes every function in `public` over PostgREST at
-- /rest/v1/rpc/<name>. Several RLS helpers are SECURITY DEFINER and take
-- caller-supplied arguments, so they could be called directly with someone
-- else's id — running with owner privileges and answering questions the caller
-- has no right to ask:
--
--   member_points(<any member>)        -> that member's points balance
--   are_buddies(<a>, <b>)              -> probe the social graph
--   is_blocked_between(<a>, <b>)       -> probe who has blocked whom
--   feature_allowed(<any subject>, f)  -> probe another user's access controls
--
-- None of this is reachable through a table: the RLS policies are correct. It
-- leaked through the RPC surface, which the policies never touch.
--
-- The fix is a self-participation guard inside each function. Every policy that
-- calls these already passes auth.uid() as one of the arguments, so the guard
-- changes nothing about how RLS evaluates — it only makes a direct call with
-- someone else's id return nothing useful.
--
-- A more thorough hardening is to move every internal helper into a `private`
-- schema that PostgREST does not expose. That means recreating all 73 policies
-- to reference the new schema, so it is scheduled for Phase 1 rather than done
-- here on a live database. See DECISIONS.md D-025.

-- ---------------------------------------------------------------------------
-- Self-participation guards.
-- ---------------------------------------------------------------------------

-- Policies call this as are_buddies(auth.uid(), member_id), so the guard never
-- fires during RLS evaluation.
create or replace function public.are_buddies(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    -- Only a participant may ask about a pair.
    (auth.uid() = a or auth.uid() = b)
    and exists (
      select 1 from public.connections c
      where c.kind = 'buddy'
        and c.status = 'accepted'
        and ((c.requester_id = a and c.receiver_id = b)
          or (c.requester_id = b and c.receiver_id = a))
    );
$$;

-- Policies call this as is_blocked_between(auth.uid(), <other>).
--
-- Note the failure direction: this returns FALSE for a non-participant, and
-- callers use it as `not is_blocked_between(...)`. Returning false to a snooper
-- therefore reveals nothing and never widens access, because every policy that
-- consults it also requires a real relationship on another clause.
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    (auth.uid() = a or auth.uid() = b)
    and exists (
      select 1 from public.connections c
      where c.status = 'blocked'
        and ((c.requester_id = a and c.receiver_id = b)
          or (c.requester_id = b and c.receiver_id = a))
    );
$$;

-- Every policy calls this for the caller's own id. An admin checking a member's
-- access uses the admin screens, which read access_controls directly under the
-- policies on that table.
create or replace function public.feature_allowed(subject uuid, f public.controllable_feature)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select case
    when auth.uid() is distinct from subject and not public.admin_covers(subject)
      -- Absence of a row means allowed, so an unauthorised probe gets the same
      -- answer as the common case and learns nothing.
      then true
    else coalesce(
      (select allowed from public.access_controls
        where subject_id = subject and feature = f),
      true
    )
  end;
$$;

-- Not used by any policy — clients call it for the points display. Guarded so a
-- member cannot read another member's balance, and an admin can read only their
-- own caseload's.
create or replace function public.member_points(p_member_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, extensions
as $$
  select case
    when auth.uid() = p_member_id or public.admin_covers(p_member_id)
      then coalesce((
        select sum(delta) from public.points_ledger where member_id = p_member_id
      ), 0)::integer
    else null
  end;
$$;

comment on function public.member_points is
  'A member''s balance, or null when the caller may not see it. Balance is '
  'always the ledger sum — there is no stored total (SOP §8).';

-- ---------------------------------------------------------------------------
-- Pin search_path on the remaining functions.
--
-- These three are trigger functions rather than SECURITY DEFINER, so the risk
-- is lower, but a mutable search_path is still a way to get unexpected code
-- resolved. Advisor: 0011_function_search_path_mutable.
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.reject_mutation()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  raise exception '% is append-only; % is not permitted', tg_table_name, tg_op
    using hint = 'Insert a compensating row instead of changing history.';
end;
$$;

create or replace function public.enforce_subcategory_matches_category()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  sub_category public.service_category;
begin
  if new.subcategory is null then
    return new;
  end if;

  select category into sub_category
  from public.service_subcategories
  where key = new.subcategory;

  if sub_category is null then
    raise exception 'Unknown subcategory "%"', new.subcategory;
  end if;

  if sub_category <> new.category then
    raise exception 'Subcategory "%" belongs to category "%", not "%"',
      new.subcategory, sub_category, new.category;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Nothing signed-out should be able to invoke a write RPC. Each already fails
-- closed on its own checks; revoking is belt and braces, and it takes them off
-- the anon REST surface.
-- ---------------------------------------------------------------------------

revoke execute on function public.create_invite(public.user_role, text, uuid) from anon;
revoke execute on function public.admin_set_feature_access(uuid, public.controllable_feature, boolean, text, text) from anon;
revoke execute on function public.admin_set_access_status(uuid, public.access_status, text) from anon;
revoke execute on function public.redeem_invite(text, text, text) from anon;
revoke execute on function public.generate_invite_code() from anon, authenticated;
