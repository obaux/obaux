-- A program lead checks a member in, and can take it back (D-526, attendance part B).
--
-- Check-ins lived only in the lead's browser session (`apps/web/src/lib/checkIns.ts`
-- said so: "nothing writes them yet"), and `appointments` has had `status`,
-- `checked_in_at` and `attendance_method` since 0004 but no door writes them
-- (writes are revoked since D-454). Pam's privacy page promises it keeps "whether
-- you went", so this makes it so.
--
-- ## `check_in_visit(appointment)` — the lead's "here"
--
-- Only a program lead with an active account, and only for a visit at a service of
-- THEIR OWN program: another program's lead, a member (not even for their own
-- visit), a guide, a super admin and anon are refused. That also means a place with
-- no lead on Pam (D-498) cannot have anyone checked in: there is nobody to do it.
-- It works from two hours before the visit starts until 14 days after it ends, on a
-- visit that is scheduled or was marked missed (part C), never a cancelled one.
-- It sets status `attended`, `checked_in_at` now and `attendance_method`
-- `provider_checkin`, writes an audit row, and pays the member the existing rule
-- `attend_appointment_verified` (POINTS_RULES: 100 points): ONCE PER VISIT (the
-- ledger's unique index on member, reason and subject).
--
-- ## `undo_check_in(appointment)` — a mistaken tap
--
-- The same lead, within the same 14 days, puts the visit back to scheduled and
-- clears the check-in. The ledger is append-only (SOP §8), so the 100 points are
-- taken back by a reversing row, `attend_appointment_reversed`, never by deleting
-- the award; and only once per visit (the same unique index). Checking the same
-- visit in again after a reversal pays `attend_appointment_restored` once; after
-- that the ledger no longer moves for that visit (it has been reversed once and
-- restored once, and a lead flipping a switch cannot farm or strip points).
--
-- Neither function returns anything about the member beyond the visit's own
-- status, the time and the points moved.
--
-- EXPAND ONLY: two new functions.

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

  if visit.status <> 'attended' then
    update public.appointments
    set status = 'attended', checked_in_at = now(), attendance_method = 'provider_checkin'
    where id = visit.id
    returning * into visit;

    -- The points: once per visit; back after a reversal, once.
    insert into public.points_ledger (member_id, delta, reason, subject_id)
    values (visit.member_id, 100, 'attend_appointment_verified', visit.id)
    on conflict (member_id, reason, subject_id) where subject_id is not null do nothing;
    if found then
      paid := 100;
    elsif exists (
      select 1 from public.points_ledger l
      where l.member_id = visit.member_id and l.reason = 'attend_appointment_reversed' and l.subject_id = visit.id
    ) then
      insert into public.points_ledger (member_id, delta, reason, subject_id)
      values (visit.member_id, 100, 'attend_appointment_restored', visit.id)
      on conflict (member_id, reason, subject_id) where subject_id is not null do nothing;
      if found then
        paid := 100;
      end if;
    end if;

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
    if now() > coalesce(visit.ends_at, visit.starts_at + interval '1 hour') + interval '14 days' then
      raise exception 'OUTSIDE_THE_VISIT_WINDOW';
    end if;
    update public.appointments
    set status = 'scheduled', checked_in_at = null, attendance_method = null
    where id = visit.id
    returning * into visit;

    -- Append-only ledger: a reversing row, once.
    if exists (
      select 1 from public.points_ledger l
      where l.member_id = visit.member_id and l.reason = 'attend_appointment_verified' and l.subject_id = visit.id
    ) then
      insert into public.points_ledger (member_id, delta, reason, subject_id)
      values (visit.member_id, -100, 'attend_appointment_reversed', visit.id)
      on conflict (member_id, reason, subject_id) where subject_id is not null do nothing;
      if found then
        taken := -100;
      end if;
    end if;

    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'visit.undo_check_in', 'appointment', visit.id, jsonb_build_object('points', taken));
  end if;

  return query select visit.id, visit.status, visit.checked_in_at, taken;
end;
$$;

revoke all on function public.check_in_visit(uuid) from public, anon;
revoke all on function public.undo_check_in(uuid) from public, anon;
grant execute on function public.check_in_visit(uuid) to authenticated;
grant execute on function public.undo_check_in(uuid) to authenticated;

comment on function public.check_in_visit is
  'A program lead marks a member as here, for a visit at their own program (D-526); pays attend_appointment_verified once per visit.';
comment on function public.undo_check_in is
  'A program lead takes a check-in back within 14 days; the points go by a reversing ledger row, once (D-526).';
