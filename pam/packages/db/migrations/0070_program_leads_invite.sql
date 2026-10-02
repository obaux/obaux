-- 0070 — A program lead can invite people too (D-219, Will, 2 October 2026).
--
-- Until now `create_invite` (0049) answered only a case manager or the super
-- admin. The redesigned staff Home floats "Invite someone" for program leads
-- as well (D-218), and Will decided they may use it: "Yes, let's make sure
-- this is allowed and documented."
--
-- What a program lead may do, and what stays the same:
--
--   * Invite a **member** or a **program** (another program lead) — the two
--     rows on Invite someone. Never a case manager, never a super admin: the
--     two lines that do not move (0049).
--   * Only into **their own region**, like a case manager. A program lead with
--     no region on file is told so rather than issuing a code for nowhere.
--   * A member a program lead invites lands on **nobody's caseload**
--     (`assigned_admin_id` null), exactly as one the super admin invites does.
--     Writing the program lead's id there would make them that member's case
--     manager in every caseload policy — a widening of what a program sees
--     (`transparency.ts`) that nobody asked for. A case manager picks the
--     member up from the directory, as today.
--   * Every invite is still audited (`invite.create`), with who made it.
--
-- Only the function changes. No policy, grant or table is touched: the
-- program lead never reads or writes `invites` directly — `create_invite` is
-- `security definer` and returns the one row it made.

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

  -- A case manager sees other people's information. Only the person running
  -- PAM hands that out, and they say which city it is for.
  if p_role = 'admin' and not is_super then
    raise exception 'Admin accounts are not created by invite code';
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
    -- invite lands on nobody's — a case manager picks them up later.
    case when is_super or is_program then null else caller end
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
  'Makes an invite code. A case manager or a program invites members and '
  'programs into their own region; a super admin invites into any region and '
  'is the only one who can invite a case manager. Nobody is invited to be a '
  'super admin (0049). A member invited by a program or the super admin lands '
  'on no caseload (0070).';

revoke all on function public.create_invite(public.user_role, text, uuid) from public, anon;
grant execute on function public.create_invite(public.user_role, text, uuid) to authenticated;
