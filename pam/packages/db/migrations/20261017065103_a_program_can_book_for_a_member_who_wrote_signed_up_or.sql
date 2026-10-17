-- A program can book for a member who wrote, signed up or planned a visit there (D-595, a94).
--
-- Mira, 17 October 06:45: Will's option A as written. 20261017062632 allowed only a member who had written to the program; the Privacy
-- paragraph on card a94 says "wrote to, signed up with, or planned a visit there". This replaces the function with the member check
-- widened to those three. Everything else (the place, blocks, the time, the 3-a-day and 30-a-day limits, no points, the bell notice
-- and no text) is as it was.
--
-- EXPAND ONLY: the same function, a wider door. Nothing that worked before is refused.

create or replace function public.book_visit_for_member(
  p_member_id          uuid,
  p_service_id         uuid,
  p_starts_at          timestamptz,
  p_program_service_id uuid default null,
  p_timezone           text default 'America/New_York'
)
returns public.appointments
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller       uuid := auth.uid();
  org          uuid := public.my_org();
  svc          public.services;
  visit        public.appointments;
  zone         text := p_timezone;
  day_start    timestamptz;
  booked_today integer;
  for_member   integer;
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
  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'TRIP_IN_THE_PAST';
  end if;
  if p_starts_at > now() + interval '180 days' then
    raise exception 'TRIP_TOO_FAR';
  end if;
  if zone is null or not exists (select 1 from pg_timezone_names where name = zone) then
    zone := 'America/New_York';
  end if;

  -- One of this organisation's own places, live and approved: never somebody else's, whatever id is passed.
  select * into svc
  from public.services s
  where s.id = p_service_id and s.org_id = org and s.is_active and not s.needs_review and s.removed_at is null;
  if svc.id is null then
    raise exception 'PLACE_NOT_FOUND';
  end if;
  if p_program_service_id is not null and not exists (
    select 1 from public.program_services ps where ps.id = p_program_service_id and ps.service_id = svc.id
  ) then
    raise exception 'SERVICE_NOT_FOUND';
  end if;

  -- The member: an active member this program may already see (Will's option A, 17 October; Mira, 06:11): one who has written to
  -- it (a conversation with a lead of this organisation), signed up with it (enrolled in one of its services) or planned a visit
  -- there. Not one who has done none of those. The same message for every way of not qualifying, so a lead cannot probe who has
  -- an account.
  if not exists (
    select 1 from public.profiles m
    where m.id = p_member_id and m.role = 'member' and m.access_status = 'active'
  ) or not (
    exists (
      select 1
      from public.conversation_members mine
      join public.conversation_members theirs on theirs.conversation_id = mine.conversation_id
      join public.profiles staff on staff.id = theirs.profile_id
      where mine.profile_id = p_member_id and staff.org_id = org and staff.role = 'provider' and staff.access_status = 'active'
    )
    or exists (
      select 1 from public.enrollments en
      join public.services own on own.id = en.service_id and own.org_id = org
      where en.member_id = p_member_id and en.status in ('requested', 'enrolled', 'active', 'completed')
    )
    or exists (
      select 1 from public.appointments ap
      join public.services own on own.id = ap.service_id and own.org_id = org
      where ap.member_id = p_member_id and ap.status <> 'cancelled'
    )
  ) then
    raise exception 'MEMBER_NOT_LINKED';
  end if;
  -- Nobody has blocked anybody: the member and any lead of this organisation, either way round.
  if exists (
    select 1
    from public.blocks k
    join public.profiles staff on staff.org_id = org and staff.role = 'provider'
    where (k.blocker_id = p_member_id and k.blocked_id = staff.id)
       or (k.blocker_id = staff.id and k.blocked_id = p_member_id)
  ) then
    raise exception 'MEMBER_NOT_LINKED';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.member_id = p_member_id and a.service_id = svc.id and a.status <> 'cancelled'
      and a.starts_at > p_starts_at - interval '1 hour' and a.starts_at < p_starts_at + interval '1 hour'
  ) then
    raise exception 'ALREADY_BOOKED';
  end if;

  -- A small daily limit, for the member and for the program, counted by the member's day.
  day_start := date_trunc('day', now() at time zone zone) at time zone zone;
  select count(*) into booked_today
  from public.appointments a where a.booked_by_org = org and a.created_at >= day_start;
  select count(*) into for_member
  from public.appointments a where a.booked_by_org = org and a.member_id = p_member_id and a.created_at >= day_start;
  if for_member >= 3 or booked_today >= 30 then
    raise exception 'RATE_LIMIT';
  end if;

  insert into public.appointments
    (member_id, service_id, program_service_id, starts_at, timezone, location_text, geo, status, booked_by_org)
  values (p_member_id, svc.id, p_program_service_id, p_starts_at, zone, svc.address, svc.geo, 'scheduled', org)
  returning * into visit;

  -- Who, for the record: the audit log, which only the Pam team reads. About the MEMBER (target_type profile, their id), so the
  -- nightly purge that removes what names an erased account (D-443, `purge_erased_audit`) removes this too, six months after.
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'visit.booked_for_member', 'profile', p_member_id,
          jsonb_build_object('appointment', visit.id, 'service', svc.id));

  -- The bell, never a text: a key and the place and the time, nothing anybody typed.
  perform public.notify(
    array[p_member_id], 'visit_booked_for_you', 'notify.visit_booked_for_you', 'appointment', visit.id,
    jsonb_build_object('place', svc.name, 'placeId', svc.id, 'startsAt', visit.starts_at)
  );

  return visit;
end;
$$;

revoke all on function public.book_visit_for_member(uuid, uuid, timestamptz, uuid, text) from public, anon;
grant execute on function public.book_visit_for_member(uuid, uuid, timestamptz, uuid, text) to authenticated;

comment on function public.book_visit_for_member is
  'A program lead books a visit at one of their own places for a member who has written to the program, signed up with it or planned a visit there (D-595). No points, a '
  'bell notice and no text. Refuses everything else with one of NOT_A_PROGRAM_LEAD, ACCOUNT_NOT_ACTIVE, PLACE_NOT_FOUND, '
  'SERVICE_NOT_FOUND, MEMBER_NOT_LINKED, TRIP_IN_THE_PAST, TRIP_TOO_FAR, ALREADY_BOOKED or RATE_LIMIT.';
