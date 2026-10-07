-- 0078 — One account, two roles: member and program (D-374, D-375).
--
-- Will, 7 October: "allow member and program only"; "a staffer's own
-- program can see them as a member … create an extra rule hiding them from
-- their own program's lists"; both roles in the same city (yes); a staffer
-- may not book their own program as a member (no); the switch is a row on
-- Profile. The design and the audit behind it:
-- docs/design/one-account-two-roles.md.
--
-- The shape, chosen so today's single-role accounts behave exactly as before:
--
--   * `profile_roles` holds what an account has been given — one row per
--     role. Only {member, provider} may be held together.
--   * `profiles.role` stays, and now means the role the account is *acting
--     as*. The three helpers (`my_role`, `is_admin`, `is_super_admin`) and so
--     all 94 policies keep reading it unchanged. It is not writable by the
--     app (no column grant); `switch_role()` is the only way to change it,
--     and only to a role the account was given.
--   * Functions that mean "is a member" / "is staff at this program",
--     whatever the person is acting as, read `profile_roles` (`has_role`,
--     `is_staff_at`).
--   * Acting as a member, `my_org()` is null, so no program data is reachable
--     from the member side.
--   * A program never holds its own staff as a member: no enrollment or
--     appointment may join a member to a program where they are staff. Every
--     program list is built from those, so their member side never appears
--     in their own program's lists.

-- ---------------------------------------------------------------------------
-- 1. What an account has been given.

create table if not exists public.profile_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role       public.user_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles (id) on delete set null,
  primary key (profile_id, role)
);

comment on table public.profile_roles is
  'The roles an account has been given (0078, D-374). profiles.role is the one '
  'it is acting as. Only member and provider may be held together.';

alter table public.profile_roles enable row level security;
alter table public.profile_roles force row level security;

drop policy if exists profile_roles_select_own on public.profile_roles;
create policy profile_roles_select_own on public.profile_roles
  for select using (profile_id = auth.uid() or public.is_super_admin());

revoke all on public.profile_roles from anon, authenticated;
grant select on public.profile_roles to authenticated;

-- Everybody today holds exactly the role they have.
insert into public.profile_roles (profile_id, role, granted_at)
select id, role, created_at from public.profiles
on conflict do nothing;

-- Only member + provider together; every other role stands alone.
create or replace function public.guard_profile_roles()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if exists (
    select 1 from public.profile_roles r
    where r.profile_id = new.profile_id
      and r.role <> new.role
      and not (r.role in ('member', 'provider') and new.role in ('member', 'provider'))
  ) then
    raise exception 'ROLE_PAIR_NOT_ALLOWED';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_profile_roles() from public, anon, authenticated;

drop trigger if exists profile_roles_guard on public.profile_roles;
create trigger profile_roles_guard
  before insert on public.profile_roles
  for each row execute function public.guard_profile_roles();

-- Every new profile holds the role it was made with; whatever path made it
-- (redeem_invite, start_membership, review_staff_request, the seed script).
create or replace function public.profile_holds_its_role()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.profile_roles (profile_id, role) values (new.id, new.role)
    on conflict do nothing;
  elsif new.role is distinct from old.role then
    -- Switching (switch_role) only ever moves between roles already given.
    -- A change to a role the account does not hold is a re-designation by
    -- whoever runs the database directly (promoting a case manager to super
    -- admin, 0033): the old role is replaced by the new, and the pair guard
    -- still refuses a combination that is not member + provider.
    if not exists (
      select 1 from public.profile_roles where profile_id = new.id and role = new.role
    ) then
      delete from public.profile_roles where profile_id = new.id and role = old.role;
      insert into public.profile_roles (profile_id, role) values (new.id, new.role);
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.profile_holds_its_role() from public, anon, authenticated;

drop trigger if exists profiles_hold_role_ins on public.profiles;
create trigger profiles_hold_role_ins
  after insert on public.profiles
  for each row execute function public.profile_holds_its_role();

drop trigger if exists profiles_hold_role_upd on public.profiles;
create trigger profiles_hold_role_upd
  before update of role on public.profiles
  for each row execute function public.profile_holds_its_role();

-- ---------------------------------------------------------------------------
-- 2. Helpers: "is", whatever the person is acting as.

create or replace function public.has_role(p_person uuid, p_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.profile_roles where profile_id = p_person and role = p_role
  );
$$;

revoke all on function public.has_role(uuid, public.user_role) from public, anon;
grant execute on function public.has_role(uuid, public.user_role) to authenticated;

