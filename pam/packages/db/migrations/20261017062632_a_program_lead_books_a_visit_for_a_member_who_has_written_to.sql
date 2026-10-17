-- A program lead books a visit for a member who has written to the program (D-595, a94).
--
-- Until now "Book a visit for a member" ended on an example: the booking was kept in the lead's browser tab and nothing was saved.
-- This is the one door that makes it real, and it is as narrow as the Privacy sentence that goes with it ("a program you have
-- written to"):
--
--   * the caller is an active program lead with an organisation, and the place is one of THAT organisation's own live services;
--   * the member is an active member who has a conversation with a lead of that organisation (they wrote to the program, or the
--     program wrote back: either way there is a conversation, the same list "Book a visit" shows). Not someone who only signed up
--     or planned a visit there, and nobody the organisation has not been in touch with;
--   * nobody has blocked anybody: neither the member nor any lead of the organisation has a block against the other;
--   * the time is ahead, within 180 days, and the member has no other visit at that place within an hour of it;
--   * at most 3 a day for the same member at the same program, and 30 a day for the whole program (day = the member's time zone),
--     so it cannot be used to fill someone's Trips.
--
-- It writes the visit the way `book_trip_at_service` does (the place's address and position, `scheduled`) and sets
-- `booked_by_org`. It pays NO points: planning a trip pays the member who plans one (20261010115117), and a visit somebody else
-- planned is not that; going to it pays as any visit does ("I'm here", "I went"). The day-before reminder trigger queues one only for a
-- member who agreed to reminders, as for any visit, and nothing goes out while `texts_live` is off (D-481). The member gets a bell
-- notice, never a text. Marking stays as it is: the member checks in, or the program does, and a visit nobody marks becomes missed a
-- day after it ends (D-526 C). Nothing a program can write changes what it can read of the member (D-541, D-542).
--
-- EXPAND ONLY: one new function. `appointments` still has no write grant for anyone (test 69).

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

  -- The member: an active member who has a conversation with a lead of this organisation. The same message for every way of
  -- not qualifying, so a lead cannot probe who has an account.
  if not exists (
    select 1 from public.profiles m
    where m.id = p_member_id and m.role = 'member' and m.access_status = 'active'
  ) or not exists (
    select 1
    from public.conversation_members mine
    join public.conversation_members theirs on theirs.conversation_id = mine.conversation_id
    join public.profiles staff on staff.id = theirs.profile_id
    where mine.profile_id = p_member_id and staff.org_id = org and staff.role = 'provider' and staff.access_status = 'active'
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

  -- Who, for the record: the audit log, which only the Pam team reads.
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'visit.booked_for_member', 'appointment', visit.id,
          jsonb_build_object('member', p_member_id, 'service', svc.id));

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
  'A program lead books a visit at one of their own places for a member who has written to the program (D-595). No points, a '
  'bell notice and no text. Refuses everything else with one of NOT_A_PROGRAM_LEAD, ACCOUNT_NOT_ACTIVE, PLACE_NOT_FOUND, '
  'SERVICE_NOT_FOUND, MEMBER_NOT_LINKED, TRIP_IN_THE_PAST, TRIP_TOO_FAR, ALREADY_BOOKED or RATE_LIMIT.';
