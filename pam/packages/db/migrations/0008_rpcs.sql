-- 0008 — Server-side operations that must not be expressible as a client write.
--
-- Each is SECURITY DEFINER with an explicit search_path (repo convention), and
-- each validates the caller itself rather than trusting the policy that let the
-- call through. Anything that changes access or role membership also writes
-- audit_log in the same transaction — §4.1 allows no unlogged admin action.

-- ---------------------------------------------------------------------------
-- Invite creation (§4.1 step 1).
-- ---------------------------------------------------------------------------
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
  caller uuid := auth.uid();
  caller_region uuid;
  new_invite public.invites;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can create an invite';
  end if;

  if p_role = 'admin' then
    raise exception 'Admin accounts are not created by invite code';
  end if;

  select region_id into caller_region from public.profiles where id = caller;

  -- An admin invites into their own region, never another's.
  if p_region_id is not null and p_region_id <> caller_region then
    raise exception 'Cannot invite into a region you do not administer';
  end if;

  insert into public.invites (code, created_by, role, region_id, phone, assigned_admin_id)
  values (
    public.generate_invite_code(),
    caller,
    p_role,
    coalesce(p_region_id, caller_region),
    p_phone,
    caller
  )
  returning * into new_invite;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.create', 'invite', new_invite.id,
          jsonb_build_object('role', p_role, 'has_phone_prefill', p_phone is not null));

  return new_invite;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invite redemption (§4.1 step 2, §10 steps 3-4).
--
-- Runs as definer so a wrong code cannot be used to enumerate pending invites:
-- the client never selects from `invites` at all, it only gets an answer.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_invite(
  p_code text,
  p_first_name text default null,
  p_preferred_language text default 'en'
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
    id, role, first_name, phone, preferred_language, region_id, invited_by, access_status
  )
  values (
    caller,
    invite.role,
    p_first_name,
    caller_phone,
    coalesce(p_preferred_language, 'en'),
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

-- ---------------------------------------------------------------------------
-- Access control (§4.1). Reason is mandatory and the change is always logged.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_feature_access(
  p_subject_id uuid,
  p_feature public.controllable_feature,
  p_allowed boolean,
  p_reason text,
  p_user_facing_note text default null
)
returns public.access_controls
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  row_out public.access_controls;
begin
  if not public.admin_covers(p_subject_id) then
    raise exception 'That person is not on your caseload or in your region';
  end if;

  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'A reason is required for every access change';
  end if;

  insert into public.access_controls
    (subject_id, feature, allowed, set_by, reason, user_facing_note)
  values (p_subject_id, p_feature, p_allowed, caller, p_reason, p_user_facing_note)
  on conflict (subject_id, feature) do update
    set allowed = excluded.allowed,
        set_by = excluded.set_by,
        reason = excluded.reason,
        user_facing_note = excluded.user_facing_note,
        updated_at = now()
  returning * into row_out;

  -- The reason is recorded here for oversight, and never rendered to the subject.
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'access.set', 'profile', p_subject_id,
          jsonb_build_object('feature', p_feature, 'allowed', p_allowed, 'reason', p_reason));

  return row_out;
end;
$$;

create or replace function public.admin_set_access_status(
  p_subject_id uuid,
  p_status public.access_status,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
begin
  if not public.admin_covers(p_subject_id) then
    raise exception 'That person is not on your caseload or in your region';
  end if;

  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'A reason is required for every access change';
  end if;

  update public.profiles set access_status = p_status where id = p_subject_id;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'access.status', 'profile', p_subject_id,
          jsonb_build_object('status', p_status, 'reason', p_reason));
end;
$$;

-- ---------------------------------------------------------------------------
-- Points. Clients can never insert into points_ledger (§8) — awards come
-- through here, and the award amount comes from the server, not the caller.
-- ---------------------------------------------------------------------------
create or replace function public.member_points(p_member_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, extensions
as $$
  -- Balance is always the sum of the ledger. There is no stored balance to
  -- drift out of sync (§8 acceptance).
  select coalesce(sum(delta), 0)::integer
  from public.points_ledger
  where member_id = p_member_id;
$$;

revoke all on function public.create_invite(public.user_role, text, uuid) from public;
revoke all on function public.admin_set_feature_access(uuid, public.controllable_feature, boolean, text, text) from public;
revoke all on function public.admin_set_access_status(uuid, public.access_status, text) from public;

grant execute on function public.create_invite(public.user_role, text, uuid) to authenticated;
grant execute on function public.redeem_invite(text, text, text) to authenticated;
grant execute on function public.admin_set_feature_access(uuid, public.controllable_feature, boolean, text, text) to authenticated;
grant execute on function public.admin_set_access_status(uuid, public.access_status, text) to authenticated;
grant execute on function public.member_points(uuid) to authenticated;