create or replace function public.is_staff_at(p_person uuid, p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p_org is not null and exists (
    select 1
    from public.profiles p
    join public.profile_roles r on r.profile_id = p.id and r.role = 'provider'
    where p.id = p_person and p.org_id = p_org
  );
$$;

revoke all on function public.is_staff_at(uuid, uuid) from public, anon;
grant execute on function public.is_staff_at(uuid, uuid) to authenticated;

-- Acting as a member, there is no program to act for.
create or replace function public.my_org()
returns uuid
language sql
stable
security definer
set search_path = public, extensions
as $$
  select org_id from public.profiles where id = auth.uid() and role <> 'member';
$$;

-- ---------------------------------------------------------------------------
-- 3. Switching.

create or replace function public.switch_role(p_role public.user_role)
returns public.profiles
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller  uuid := auth.uid();
  updated public.profiles;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if not public.has_role(caller, p_role) then
    raise exception 'ROLE_NOT_GIVEN';
  end if;

  update public.profiles set role = p_role where id = caller
  returning * into updated;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'role.switch', 'profile', caller, jsonb_build_object('role', p_role));

  return updated;
end;
$$;

comment on function public.switch_role is
  'Use Pam as another role this account was given (0078, D-374). Only the '
  'caller, only to a role in profile_roles.';

revoke all on function public.switch_role(public.user_role) from public, anon;
grant execute on function public.switch_role(public.user_role) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Never a member of their own program (Will: no booking their own
--    program). Enrollments and appointments are what every program list is
--    built from, so this is also what keeps them out of those lists.

create or replace function public.guard_not_own_program()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.services where id = new.service_id;
  if public.is_staff_at(new.member_id, v_org) then
    raise exception 'OWN_PROGRAM';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_not_own_program() from public, anon, authenticated;

drop trigger if exists enrollments_not_own_program on public.enrollments;
create trigger enrollments_not_own_program
  before insert or update of member_id, service_id on public.enrollments
  for each row execute function public.guard_not_own_program();

drop trigger if exists appointments_not_own_program on public.appointments;
create trigger appointments_not_own_program
  before insert or update of member_id, service_id on public.appointments
  for each row execute function public.guard_not_own_program();

-- And the other way round: somebody already a member of a program cannot be
-- made staff of it while that link stands. Program setup has to end the
-- member side's enrollment or appointment there first, so nothing quietly
-- shows a staffer's member side to their own program.
create or replace function public.guard_staff_not_member_there()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.org_id is not null
     and new.org_id is distinct from old.org_id
     and public.has_role(new.id, 'member')
     and (
       exists (
         select 1 from public.enrollments e join public.services s on s.id = e.service_id
         where e.member_id = new.id and s.org_id = new.org_id
       )
       or exists (
         select 1 from public.appointments a join public.services s on s.id = a.service_id
         where a.member_id = new.id and s.org_id = new.org_id and a.status = 'scheduled'
       )
     ) then
    raise exception 'OWN_PROGRAM';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_staff_not_member_there() from public, anon, authenticated;

drop trigger if exists profiles_staff_not_member_there on public.profiles;
create trigger profiles_staff_not_member_there
  before update of org_id on public.profiles
  for each row execute function public.guard_staff_not_member_there();

-- ---------------------------------------------------------------------------
-- 5. The functions that mean "is", not "acting as".

-- A program's or case manager's view of members' activity: a member is a
-- member whichever role they are using Pam as right now.
create or replace function public.people_activity()
returns table (profile_id uuid, last_saved_at timestamptz)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select sp.member_id, max(sp.saved_at)
  from public.saved_places sp
  where auth.uid() is not null
    and public.has_role(sp.member_id, 'member')
    and public.my_role() in ('admin', 'provider')
    and public.can_message(auth.uid(), sp.member_id)
    -- Never their own program's member list (D-374).
    and not public.is_staff_at(sp.member_id, public.my_org())
  group by sp.member_id;
$$;

-- Points are a member mechanic (§8): earned by anybody who is a member.
create or replace function public.award_points_for_save()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.has_role(new.member_id, 'member') then
    return new;
  end if;

  insert into public.points_ledger (member_id, delta, reason, subject_id)
  values (new.member_id, 5, 'save_place', new.service_id)
  on conflict (member_id, reason, subject_id) where subject_id is not null
  do nothing;

  return new;
end;
$$;

