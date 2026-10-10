-- Assigning a guide, and handing a member over (D-446). Expand step.
--
-- Since 0082 a case manager reaches a member only through an active
-- `admin_assignments` row, so that row is now the whole of who may read a
-- member's profile, goals, points and badges, and limit or pause them. Until
-- now the only thing that wrote one was redeeming an invite that named a case
-- manager; a member who signed up alone was read by nobody (D-415).
--
-- This adds the ways in, each a SECURITY DEFINER function that checks its
-- caller inside, writes `audit_log`, and keeps history by ending the old row:
--
--   assign_guide(member, guide)   the super admin: any member, any case manager
--                                 (or themselves); null takes the guide away
--   hand_over_member(member, to)  the member's own case manager, to another
--                                 case manager in their city
--   guides_i_can_choose()         who the two pickers list
--   directory_guides()            the super admin's Everyone: who guides whom,
--                                 so "Unassigned" can be shown
--
-- Nothing is removed here. The old policy that let a case manager write their
-- own rows straight from the client goes in the next migration (contract);
-- no release of the app ever wrote that table from the client.
--
-- Will, 10 October 2026: "You decide." What was decided is in D-446: a case
-- manager does not see who is unassigned (that would widen what they see);
-- the super admin assigns. The super admin gains no power to limit someone who
-- is not assigned to them; they can assign the person to themselves first, and
-- are then that person's guide, which is what the privacy policy says.

-- ---------------------------------------------------------------------------
-- The one place a guide is set. Not callable by clients.

create or replace function public.set_guide_internal(
  p_member uuid,
  p_guide  uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller   uuid := auth.uid();
  previous uuid;
begin
  if not public.has_role(p_member, 'member') then
    raise exception 'Only a member can have a guide';
  end if;

  if p_guide is not null then
    if p_guide = p_member then
      raise exception 'A person cannot be their own guide';
    end if;
    if not (public.has_role(p_guide, 'admin') or public.has_role(p_guide, 'super_admin')) then
      raise exception 'A guide must be a case manager';
    end if;
    if exists (select 1 from public.profiles where id = p_guide and access_status = 'suspended') then
      raise exception 'That case manager''s account is paused';
    end if;
  end if;

  select admin_id into previous
    from public.admin_assignments
   where member_id = p_member and ended_at is null
   for update;

  if previous is not distinct from p_guide then
    return;
  end if;

  update public.admin_assignments
     set ended_at = now()
   where member_id = p_member and ended_at is null;

  if p_guide is not null then
    insert into public.admin_assignments (admin_id, member_id) values (p_guide, p_member);
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, p_action, 'profile', p_member,
          jsonb_build_object('from', previous, 'to', p_guide));
end;
$$;

comment on function public.set_guide_internal is
  'Ends the member''s active assignment, starts the new one (or none) and '
  'writes audit_log. Called only by assign_guide and hand_over_member, which '
  'check the caller; not executable by clients (D-446).';

revoke all on function public.set_guide_internal(uuid, uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The super admin assigns, changes or takes away a member's guide.

create or replace function public.assign_guide(p_member uuid, p_guide uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only the Pam team can assign a guide';
  end if;
  perform public.set_guide_internal(p_member, p_guide, 'assignment.set');
end;
$$;

comment on function public.assign_guide is
  'Super admin only. Makes p_guide (a case manager, or the super admin) the '
  'member''s one guide; null leaves the member with none (D-446).';

revoke all on function public.assign_guide(uuid, uuid) from public, anon;
grant execute on function public.assign_guide(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- A case manager hands one of their own members to a colleague in their city.

create or replace function public.hand_over_member(p_member uuid, p_to uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.admin_covers(p_member) then
    raise exception 'That person is not assigned to you';
  end if;
  if p_to is null or p_to = auth.uid() then
    raise exception 'Choose another case manager';
  end if;
  if not exists (
    select 1 from public.guides_i_can_choose() g where g.id = p_to
  ) then
    raise exception 'You can hand someone over only to a case manager in your city';
  end if;
  perform public.set_guide_internal(p_member, p_to, 'assignment.handed_over');
end;
$$;

comment on function public.hand_over_member is
  'The member''s own case manager (admin_covers) makes another case manager '
  'in their city the member''s guide. They lose access as it happens (D-446).';

revoke all on function public.hand_over_member(uuid, uuid) from public, anon;
grant execute on function public.hand_over_member(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Who the pickers list. Staff only, first name and city: no member is in it.
--
-- The super admin: every case manager and every super admin (themselves
-- included), active or limited, in any city. A case manager: the other case
-- managers in their own city. Anyone else: nobody.

create or replace function public.guides_i_can_choose()
returns table (id uuid, first_name text, region_name text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.id, p.first_name, r.name
  from public.profiles p
  left join public.regions r on r.id = p.region_id
  where p.access_status <> 'suspended'
    and (public.has_role(p.id, 'admin') or public.has_role(p.id, 'super_admin'))
    and (
      public.is_super_admin()
      or (
        public.is_admin()
        and p.id <> auth.uid()
        and p.region_id is not null
        and p.region_id = public.my_region()
      )
    )
  order by p.first_name nulls last;
$$;

revoke all on function public.guides_i_can_choose() from public, anon;
grant execute on function public.guides_i_can_choose() to authenticated;

-- ---------------------------------------------------------------------------
-- The super admin's Everyone: each member's guide, so "Unassigned" can be
-- shown. A new thing for the Pam team to see (D-446); no one else can call it
-- usefully — it returns nothing to anybody but the super admin.

create or replace function public.directory_guides()
returns table (member_id uuid, guide_id uuid, guide_first_name text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a.member_id, a.admin_id, g.first_name
  from public.admin_assignments a
  join public.profiles g on g.id = a.admin_id
  where public.is_super_admin() and a.ended_at is null;
$$;

revoke all on function public.directory_guides() from public, anon;
grant execute on function public.directory_guides() to authenticated;
