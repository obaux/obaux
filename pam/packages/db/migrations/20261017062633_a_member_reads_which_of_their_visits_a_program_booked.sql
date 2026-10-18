-- A member reads which of their visits a program booked (D-595, a94).
--
-- `my_trips()` keeps its shape (changing a function's result is a DROP, D-387), as it did for the service a trip is for
-- (`my_trip_services`, D-470). So a second small read says, for the caller's own visits, which ones a program booked for them:
-- the Trips card then says "Booked for you by {place}". It answers only for the caller; it names no person.
--
-- EXPAND ONLY: one new function.

create or replace function public.my_trip_booked_by()
returns table (appointment_id uuid)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a.id
  from public.appointments a
  where a.member_id = auth.uid()
    and a.booked_by_org is not null
    and a.status in ('scheduled', 'attended', 'missed');
$$;

revoke all on function public.my_trip_booked_by() from public, anon;
grant execute on function public.my_trip_booked_by() to authenticated;

comment on function public.my_trip_booked_by is
  'The ids of the caller''s own visits that a program booked for them (D-595). Nothing about who.';