create or replace function public.award_points_for_finishing_setup()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.onboarded_at is null or old.onboarded_at is not null then
    return new;
  end if;

  if not public.has_role(new.id, 'member') then
    return new;
  end if;

  insert into public.points_ledger (member_id, delta, reason)
  values (new.id, 25, 'finish_setup')
  on conflict (member_id) where reason = 'finish_setup' do nothing;

  return new;
end;
$$;

-- Who may message whom: staff at a program are staff whatever they are
-- acting as; a member is a member.
create or replace function public.can_message(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a is not null and b is not null and a <> b
  and not exists (
    select 1 from public.blocks k
    where (k.blocker_id = a and k.blocked_id = b) or (k.blocker_id = b and k.blocked_id = a)
  )
  and (
    -- case manager <-> assigned member, either way round
    exists (
      select 1 from public.admin_assignments x
      where x.ended_at is null
        and ((x.admin_id = a and x.member_id = b) or (x.admin_id = b and x.member_id = a))
    )
    -- program admin <-> member enrolled in their org's service, either way round
    or exists (
      select 1
      from public.enrollments e
      join public.services s on s.id = e.service_id
      join public.profiles staff on staff.org_id = s.org_id
      join public.profile_roles sr on sr.profile_id = staff.id and sr.role = 'provider'
      where s.org_id is not null
        and ((staff.id = a and e.member_id = b) or (staff.id = b and e.member_id = a))
    )
    -- the person running PAM <-> a case manager or a program lead, either
    -- way round (0072, D-262). Never a member: that line does not move.
    or (
      (public.has_role(a, 'super_admin') and (public.has_role(b, 'admin') or public.has_role(b, 'provider')))
      or (public.has_role(b, 'super_admin') and (public.has_role(a, 'admin') or public.has_role(a, 'provider')))
    )
  );
$$;

-- The super admin's Everyone list: filter by what a person is.
create or replace function public.directory_people(p_role text default null)
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
    and (p_role is null or public.has_role(p.id, p_role::public.user_role))
  order by p.role, p.first_name nulls last;
$$;

-- ---------------------------------------------------------------------------
-- 6. Adding the program role to a member's own account.

-- What sign-in learns about a waiting invite (0077) gains `can_add`: the
-- invite is for a program, the account is a member and nothing else, and the
-- invite is for the same city (both roles in one city, Will, 7 October).
drop function if exists public.pending_invite_for_me();

create or replace function public.pending_invite_for_me()
returns table (
  code               text,
  invited_role       public.user_role,
  first_name         text,
  inviter_first_name text,
  has_account        boolean,
  can_add            boolean
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  caller       uuid := auth.uid();
  caller_phone text;
  account      public.profiles;
begin
  if caller is null then
    return;
  end if;

  select public.to_e164(phone) into caller_phone from auth.users where id = caller;
  if caller_phone is null then
    return;
  end if;

  select * into account from public.profiles where id = caller;

  return query
    select i.code, i.role, i.first_name, p.first_name, account.id is not null,
           account.id is not null
             and i.role = 'provider'
             and not public.has_role(caller, 'provider')
             and not exists (
               select 1 from public.profile_roles r where r.profile_id = caller and r.role <> 'member'
             )
             and i.region_id is not distinct from account.region_id
    from public.invites i
    left join public.profiles p on p.id = i.created_by
    where i.phone = caller_phone
      and i.status = 'pending'
      and i.expires_at >= now()
      and (account.id is null or i.role <> 'member')
    order by i.created_at desc
    limit 1;
end;
$$;

comment on function public.pending_invite_for_me is
  'After sign-in (0077, 0078): the newest live invite for the caller''s own '
  'verified phone — code, role, the name it was made for, the inviter''s first '
  'name, whether the number already has an account, and whether this account '
  'can add the invite''s role (a member, a program invite, the same city).';

revoke all on function public.pending_invite_for_me() from public, anon;
grant execute on function public.pending_invite_for_me() to authenticated;

-- Confirmed on the "Add your program to your account?" screen.
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

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'invite.add_role', 'invite', invite.id, jsonb_build_object('role', invite.role));

  return account;
end;
$$;

comment on function public.add_role_from_invite is
  'A member adds a program role to their own account from an invite made for '
  'their number, in their city (0078, D-374). Acting as the program after.';

revoke all on function public.add_role_from_invite(text) from public, anon;
grant execute on function public.add_role_from_invite(text) to authenticated;
