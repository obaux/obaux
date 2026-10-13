-- A program lead reads a small card for a member linked to their program (D-542, Will 11 October).
--
-- Will: residents can message programs even before booking, and a program sees a limited profile. Today a lead who taps a
-- real member gets "not found": a member's profile is not readable by a program with no enrollment (0007 `shares_program`),
-- and the narrow door for visits (`my_program_visits`) has no page of its own.
--
-- This is the one door for it: `program_member_card(member)` returns the member's FIRST NAME and the visits planned at the
-- CALLER'S OWN program (as `my_program_visits` shows them), and nothing else: no last name, phone, address, photo, points,
-- last active, other programs' visits or how a visit was marked.
--
-- A member is "linked" to the caller's program when any of these is true:
--   * they are enrolled in one of its services;
--   * they have a visit that is not cancelled at one of its services;
--   * they share a conversation with someone on the program's staff (they wrote to it, or it wrote to them).
-- Anyone else gets MEMBER_NOT_LINKED, a lead of another program gets the same, and so does a person who is not a member.
-- It is for a program lead with an active account; anybody else gets NOT_A_PROGRAM_LEAD.
--
-- EXPAND ONLY: one new function.

create or replace function public.program_member_card(p_member_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  org    uuid := public.my_org();
  name   text;
  linked boolean;
  visits jsonb;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if public.my_role() is distinct from 'provider' or org is null then
    raise exception 'NOT_A_PROGRAM_LEAD';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;

  select p.first_name into name
  from public.profiles p
  where p.id = p_member_id and p.role = 'member' and p.access_status = 'active';
  if not found then
    raise exception 'MEMBER_NOT_LINKED';
  end if;

  select exists (
           select 1 from public.enrollments e join public.services s on s.id = e.service_id
           where e.member_id = p_member_id and s.org_id = org
         )
      or exists (
           select 1 from public.appointments a join public.services s on s.id = a.service_id
           where a.member_id = p_member_id and s.org_id = org and a.status <> 'cancelled'
         )
      or exists (
           select 1
           from public.conversation_members mine
           join public.conversation_members theirs on theirs.conversation_id = mine.conversation_id
           join public.profiles staff on staff.id = theirs.profile_id
           where mine.profile_id = p_member_id and staff.org_id = org and staff.role = 'provider'
         )
    into linked;
  if not linked then
    raise exception 'MEMBER_NOT_LINKED';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'appointment_id', a.id,
           'starts_at', a.starts_at,
           'ends_at', a.ends_at,
           'status', a.status,
           'service_name', ps.name,
           'checked_in_at', a.checked_in_at
         ) order by a.starts_at), '[]'::jsonb)
    into visits
  from public.appointments a
  join public.services s on s.id = a.service_id and s.org_id = org
  left join public.program_services ps on ps.id = a.program_service_id
  where a.member_id = p_member_id and a.status <> 'cancelled';

  return jsonb_build_object('member_id', p_member_id, 'first_name', name, 'visits', visits);
end;
$$;

revoke all on function public.program_member_card(uuid) from public, anon;
grant execute on function public.program_member_card(uuid) to authenticated;

comment on function public.program_member_card is
  'A member''s first name and the visits planned at the caller''s own program, for a member linked to it (D-542). Program lead only; nothing else of the member.';
