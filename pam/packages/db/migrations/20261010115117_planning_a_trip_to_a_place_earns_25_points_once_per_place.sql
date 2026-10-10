-- Planning a trip to a place earns 25 points, once per place (Will's
-- delegation to the CTO, 10 October 2026; docs/points-awarding.md rule 4).
--
-- Until now the Points screen listed "plan a trip" as a way to earn and the
-- database paid nothing for it, because trips lived in the browser tab. Since
-- 20261010074045 a planned trip is a row written by `book_trip`, so the award
-- can live where the trip is made.
--
-- EXPAND ONLY. `book_trip` is replaced with the SAME signature and the same
-- result; the only new behaviour is one `points_ledger` row. The live app
-- needs no change to keep working.
--
-- ## The rule
--
--   * 25 points, reason `plan_trip`, `subject_id` = the place's id.
--   * Once per PLACE, ever: the unique index from 0045 does it. Not once per
--     trip: cancelling takes nothing back (docs/points-awarding.md, principle
--     5), so "plan, cancel, plan again" would otherwise pay every time. Moving
--     a trip pays nothing (it does not call this).
--   * At most three a day per member, counted in the trip's own time zone —
--     a second guard, config's `dailyCap: 3`. A fourth new place the same day
--     is still planned and saved; it just pays nothing.
--   * Members only. `book_trip` already refuses anyone else.
--   * Any place pays, program or not: the trip is the habit we want.
--
-- Trips planned before this migration earn nothing retroactively; the ledger
-- is history and nobody is told they missed out.

create or replace function public.book_trip(
  p_service_id uuid,
  p_starts_at  timestamptz,
  p_note       text default null,
  p_timezone   text default 'America/New_York'
)
returns public.appointments
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller    uuid := auth.uid();
  svc       public.services;
  trip      public.appointments;
  zone      text := p_timezone;
  day_start timestamptz;
  paid_today integer;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if public.my_role() is distinct from 'member' then
    raise exception 'NOT_A_MEMBER';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;
  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'TRIP_IN_THE_PAST';
  end if;
  if zone is null or not exists (select 1 from pg_timezone_names where name = zone) then
    zone := 'America/New_York';
  end if;

  select * into svc
  from public.services s
  where s.id = p_service_id and s.is_active and not s.needs_review and s.removed_at is null;
  if svc.id is null then
    raise exception 'PLACE_NOT_FOUND';
  end if;

  insert into public.appointments (member_id, service_id, starts_at, timezone, location_text, geo, status, note)
  values (
    caller, svc.id, p_starts_at, zone, svc.address, svc.geo, 'scheduled',
    left(nullif(btrim(coalesce(p_note, '')), ''), 200)
  )
  returning * into trip;

  -- The points. Today in the trip's own time zone: midnight there, as a moment.
  day_start := date_trunc('day', now() at time zone zone) at time zone zone;
  select count(*) into paid_today
  from public.points_ledger l
  where l.member_id = caller and l.reason = 'plan_trip' and l.created_at >= day_start;

  if paid_today < 3 then
    insert into public.points_ledger (member_id, delta, reason, subject_id)
    values (caller, 25, 'plan_trip', svc.id)
    on conflict (member_id, reason, subject_id) where subject_id is not null
    do nothing;
  end if;

  return trip;
end;
$$;

revoke all on function public.book_trip(uuid, timestamptz, text, text) from public, anon;
grant execute on function public.book_trip(uuid, timestamptz, text, text) to authenticated;

comment on function public.book_trip is
  'A member plans a visit to a place (D-454). Saves it, and the appointment '
  'trigger queues the day-before reminder if the member has reminders on. '
  'Also pays 25 points the first time they plan a trip to that place, up to '
  'three a day (POINTS_RULES.plan_trip); cancelling takes nothing back.';
