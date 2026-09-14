-- 0049 — Four kinds of people, four ways in.
--
-- The audit of the way in (14 September) found that the person running PAM
-- could not bring anybody in. `is_admin()` is `role = 'admin'`, so a super
-- admin calling `create_invite` was told "Only an admin can create an invite",
-- and `create_invite` refused the 'admin' role for everybody. The only way a
-- case manager could exist was the seeding script, run from a laptop with the
-- service role key. That is not a way in; it is a workaround.
--
-- After this migration the four kinds of account each have exactly one door:
--
--   member       signs themselves up (start_membership, 0046), or redeems a
--                code a case manager made
--   provider     asks at sign-up (request_staff_access), and redeems the code a
--                case manager or super admin then makes
--   admin        redeems a code only a super admin can make, into a named region
--   super_admin  the seeding script, and nothing else — there is nobody above
--                them to invite them
--
-- The line that does not move: nobody chooses their own role. A member
-- self-serves because a member sees only their own rows; every role that sees
-- somebody else's rows is handed out by a person who is answerable for it, and
-- the invite carries the role.

-- A super admin's reach is every region, so they read the list of regions —
-- they have to, to say which one a case manager is for. Names and centres, the
-- same thing `served_cities()` already gives anybody; nothing about who is in
-- them.
drop policy if exists regions_select_own on public.regions;
create policy regions_select_own on public.regions
  for select using (
    id = public.my_region()
    or public.my_role() in ('provider', 'member')
    or public.is_super_admin()
  );

-- 0002 wrote the old rule into the table itself: `role in ('member',
-- 'provider')`. The rule now is that nobody is invited to be a super admin —
-- and that a case manager is invited only by the person running PAM, which is
-- a fact about the caller and lives in `create_invite` below.
alter table public.invites drop constraint if exists invites_role_not_admin;
alter table public.invites add constraint invites_role_not_super_admin
  check (role <> 'super_admin');

-- A super admin manages every invite, not only their own. A case manager still
-- manages only the ones they made.
drop policy if exists invites_super_admin_manage on public.invites;
create policy invites_super_admin_manage on public.invites
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create or replace function public.create_invite(
  p_role public.user_role,
  p_phone text default null,
  p_region_id uuid default null
)
returns public.invites
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller        uuid := auth.uid();
  caller_region uuid;
  is_super      boolean := public.is_super_admin();
  target_region uuid;
  new_invite    public.invites;
begin
  if not (public.is_admin() or is_super) then
    raise exception 'Only an admin can create an invite';
  end if;

  -- Nobody is invited to run PAM. A super admin is made by the seeding script,
  -- by a person with the service role key, on purpose.
  if p_role = 'super_admin' then
    raise exception 'Super admin accounts are not created by invite code';
  end if;

  -- A case manager sees other people's information. Only the person running
  -- PAM hands that out, and they say which city it is for.
  if p_role = 'admin' and not is_super then
    raise exception 'Admin accounts are not created by invite code';
  end if;

  select region_id into caller_region from public.profiles where id = caller;

  if is_super then
    -- A super admin has no region of their own, so the invite has to name one.
    target_region := coalesce(p_region_id, caller_region);
    if target_region is null then
      raise exception 'Say which city this invite is for';
    end if;
    if not exists (select 1 from public.regions where id = target_region) then
      raise exception 'That is not a city PAM serves';
    end if;
  else
    -- An admin invites into their own region, never another's.
    if p_region_id is not null and p_region_id <> caller_region then
      raise exception 'Cannot invite into a region you do not administer';
    end if;
    target_region := caller_region;
  end if;

  insert into public.invites (code, created_by, role, region_id, phone, assigned_admin_id)
  values (
    public.generate_invite_code(),
    caller,
    p_role,
    target_region,
    p_phone,
    -- A member lands on the caseload of the case manager who invited them
    -- (§4.1). A super admin has no caseload, so a member they invite lands on
    -- nobody's — a case manager picks them up from the directory later.
    case when is_super then null else caller end
  )
  returning * into new_invite;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.create', 'invite', new_invite.id,
          jsonb_build_object('role', p_role, 'has_phone_prefill', p_phone is not null,
                             'region_id', target_region));

  return new_invite;
end;
$$;

comment on function public.create_invite is
  'Makes an invite code. A case manager invites members and programs into '
  'their own region; a super admin invites into any region and is the only one '
  'who can invite a case manager. Nobody is invited to be a super admin (0049).';

-- Redeeming a code fills the same two columns sign-up asks for, so a person
-- who came in by code is not the one person PAM has no last name or city for.
create or replace function public.redeem_invite(
  p_code text,
  p_first_name text default null,
  p_preferred_language text default 'en',
  p_last_name text default null,
  p_home_city text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  caller_phone text;
  invite public.invites;
  new_profile public.profiles;
begin
  if caller is null then
    raise exception 'Verify your phone number first';
  end if;

  if exists (select 1 from public.profiles where id = caller) then
    raise exception 'This account has already been set up';
  end if;

  select phone into caller_phone from auth.users where id = caller;

  select * into invite
  from public.invites
  where code = upper(btrim(p_code))
  for update;

  -- One message for "wrong", "used" and "expired" would be friendlier to an
  -- attacker; the onboarding copy (§10 step 3) shows the same plain sentence
  -- either way, so the distinction here only reaches the logs.
  if invite.id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if invite.status <> 'pending' then
    raise exception 'INVITE_ALREADY_USED';
  end if;

  if invite.expires_at < now() then
    update public.invites set status = 'expired' where id = invite.id;
    raise exception 'INVITE_EXPIRED';
  end if;

  -- §4.1: when the invite prefilled a phone, the verified number must match, so
  -- a code overheard in a waiting room cannot be redeemed by a bystander.
  if invite.phone is not null and invite.phone is distinct from caller_phone then
    raise exception 'INVITE_PHONE_MISMATCH';
  end if;

  insert into public.profiles (
    id, role, first_name, last_name, home_city, phone, preferred_language,
    region_id, invited_by, access_status
  )
  values (
    caller,
    invite.role,
    nullif(btrim(coalesce(p_first_name, '')), ''),
    nullif(btrim(coalesce(p_last_name, '')), ''),
    nullif(btrim(coalesce(p_home_city, '')), ''),
    caller_phone,
    coalesce(nullif(btrim(p_preferred_language), ''), 'en'),
    invite.region_id,
    invite.created_by,
    'active'
  )
  returning * into new_profile;

  update public.invites
  set status = 'redeemed', redeemed_by = caller, redeemed_at = now()
  where id = invite.id;

  -- Members land on the inviting admin's caseload automatically (§4.1 step 1).
  if invite.role = 'member' and invite.assigned_admin_id is not null then
    insert into public.admin_assignments (admin_id, member_id)
    values (invite.assigned_admin_id, caller)
    on conflict do nothing;
  end if;

  insert into public.notification_preferences (member_id) values (caller)
  on conflict do nothing;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.redeem', 'invite', invite.id,
          jsonb_build_object('role', invite.role));

  return new_profile;
end;
$$;

-- The three-argument shape is gone; PostgREST resolves the call by the
-- arguments it is given, and a second overload would let it pick either.
drop function if exists public.redeem_invite(text, text, text);

revoke all on function public.redeem_invite(text, text, text, text, text) from public, anon;
grant execute on function public.redeem_invite(text, text, text, text, text) to authenticated;
