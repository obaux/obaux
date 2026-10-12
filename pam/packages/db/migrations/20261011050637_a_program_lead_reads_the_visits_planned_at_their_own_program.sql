-- A program lead reads the visits planned at their own program (D-526, attendance part A).
--
-- A member plans a visit at a program on Pam (`book_trip`, `book_trip_at_service`);
-- the row is in `appointments`, which a lead may already read for their program
-- (`appointments_provider_select`). What the lead could NOT do is see whose it is:
-- a member's profile is not readable by a program that has no enrollment with
-- them (0007's `shares_program`), so the visits were rows with no name. The
-- lead's Home therefore showed only example visits and the ones they booked for
-- somebody themselves, and there was nothing to check anyone in to.
--
-- This is the one door: `my_program_visits(from, to)` returns, for the CALLER'S OWN
-- program only, each visit that is not cancelled with the member's FIRST NAME and
-- nothing else of theirs (no last name, phone, address or photo), the service they
-- picked, and whether they have been checked in. It is for a program lead with an
-- active account; anybody else gets NOT_A_PROGRAM_LEAD, a lead of another program
-- sees none of this program's, and a place gathered from public lists (no lead on
-- Pam, D-498) has no lead to ask. Wording for members that this is true ("the
-- program sees you are coming") is part D of the plan; until then nothing changes
-- for a member.
--
-- The window is the visits from `p_from` to `p_to`, at most 180 days wide, by
-- default from two weeks ago to two months ahead.
--
-- EXPAND ONLY: one new function.

create or replace function public.my_program_visits(
  p_from timestamptz default null,
  p_to   timestamptz default null
)
returns table (
  appointment_id uuid,
  member_id      uuid,
  first_name     text,
  starts_at      timestamptz,
  ends_at        timestamptz,
  status         public.appointment_status,
  service_name   text,
  checked_in_at  timestamptz
)
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
  select a.id, a.member_id, p.first_name, a.starts_at, a.ends_at, a.status, ps.name, a.checked_in_at
  from public.appointments a
  join public.services s on s.id = a.service_id and s.org_id = org
  join public.profiles p on p.id = a.member_id
  left join public.program_services ps on ps.id = a.program_service_id
  where a.status <> 'cancelled'
    and a.starts_at >= from_at
    and a.starts_at < to_at
  order by a.starts_at;
end;
$$;

revoke all on function public.my_program_visits(timestamptz, timestamptz) from public, anon;
grant execute on function public.my_program_visits(timestamptz, timestamptz) to authenticated;

comment on function public.my_program_visits is
  'The visits planned at the caller''s own program, with the member''s first name only (D-526). Program lead only.';
