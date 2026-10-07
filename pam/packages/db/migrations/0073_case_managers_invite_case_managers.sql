-- 0073 — A case manager can invite a case manager (D-315, Will, 6 October
-- 2026: "Case managers should also be able to invite other case managers.
-- Not only super admins should be able to invite.").
--
-- Until now `create_invite` (0049, 0070) let only the super admin issue a
-- case manager's code. A case manager already sees other people's
-- information and already vouches for members and programs; vouching for a
-- colleague in the same city is the same act. So:
--
--   * A **case manager** may invite a case manager — into their own region
--     only, like every other invite they make. A program lead still may not
--     (0070), and nobody is invited to be a super admin (0049).
--   * A case manager invited this way lands on **nobody's caseload**
--     (`assigned_admin_id` null): that column means "this member's case
--     manager", and a case manager is not a member.
--   * The super admin's path is unchanged: any region, named explicitly.
--   * Every invite is still audited (`invite.create`), with who made it.
--
-- Only the function changes. No policy, grant or table is touched.

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
  caller_role   public.user_role;
  caller_region uuid;
  is_super      boolean := public.is_super_admin();
  is_program    boolean;
  target_region uuid;
  new_invite    public.invites;
begin
  select role, region_id into caller_role, caller_region
  from public.profiles where id = caller;
  is_program := caller_role = 'provider';

  if not (public.is_admin() or is_super or is_program) then
    raise exception 'Only a case manager or a program can create an invite';
  end if;

  -- Nobody is invited to run PAM. A super admin is made by the seeding script,
  -- by a person with the service role key, on purpose.
  if p_role = 'super_admin' then
    raise exception 'Super admin accounts are not created by invite code';
  end if;

  -- A case manager sees other people's information. The person running PAM
  -- or a case manager in that city hands that out (0073); a program never.
  if p_role = 'admin' and is_program then
    raise exception 'A program cannot invite a case manager';
  end if;

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
    -- A case manager or a program invites into their own region, never another's.
    if p_region_id is not null and p_region_id is distinct from caller_region then
      raise exception 'Cannot invite into a region you do not administer';
    end if;
    if caller_region is null then
      raise exception 'Say which city this invite is for';
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
    -- (§4.1). A super admin or a program has no caseload, so a member they
    -- invite lands on nobody's — a case manager picks them up later. A case
    -- manager or a program being invited is on nobody's caseload either
    -- (0073): the column means a member's case manager.
    case when is_super or is_program or p_role <> 'member' then null else caller end
  )
  returning * into new_invite;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.create', 'invite', new_invite.id,
          jsonb_build_object('role', p_role, 'has_phone_prefill', p_phone is not null,
                             'region_id', target_region, 'by_role', caller_role));

  return new_invite;
end;
$$;

comment on function public.create_invite is
  'Makes an invite code. A case manager invites members, programs and case '
  'managers into their own region (0073); a program invites members and '
  'programs (0070); a super admin invites into any region. Nobody is invited '
  'to be a super admin (0049). Only a member invited by a case manager lands '
  'on a caseload.';

revoke all on function public.create_invite(public.user_role, text, uuid) from public, anon;
grant execute on function public.create_invite(public.user_role, text, uuid) to authenticated;
