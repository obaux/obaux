-- A program lead reads the members it can book a visit for (D-595, a94).
--
-- "Book a visit for a member" listed only the people in the lead's conversations. A program may now book for a member who has written
-- to it, signed up with it (enrolled in one of its services) or planned a visit there (20261017065103), so the list says the same three
-- things. A lead reads no enrollment or appointment row directly (test 65), so this is the one door: it returns each such member
-- once, with their FIRST NAME only, which a program already sees for each of the three (D-541, D-542). Blocked either way: left out.
--
-- EXPAND ONLY: one new function.

create or replace function public.my_program_bookable_members()
returns table (member_id uuid, first_name text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with me as (
    select p.org_id
    from public.profiles p
    where p.id = auth.uid() and p.role = 'provider' and p.access_status = 'active' and p.org_id is not null
  ),
  known as (
    select theirs.profile_id as member_id
    from me
    join public.profiles lead on lead.org_id = me.org_id and lead.role = 'provider' and lead.access_status = 'active'
    join public.conversation_members mine on mine.profile_id = lead.id
    join public.conversation_members theirs on theirs.conversation_id = mine.conversation_id and theirs.profile_id <> lead.id
    union
    select en.member_id
    from me
    join public.services own on own.org_id = me.org_id
    join public.enrollments en on en.service_id = own.id and en.status in ('requested', 'enrolled', 'active', 'completed')
    union
    select ap.member_id
    from me
    join public.services own on own.org_id = me.org_id
    join public.appointments ap on ap.service_id = own.id and ap.status <> 'cancelled'
  )
  select m.id, m.first_name
  from known k
  join public.profiles m on m.id = k.member_id and m.role = 'member' and m.access_status = 'active'
  where not exists (
    select 1
    from me
    join public.profiles staff on staff.org_id = me.org_id and staff.role = 'provider'
    join public.blocks b on (b.blocker_id = m.id and b.blocked_id = staff.id) or (b.blocker_id = staff.id and b.blocked_id = m.id)
  )
  order by m.first_name, m.id;
$$;

revoke all on function public.my_program_bookable_members() from public, anon;
grant execute on function public.my_program_bookable_members() to authenticated;

comment on function public.my_program_bookable_members is
  'The members a program lead may book a visit for: wrote to the program, signed up with it or planned a visit there (D-595). First name only; empty for anybody who is not an active program lead.';
