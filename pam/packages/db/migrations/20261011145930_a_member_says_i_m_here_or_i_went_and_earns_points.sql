-- A member says "I'm here" or "I went" and earns points (D-535, on D-526's attendance).
--
-- People with no guide, and places no lead runs on Pam, still need a way to earn
-- for going. Two doors for the member's OWN visit:
--
-- ## `i_am_here(visit, lat, lon)` — the phone's position, once, on a tap
--
-- Within 150 m of the place's stored location (services.geo), inside the visit
-- window, the visit becomes attended by `geofence` and pays the existing rule
-- `attend_appointment_verified` (100). Further away: NOTHING is written and the
-- answer is `there = false`, so the member can tap again. THE POSITION IS NEVER
-- KEPT: it is used in one comparison and is not written to any table, audit row or
-- message (the audit row says only that a check-in by position happened). The
-- numbers arrive in a POST body, which neither the API gateway nor Postgres logs
-- (checked on the live project, 11 Oct: log_statement = ddl, gateway rows carry no
-- body, pg_stat_statements normalises parameters).
--
-- ## `i_went(visit)` — no position
--
-- For someone who would rather not share where they are, or at a place with no
-- stored location: attended by `sms_reply` (self-reported), the existing rule
-- `attend_appointment_sms` (60). At most 3 of these in any 7 days.
--
-- ## Both
--
-- Own visit only (the appointment's member is the caller); from 2 hours before it
-- starts to 3 hours after it ends; planned at least 2 hours before it starts (so a
-- visit cannot be planned and claimed in one go); never a cancelled one. One award
-- per visit: the ledger's unique index, and an attended visit answers 0 points.
-- A lead's mark does not need the member to have said anything first.
--
-- ## The lead's mark after the member's own
--
-- `check_in_visit` now upgrades a self-reported visit to `provider_checkin` and
-- pays the difference once (40 = 100 - 60), as a `attend_appointment_verified` row
-- (still one per visit). A visit the member's phone already proved (geofence) pays
-- nothing more. `undo_check_in` takes back only the lead's own part: the verified
-- row (100, or 40 after a self-report), leaving the member's self-report standing;
-- it refuses to undo a visit the member marked (NOT_A_PROGRAM_MARK). Re-marking
-- after an undo restores the same amount once.
--
-- Neither the lead nor a guide is ever shown HOW a visit was marked.
--
-- EXPAND ONLY: two new functions, one internal helper, two functions replaced.

create or replace function public.attendance_award_verified(p_visit uuid, p_member uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  back integer;
begin
  insert into public.points_ledger (member_id, delta, reason, subject_id)
  values (p_member, p_amount, 'attend_appointment_verified', p_visit)
  on conflict (member_id, reason, subject_id) where subject_id is not null do nothing;
  if found then
    return p_amount;
  end if;
  select -l.delta into back
  from public.points_ledger l
  where l.member_id = p_member and l.reason = 'attend_appointment_reversed' and l.subject_id = p_visit;
  if back is null then
    return 0;
  end if;
  insert into public.points_ledger (member_id, delta, reason, subject_id)
  values (p_member, back, 'attend_appointment_restored', p_visit)
  on conflict (member_id, reason, subject_id) where subject_id is not null do nothing;
  if found then
    return back;
  end if;
  return 0;
end;
$$;
revoke all on function public.attendance_award_verified(uuid, uuid, integer) from public, anon, authenticated;

-- The member's own visit, in its window, planned ahead: the same guard for both doors.
create or replace function public.own_visit_to_mark(p_appointment_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  visit  public.appointments;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;
  select a.* into visit
  from public.appointments a
  where a.id = p_appointment_id and a.member_id = caller
  for update;
  if visit.id is null then
    raise exception 'VISIT_NOT_FOUND';
  end if;
  if visit.status = 'cancelled' then
    raise exception 'VISIT_CANCELLED';
  end if;
  if now() < visit.starts_at - interval '2 hours'
     or now() > coalesce(visit.ends_at, visit.starts_at + interval '1 hour') + interval '3 hours' then
    raise exception 'OUTSIDE_THE_VISIT_WINDOW';
  end if;
  if visit.created_at > visit.starts_at - interval '2 hours' then
    raise exception 'PLANNED_TOO_LATE';
  end if;
  return visit;
end;
$$;
revoke all on function public.own_visit_to_mark(uuid) from public, anon, authenticated;

create or replace function public.i_am_here(p_appointment_id uuid, p_lat double precision, p_lon double precision)
returns table (appointment_id uuid, there boolean, points integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  visit  public.appointments;
  place  extensions.geography;
  paid   integer := 0;
begin
  if p_lat is null or p_lon is null or p_lat not between -90 and 90 or p_lon not between -180 and 180 then
    raise exception 'BAD_POSITION';
  end if;
  visit := public.own_visit_to_mark(p_appointment_id);
  if visit.status = 'attended' then
    return query select visit.id, true, 0;
    return;
  end if;
  select s.geo into place from public.services s where s.id = visit.service_id;
  if place is null then
    raise exception 'NO_PLACE_LOCATION';
  end if;
  -- The position lives only in this comparison.
  if extensions.st_distance(place, extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326)::extensions.geography) > 150 then
    return query select visit.id, false, 0;
    return;
  end if;
  update public.appointments a
  set status = 'attended', checked_in_at = now(), attendance_method = 'geofence'
  where a.id = visit.id;
  paid := public.attendance_award_verified(visit.id, visit.member_id, 100);
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (visit.member_id, 'visit.i_am_here', 'appointment', visit.id, jsonb_build_object('points', paid));
  return query select visit.id, true, paid;
end;
$$;

create or replace function public.i_went(p_appointment_id uuid)
returns table (appointment_id uuid, points integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  visit public.appointments;
  paid  integer := 0;
begin
  visit := public.own_visit_to_mark(p_appointment_id);
  if visit.status = 'attended' then
    return query select visit.id, 0;
    return;
  end if;
  if (select count(*) from public.points_ledger l
      where l.member_id = visit.member_id and l.reason = 'attend_appointment_sms'
        and l.created_at > now() - interval '7 days') >= 3 then
    raise exception 'SELF_REPORT_LIMIT';
  end if;
  update public.appointments a
  set status = 'attended', checked_in_at = now(), attendance_method = 'sms_reply'
  where a.id = visit.id;
  insert into public.points_ledger (member_id, delta, reason, subject_id)
  values (visit.member_id, 60, 'attend_appointment_sms', visit.id)
  on conflict (member_id, reason, subject_id) where subject_id is not null do nothing;
  if found then
    paid := 60;
  end if;
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (visit.member_id, 'visit.i_went', 'appointment', visit.id, jsonb_build_object('points', paid));
  return query select visit.id, paid;
end;
$$;

revoke all on function public.i_am_here(uuid, double precision, double precision) from public, anon;
revoke all on function public.i_went(uuid) from public, anon;
grant execute on function public.i_am_here(uuid, double precision, double precision) to authenticated;
grant execute on function public.i_went(uuid) to authenticated;

comment on function public.i_am_here is
  'A member says they are at their own visit: within 150 m of the place pays 100; the position is compared and never kept (D-535).';
comment on function public.i_went is
  'A member says they went, without sharing a position: pays 60, at most 3 in 7 days (D-535).';

-- The lead's mark, now aware of a self-report (replaces 20261011051257's).
create or replace function public.check_in_visit(p_appointment_id uuid)
returns table (appointment_id uuid, status public.appointment_status, checked_in_at timestamptz, points integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  org    uuid := public.my_org();
  visit  public.appointments;
  base   integer := 0;
  paid   integer := 0;
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

  select a.* into visit
  from public.appointments a
  join public.services s on s.id = a.service_id and s.org_id = org
  where a.id = p_appointment_id
  for update of a;
  if visit.id is null then
    raise exception 'VISIT_NOT_FOUND';
  end if;
  if visit.status = 'cancelled' then
    raise exception 'VISIT_CANCELLED';
  end if;
  if now() < visit.starts_at - interval '2 hours'
     or now() > coalesce(visit.ends_at, visit.starts_at + interval '1 hour') + interval '14 days' then
    raise exception 'OUTSIDE_THE_VISIT_WINDOW';
  end if;

  -- Not yet attended, or attended on the member's word alone (60): the lead's mark counts (100).
  if visit.status <> 'attended' or visit.attendance_method = 'sms_reply' then
    if exists (
      select 1 from public.points_ledger l
      where l.member_id = visit.member_id and l.reason = 'attend_appointment_sms' and l.subject_id = visit.id
    ) then
      base := 60;
    end if;
    update public.appointments a
    set status = 'attended',
        checked_in_at = coalesce(case when visit.status = 'attended' then visit.checked_in_at end, now()),
        attendance_method = 'provider_checkin'
    where a.id = visit.id
    returning * into visit;
    paid := public.attendance_award_verified(visit.id, visit.member_id, 100 - base);
    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'visit.check_in', 'appointment', visit.id, jsonb_build_object('points', paid));
  end if;

  return query select visit.id, visit.status, visit.checked_in_at, paid;
end;
$$;

create or replace function public.undo_check_in(p_appointment_id uuid)
returns table (appointment_id uuid, status public.appointment_status, checked_in_at timestamptz, points integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  org    uuid := public.my_org();
  visit  public.appointments;
  award  integer;
  taken  integer := 0;
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

  select a.* into visit
  from public.appointments a
  join public.services s on s.id = a.service_id and s.org_id = org
  where a.id = p_appointment_id
  for update of a;
  if visit.id is null then
    raise exception 'VISIT_NOT_FOUND';
  end if;
  if visit.status = 'attended' then
    -- Only the lead's own mark can be taken back: a member's own word or phone is theirs.
    if visit.attendance_method <> 'provider_checkin' then
      raise exception 'NOT_A_PROGRAM_MARK';
    end if;
    if now() > coalesce(visit.ends_at, visit.starts_at + interval '1 hour') + interval '14 days' then
      raise exception 'OUTSIDE_THE_VISIT_WINDOW';
    end if;
    -- The member's self-report, if any, stands.
    if exists (
      select 1 from public.points_ledger l
      where l.member_id = visit.member_id and l.reason = 'attend_appointment_sms' and l.subject_id = visit.id
    ) then
      update public.appointments a set attendance_method = 'sms_reply' where a.id = visit.id returning * into visit;
    else
      update public.appointments a
      set status = 'scheduled', checked_in_at = null, attendance_method = null
      where a.id = visit.id
      returning * into visit;
    end if;

    -- Append-only ledger: a reversing row for the lead's part, once.
    select l.delta into award from public.points_ledger l
    where l.member_id = visit.member_id and l.reason = 'attend_appointment_verified' and l.subject_id = visit.id;
    if award is not null then
      insert into public.points_ledger (member_id, delta, reason, subject_id)
      values (visit.member_id, -award, 'attend_appointment_reversed', visit.id)
      on conflict (member_id, reason, subject_id) where subject_id is not null do nothing;
      if found then
        taken := -award;
      end if;
    end if;

    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'visit.undo_check_in', 'appointment', visit.id, jsonb_build_object('points', taken));
  end if;

  return query select visit.id, visit.status, visit.checked_in_at, taken;
end;
$$;
