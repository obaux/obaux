-- A program lead sees which marks the member made themselves (D-535).
--
-- A member can mark their own visit ("I'm here" by position, "I went" by word). The
-- lead's circle fills for it, and tapping it to undo is refused by the database
-- (`undo_check_in` takes back only the lead's own mark). So the lead's screen needs
-- to know which marks are the member's own, to show them as marked but not by the
-- lead and offer no undo.
--
-- `my_program_own_marks(from, to)` returns the ids of the visits at the caller's
-- own program, in the same window as `my_program_visits`, that the member marked
-- themselves. NOT HOW: position and word are not told apart, and nothing else
-- about the member comes with it. Program lead with an active account only.
--
-- EXPAND ONLY: one new function.

create or replace function public.my_program_own_marks(
  p_from timestamptz default null,
  p_to   timestamptz default null
)
returns setof uuid
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  caller  uuid := auth.uid();
  org     uuid := public.my_org();
  from_at timestamptz := coalesce(p_from, now() - interval '14 days');
  to_at   timestamptz := coalesce(p_to, now() + interval '60 days');
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
  if to_at - from_at > interval '180 days' then
    to_at := from_at + interval '180 days';
  end if;

  return query
  select a.id
  from public.appointments a
  join public.services s on s.id = a.service_id and s.org_id = org
  where a.status = 'attended'
    and a.attendance_method in ('geofence', 'sms_reply')
    and a.starts_at >= from_at
    and a.starts_at < to_at;
end;
$$;

revoke all on function public.my_program_own_marks(timestamptz, timestamptz) from public, anon;
grant execute on function public.my_program_own_marks(timestamptz, timestamptz) to authenticated;

comment on function public.my_program_own_marks is
  'The visits at the caller''s own program that the member marked themselves, by id only; not how (D-535).';
