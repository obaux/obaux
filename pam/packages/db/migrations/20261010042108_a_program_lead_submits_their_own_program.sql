-- A program lead submits their own program (D-447; before-launch, Programs).
--
-- "Add a program" has only shown "sent" until now, on the belief that
-- `services_write_provider` (0007) already let a lead write a listing. It
-- does not help a self-signed-up lead: that policy needs `org_id =
-- my_org()`, and nothing gave such a lead an org, so their `org_id` is null.
-- This adds the way in, and closes a hole the review gate had.
--
-- EXPAND ONLY. Adds one function and one trigger. The live app never writes
-- `services` from a client, so nothing it does changes.

-- ---------------------------------------------------------------------------
-- 1. submit_program: a lead's program, as a listing members cannot see yet.
--
-- Creates the lead's organisation the first time (a program is an org of
-- one until a second lead is invited to it), points the profile at it, and
-- writes the listing with `needs_review = true`. The listing is what a super
-- admin approves; the public read policy shows only `not needs_review`.
-- One open submission at a time: a lead with a program waiting for review
-- cannot send a second (switching between programs is a later step, D-318).
create or replace function public.submit_program(
  p_name        text,
  p_category    text,
  p_subcategory text default null,
  p_description text default null,
  p_address     text default null,
  p_phone       text default null,
  p_website     text default null
)
returns public.services
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller  uuid := auth.uid();
  me      public.profiles;
  org     uuid;
  listing public.services;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;

  select * into me from public.profiles where id = caller;
  if me.id is null or public.my_role() is distinct from 'provider' then
    raise exception 'NOT_A_PROGRAM_LEAD';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;
  if not public.feature_allowed(caller, 'provider_listing') then
    raise exception 'LISTING_NOT_ALLOWED';
  end if;
  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'NAME_REQUIRED';
  end if;

  org := me.org_id;
  if org is null then
    insert into public.orgs (name, type, address, phone, website, region_id)
    values (
      btrim(p_name), 'program',
      nullif(btrim(coalesce(p_address, '')), ''),
      nullif(btrim(coalesce(p_phone, '')), ''),
      nullif(btrim(coalesce(p_website, '')), ''),
      me.region_id
    )
    returning id into org;

    update public.profiles set org_id = org where id = caller;
  elsif exists (
    select 1 from public.services s where s.org_id = org and s.needs_review
  ) then
    raise exception 'PROGRAM_ALREADY_IN_REVIEW';
  end if;

  insert into public.services (
    org_id, name, category, subcategory, description_plain,
    address, phone, website, source, needs_review, is_active
  )
  values (
    org,
    btrim(p_name),
    p_category::public.service_category,
    nullif(btrim(coalesce(p_subcategory, '')), ''),
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_address, '')), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_website, '')), ''),
    'manual', true, true
  )
  returning * into listing;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'program.submit', 'service', listing.id,
          jsonb_build_object('name', listing.name));

  return listing;
end;
$$;

comment on function public.submit_program is
  'A program lead sends their program for review (D-447). Creates their org '
  'if they have none and writes the listing needs_review = true, so members '
  'cannot see it until a super admin approves it.';

revoke all on function public.submit_program(text, text, text, text, text, text, text)
  from public, anon;
grant execute on function public.submit_program(text, text, text, text, text, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 2. A program lead cannot approve their own listing, or move a live one.
--
-- 0016 granted insert/update on `services` to `authenticated`, and
-- `services_write_provider` is `for all` over the lead's own org, so a lead
-- could set `needs_review = false`, or insert a listing already approved, with
-- a plain API call. The review gate (D-379) only held because no screen did
-- it. A trigger is the right place: RLS cannot compare old and new values.
--
-- Only a provider acting as a provider is held to this. A super admin,
-- an admin, and the import jobs (no `auth.uid()`) are not.
create or replace function public.guard_provider_listing_review()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null or public.is_admin() or public.my_role() is distinct from 'provider' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.needs_review := true;
    new.source := 'manual';
    return new;
  end if;

  if new.needs_review is distinct from old.needs_review
     or new.org_id is distinct from old.org_id
     or new.source is distinct from old.source
     or new.source_ref is distinct from old.source_ref
     or new.removed_at is distinct from old.removed_at then
    raise exception 'REVIEW_IS_NOT_YOURS';
  end if;

  -- D-447: once a program is live, who and where it is are not edited in
  -- place. A change to its name, address or category goes back through review,
  -- and the live row keeps serving members meanwhile (a pending change is held
  -- beside it by the review queue, a later step). Description, phone and
  -- website are the lead's to change at once.
  if not old.needs_review and old.is_active
     and (new.name is distinct from old.name
          or new.category is distinct from old.category
          or new.subcategory is distinct from old.subcategory
          or new.address is distinct from old.address) then
    raise exception 'LIVE_LISTING_NEEDS_REVIEW';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_provider_listing_review() from public, anon, authenticated;

create or replace trigger services_provider_review_guard
  before insert or update on public.services
  for each row execute function public.guard_provider_listing_review();

-- ---------------------------------------------------------------------------
-- 3. Changing the words on a live program does not take it off the map.
--
-- 0020 raises `needs_review` whenever a listing's plain-language text changes,
-- so unreviewed *imported* prose can never reach a member. It cannot tell an
-- importer from a program lead fixing their own description, so as written a
-- lead who changed one sentence would hide their live program from members
-- until Pam approved it again. D-447: description, phone and website apply at
-- once. So a program lead editing a listing that is already live is let
-- through; the import jobs, an admin, and anything not yet live behave exactly
-- as before.
create or replace function public.flag_unapproved_rewrite()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if tg_op = 'INSERT' then
    if new.description_plain is not null
       or new.eligibility_plain is not null
       or new.how_to_enroll_plain is not null then
      new.needs_review := true;
    end if;
  elsif new.description_plain is distinct from old.description_plain
     or new.eligibility_plain is distinct from old.eligibility_plain
     or new.how_to_enroll_plain is distinct from old.how_to_enroll_plain then
    if not (
      auth.uid() is not null
      and not old.needs_review
      and old.is_active
      and public.my_role() = 'provider'
      and not public.is_admin()
      and old.org_id is not distinct from public.my_org()
    ) then
      new.needs_review := true;
    end if;
  end if;
  return new;
end;
$$;
