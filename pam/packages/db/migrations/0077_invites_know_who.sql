-- 0077 — An invite knows who it is for (D-373).
--
-- Will, 7 October: staff come in by the link they are sent, and nobody can
-- say they are staff on the sign-up form (D-369). Somebody who lost the
-- link, ignored it, or found Pam by searching would land on a member's
-- sign-up. Industry practice (Slack, GitHub, Google Workspace): when you sign
-- in, the app looks for an invitation already waiting for you. Pam signs in
-- by phone, so:
--
--   1. Every new invite names the person and their phone. Both are required
--      ("required phone number and name fields"). The phone was already an
--      optional prefill (0002, §4.1); it is now always there, normalised to
--      E.164 the way profiles are (0075), and redemption keeps refusing any
--      other number. Old invites without a phone still redeem as before.
--   2. `pending_invite_for_me()` — after the code works, the app asks
--      whether an invite is waiting for the number just verified. Only ever
--      the caller's own number; nothing about anybody else.
--   3. A renewed invite (0071's expired-link email) keeps the name and phone.
--
-- What it deliberately does not do: tell the person making an invite that
-- the number already has a Pam account. That would let a program or a case
-- manager test whether somebody uses Pam — itself something a returning
-- citizen may not want known. The person who signs in is told instead
-- (`has_account`), and Pam asks them to have the invite sent to another
-- number until one account can hold both roles (next phase, D-373).

-- ---------------------------------------------------------------------------
-- 1. The invitee's name.

alter table public.invites add column if not exists first_name text;

comment on column public.invites.first_name is
  'Who the invite is for, as the inviter typed it (0077). Prefills joining; '
  'the person can change it.';

-- ---------------------------------------------------------------------------
-- 2. create_invite: name and phone required.

drop function if exists public.create_invite(public.user_role, text, uuid);

create or replace function public.create_invite(
  p_role public.user_role,
  p_phone text default null,
  p_region_id uuid default null,
  p_first_name text default null
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
  v_phone       text := public.to_e164(p_phone);
  v_name        text := nullif(btrim(coalesce(p_first_name, '')), '');
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

  -- Who it is for (0077). The same shape profiles keep (0002's check), so
  -- sign-in can find it by the number the person verifies.
  if v_name is null then
    raise exception 'INVITE_NEEDS_NAME';
  end if;
  if v_phone is null or v_phone !~ '^\+[1-9]\d{7,14}$' then
    raise exception 'INVITE_NEEDS_PHONE';
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

  insert into public.invites (code, created_by, role, region_id, phone, first_name, assigned_admin_id)
  values (
    public.generate_invite_code(),
    caller,
    p_role,
    target_region,
    v_phone,
    v_name,
    -- A member lands on the caseload of the case manager who invited them
    -- (§4.1). A super admin or a program has no caseload; a case manager or a
    -- program being invited is on nobody's caseload either (0073).
    case when is_super or is_program or p_role <> 'member' then null else caller end
  )
  returning * into new_invite;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.create', 'invite', new_invite.id,
          jsonb_build_object('role', p_role, 'region_id', target_region, 'by_role', caller_role));

  return new_invite;
end;
$$;

comment on function public.create_invite is
  'Makes an invite for a named person and their phone (0077). A case manager '
  'invites members, programs and case managers into their own region (0073); '
  'a program invites members and programs (0070); a super admin invites into '
  'any region. Nobody is invited to be a super admin (0049).';

revoke all on function public.create_invite(public.user_role, text, uuid, text) from public, anon;
grant execute on function public.create_invite(public.user_role, text, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. The invite waiting for the number just verified.

create or replace function public.pending_invite_for_me()
returns table (
  code               text,
  invited_role       public.user_role,
  first_name         text,
  inviter_first_name text,
  has_account        boolean
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  caller       uuid := auth.uid();
  caller_phone text;
  account      boolean;
begin
  if caller is null then
    return;
  end if;

  -- Only the caller's own verified number; never a number they pass in.
  select public.to_e164(phone) into caller_phone from auth.users where id = caller;
  if caller_phone is null then
    return;
  end if;

  account := exists (select 1 from public.profiles where id = caller);

  return query
    select i.code, i.role, i.first_name, p.first_name, account
    from public.invites i
    left join public.profiles p on p.id = i.created_by
    where i.phone = caller_phone
      and i.status = 'pending'
      and i.expires_at >= now()
      -- Somebody already in Pam has nothing to do with a member invite; a
      -- staff one is what they need telling about (has_account).
      and (not account or i.role <> 'member')
    order by i.created_at desc
    limit 1;
end;
$$;

comment on function public.pending_invite_for_me is
  'After sign-in (0077): the newest live invite made for the caller''s own '
  'verified phone — its code, role, the name it was made for, the inviter''s '
  'first name, and whether this number already has an account. Nothing else.';

revoke all on function public.pending_invite_for_me() from public, anon;
grant execute on function public.pending_invite_for_me() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. A renewed invite keeps who it is for (0071).

create or replace function public.request_invite_link(p_code text, p_email text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  inv     public.invites;
  fresh   public.invites;
  address text := lower(trim(coalesce(p_email, '')));
begin
  if address !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(address) > 254 then
    raise exception 'INVALID_EMAIL';
  end if;

  select * into inv from public.invites where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if inv.status in ('redeemed', 'revoked') then
    raise exception 'INVITE_ALREADY_USED';
  end if;
  if inv.expires_at >= now() and inv.status = 'pending' then
    raise exception 'INVITE_STILL_VALID';
  end if;

  -- Asked already: the same answer, and no second email.
  if exists (select 1 from public.invite_emails where expired_invite = inv.id) then
    return true;
  end if;

  update public.invites set status = 'expired' where id = inv.id and status = 'pending';

  insert into public.invites (code, created_by, role, region_id, assigned_admin_id, phone, first_name)
  values (public.generate_invite_code(), inv.created_by, inv.role, inv.region_id,
          inv.assigned_admin_id, inv.phone, inv.first_name)
  returning * into fresh;

  insert into public.invite_emails (expired_invite, new_invite, email)
  values (inv.id, fresh.id, address);

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (null, 'invite.reissue', 'invite', fresh.id,
          jsonb_build_object('expired_invite', inv.id));

  return true;
end;
$$;

revoke all on function public.request_invite_link(text, text) from public;
grant execute on function public.request_invite_link(text, text) to anon, authenticated;
