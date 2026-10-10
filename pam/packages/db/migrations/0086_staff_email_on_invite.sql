-- 0086 — A staff invite carries the person's email, and their account keeps it (D-441).
--
-- Will, 9 October 2026: emails are collected when a guide or a program invites
-- someone; Pam does not ask for one when somebody creates their account; "the
-- phone number they use to sign in should map to their email if they were
-- invited. Map these together in their account." Then, shown the plan: only
-- staff are asked ("we just don't ask members ... not everyone has an email.
-- This will be typically just staff"), and for staff it is **not optional**.
--
-- What was true before: an invite named a person and a phone (0077) and nothing
-- else. The only emails Pam held were the ones typed on the expired-link page
-- (0071, `invite_emails`), tied to a link, never to an account. And `profiles`
-- has no email column by design (0002: sign-in is phone-only), so this does not
-- add one.
--
--   1. `invite_contact_emails` — the email a staff invite was made with, held
--      apart from `invites` so that the person who typed it, other case
--      managers, programs and members cannot read it back. No client role has
--      any grant on it and it has no policy: only the functions below reach it.
--   2. `profile_emails` — the account's email, tied to the verified phone by the
--      invite that named both. The person can read their own row; nobody else
--      can, and no client role can write it.
--   3. `create_staff_invite(role, email, phone, region, name)` — the way to
--      invite a case manager or a program lead; the email is required and must
--      look like one. `create_invite` (the 4-argument form every member invite
--      still uses) now refuses a staff role with INVITE_NEEDS_EMAIL, and refuses
--      an email on a member invite (INVITE_MEMBER_NO_EMAIL). Both call
--      `invite_create`, which nobody but those two can call. There is no `drop`
--      anywhere in this file (the connector times out on one, D-387).
--   4. `redeem_invite` and `add_role_from_invite` copy the invite's email onto
--      the account, once the verified number has matched. A renewed staff
--      invite (0071's expired-link email) has no email of its own: the email is
--      found by following the renewals back to the invite it was made with, so
--      this file leaves `request_invite_link` alone (0085 changes it, and is
--      applied separately). An invite made before this migration has none, and
--      redeems exactly as before.
--
-- What it deliberately does not do: send anything (the provider is a separate
-- item in docs/before-launch.md), show the email to anyone but its owner, put
-- it in the audit log, or ask a member for one.

-- ---------------------------------------------------------------------------
-- 1. The email a staff invite was made with.

create table public.invite_contact_emails (
  invite_id  uuid primary key references public.invites (id) on delete cascade,
  email      text not null check (
               char_length(email) between 3 and 254
               and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
               and email = lower(email)
             ),
  created_at timestamptz not null default now()
);

alter table public.invite_contact_emails enable row level security;
alter table public.invite_contact_emails force row level security;
revoke all on public.invite_contact_emails from public, anon, authenticated;

-- A policy that admits nobody, so "no one" is written down rather than implied
-- by a missing grant (03_invariants.sql wants every RLS table to have one). The
-- functions below run as the table's owner and the sender uses the service role;
-- neither is a client role.
create policy invite_contact_emails_nobody on public.invite_contact_emails
  for all using (false) with check (false);

comment on table public.invite_contact_emails is
  'The email a staff invite was made with (0086, D-441). Forced RLS, a policy that admits nobody, '
  'no grant to any client role: only invite_create(), redeem_invite(), '
  'add_role_from_invite() and keep_invite_email() reach it. Removed when the '
  'invite is redeemed, because the account keeps it then (profile_emails).';

-- ---------------------------------------------------------------------------
-- 2. The account's email, tied to the number that signed in.

create table public.profile_emails (
  profile_id  uuid primary key references public.profiles (id) on delete cascade,
  email       text not null check (
                char_length(email) between 3 and 254
                and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                and email = lower(email)
              ),
  -- The invite that named this person's phone and email together.
  from_invite uuid references public.invites (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.profile_emails enable row level security;
alter table public.profile_emails force row level security;
revoke all on public.profile_emails from public, anon, authenticated;
grant select on public.profile_emails to authenticated;

-- Their own, and nobody's else: not the person who invited them, not a case
-- manager, not a program, not a member, not the super admin through the app.
-- Pam's own sender reads it with the service role.
create policy profile_emails_own_select on public.profile_emails
  for select to authenticated using (profile_id = auth.uid());

comment on table public.profile_emails is
  'The email an invite carried, tied to the verified phone it named (0086, '
  'D-441). The owner reads their own row; no client role writes it.';

-- ---------------------------------------------------------------------------
-- 3. Making the invite.

create or replace function public.invite_create(
  p_role public.user_role,
  p_phone text,
  p_region_id uuid,
  p_first_name text,
  p_email text
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
  v_email       text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_staff       boolean := p_role in ('provider', 'admin');
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

  -- A staff invite carries the person's email; a member's never does (0086,
  -- D-441). Staff are the people Pam writes to; members are not asked, because
  -- not everyone has an email and nobody should be turned away for lacking one.
  if v_staff then
    if v_email is null then
      raise exception 'INVITE_NEEDS_EMAIL';
    end if;
    if char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception 'INVITE_EMAIL_INVALID';
    end if;
  elsif v_email is not null then
    raise exception 'INVITE_MEMBER_NO_EMAIL';
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

  -- Held apart from the invite, where only this file's functions can reach it:
  -- the person who typed it cannot read it back, and neither can anybody else.
  if v_staff then
    insert into public.invite_contact_emails (invite_id, email) values (new_invite.id, v_email);
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.create', 'invite', new_invite.id,
          jsonb_build_object('role', p_role, 'region_id', target_region, 'by_role', caller_role));

  return new_invite;
end;
$$;

comment on function public.invite_create is
  'The one place an invite is made (0077, 0086). Not callable by a client role: '
  'create_invite (members) and create_staff_invite (case managers and programs) '
  'call it.';

revoke all on function public.invite_create(public.user_role, text, uuid, text, text)
  from public, anon, authenticated;

-- Members, as before: name and phone, never an email. A staff role through this
-- door is refused, with the reason, so an old client fails loudly instead of
-- making an invite nobody can write to.
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
begin
  return public.invite_create(p_role, p_phone, p_region_id, p_first_name, null);
end;
$$;

comment on function public.create_invite is
  'Makes a member invite for a named person and their phone (0077). A staff '
  'role needs create_staff_invite, because staff invites carry an email '
  '(0086). A case manager invites members, programs and case managers into '
  'their own region (0073); a program invites members and programs (0070); a '
  'super admin invites into any region. Nobody is invited to be a super admin (0049).';

revoke all on function public.create_invite(public.user_role, text, uuid, text) from public, anon;
grant execute on function public.create_invite(public.user_role, text, uuid, text) to authenticated;

-- Staff: a case manager or a program lead, with the email Pam will write to.
create or replace function public.create_staff_invite(
  p_role public.user_role,
  p_email text,
  p_phone text default null,
  p_region_id uuid default null,
  p_first_name text default null
)
returns public.invites
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_role not in ('provider', 'admin') then
    raise exception 'INVITE_NOT_STAFF';
  end if;
  return public.invite_create(p_role, p_phone, p_region_id, p_first_name, p_email);
end;
$$;

comment on function public.create_staff_invite is
  'Makes an invite for a case manager or a program lead: name, phone and an '
  'email, all required (0086, D-441). The email is held out of the invite and '
  'lands on the account when the invite is redeemed.';

revoke all on function public.create_staff_invite(public.user_role, text, text, uuid, text) from public, anon;
grant execute on function public.create_staff_invite(public.user_role, text, text, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Keeping the email when the invite is redeemed.

create or replace function public.keep_invite_email(p_invite uuid, p_profile uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text;
  v_from  uuid;
begin
  -- The invite that was redeemed, and every invite it was renewed from: an
  -- expired link asks for a fresh one (0071) and the fresh invite keeps the
  -- name and phone but not the email, so the email is found by following the
  -- renewals back to the invite it was made with. (This is also why 0086 does
  -- not need to touch request_invite_link, which 0085 changes.)
  with recursive chain(invite_id) as (
    select p_invite
    union
    select r.expired_invite
    from public.invite_emails r
    join chain c on c.invite_id = r.new_invite
  )
  select c.email, c.invite_id into v_email, v_from
  from public.invite_contact_emails c
  join chain on chain.invite_id = c.invite_id
  limit 1;

  if v_email is not null then
    -- An account keeps the first email it was given; a later invite does not
    -- replace it.
    insert into public.profile_emails (profile_id, email, from_invite)
    values (p_profile, v_email, v_from)
    on conflict (profile_id) do nothing;
  end if;

  -- None of the chain needs it any more.
  with recursive chain(invite_id) as (
    select p_invite
    union
    select r.expired_invite
    from public.invite_emails r
    join chain c on c.invite_id = r.new_invite
  )
  delete from public.invite_contact_emails c using chain
  where c.invite_id = chain.invite_id;
end;
$$;

comment on function public.keep_invite_email is
  'Moves the email an invite was made with onto the account that redeemed it, '
  'following renewals back to the original invite (0086). Not callable by a '
  'client role.';

revoke all on function public.keep_invite_email(uuid, uuid) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 5. Redeeming: the same functions, with the email carried through.

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

  -- auth.users keeps a verified number as bare digits; the invite and the
  -- profile keep E.164 (0002's check). Compare and store the same shape (0068).
  select public.to_e164(phone) into caller_phone from auth.users where id = caller;

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

  -- The email a staff invite carried goes onto the account, tied to the number
  -- that was just verified (0086, D-441). An old invite has none: nothing to do.
  perform public.keep_invite_email(invite.id, caller);

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.redeem', 'invite', invite.id,
          jsonb_build_object('role', invite.role));

  return new_profile;
end;
$$;

create or replace function public.add_role_from_invite(p_code text)
returns public.profiles
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller       uuid := auth.uid();
  caller_phone text;
  invite       public.invites;
  account      public.profiles;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;

  select * into account from public.profiles where id = caller;
  if account.id is null then
    raise exception 'NO_ACCOUNT';
  end if;

  select public.to_e164(phone) into caller_phone from auth.users where id = caller;

  select * into invite from public.invites where code = upper(btrim(p_code)) for update;
  if invite.id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if invite.status <> 'pending' then
    raise exception 'INVITE_ALREADY_USED';
  end if;
  if invite.expires_at < now() then
    raise exception 'INVITE_EXPIRED';
  end if;
  -- The number it was made for, and only that number.
  if invite.phone is null or invite.phone is distinct from caller_phone then
    raise exception 'INVITE_PHONE_MISMATCH';
  end if;
  if invite.role <> 'provider' then
    raise exception 'ROLE_PAIR_NOT_ALLOWED';
  end if;
  if invite.region_id is distinct from account.region_id then
    raise exception 'INVITE_OTHER_CITY';
  end if;

  -- The pair guard refuses anything but member + provider.
  insert into public.profile_roles (profile_id, role, granted_by)
  values (caller, 'provider', invite.created_by);

  -- Start in the new role: they just said yes to it.
  update public.profiles set role = 'provider' where id = caller
  returning * into account;

  update public.invites
  set status = 'redeemed', redeemed_by = caller, redeemed_at = now()
  where id = invite.id;

  -- The program invite carried an email: the account keeps it unless it has one.
  perform public.keep_invite_email(invite.id, caller);

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.add_role', 'invite', invite.id, jsonb_build_object('role', invite.role));

  return account;
end;
$$;
