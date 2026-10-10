-- A trip can name the program service it is for (D-313, D-462; D-470).
--
-- A program offers services (GED classes, the computer room — `program_services`,
-- 20261010083715) and a member planning a visit picks one. Until now the pick
-- stayed on the phone: `appointments` had nowhere to keep it, so a trip read
-- back from the database lost which service it was for.
--
-- EXPAND ONLY, and deliberately without touching `book_trip`'s signature.
-- PostgREST resolves a call by the names it is given, so a five-parameter
-- `book_trip` with a default beside the four-parameter one is "ambiguous" for
-- every old caller, and removing the old one is a DROP (a contract step that the
-- live connector hangs on, D-387, and that would leave the deploy window with
-- no function). So instead:
--
--   * `book_trip_at_service(...)` is the new door; it takes the service and holds
--     the whole body (checks, insert, the plan_trip points of 20261010115117).
--   * `book_trip(...)` keeps its signature and result and now just calls it with
--     no service. Every caller that exists today is unchanged.
--   * `my_trip_services()` says which service each of the caller's trips is for,
--     so `my_trips()` (whose result shape cannot change without a DROP) stays.
--
-- When the app calls only the new door, the old `book_trip` can go in its own
-- `-- contract:` migration.

-- ---------------------------------------------------------------------------
-- 1. Somewhere to keep it. Nullable: most trips name none, and a service that
-- is later removed leaves the trip standing (set null), never deleting a visit.

alter table public.appointments
  add column if not exists program_service_id uuid
  references public.program_services (id) on delete set null;

create index if not exists appointments_program_service_idx
  on public.appointments (program_service_id) where program_service_id is not null;

comment on column public.appointments.program_service_id is
  'The service of the program this visit is for, when the member chose one '
  '(D-470). Must belong to the visit''s program; written only by '
  'book_trip_at_service.';

-- ---------------------------------------------------------------------------
-- 2. The new door.

create or replace function public.book_trip_at_service(
  p_service_id         uuid,
  p_starts_at          timestamptz,
  p_program_service_id uuid default null,
  p_note               text default null,
  p_timezone           text default 'America/New_York'
)
returns public.appointments
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller     uuid := auth.uid();
  svc        public.services;
  trip       public.appointments;
  zone       text := p_timezone;
  day_start  timestamptz;
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

  -- A service must be one of this program's own, whatever id is passed.
  if p_program_service_id is not null and not exists (
    select 1 from public.program_services ps
    where ps.id = p_program_service_id and ps.service_id = svc.id
  ) then
    raise exception 'SERVICE_NOT_FOUND';
  end if;

  insert into public.appointments
    (member_id, service_id, program_service_id, starts_at, timezone, location_text, geo, status, note)
  values (
    caller, svc.id, p_program_service_id, p_starts_at, zone, svc.address, svc.geo, 'scheduled',
    left(nullif(btrim(coalesce(p_note, '')), ''), 200)
  )
  returning * into trip;

  -- The points (20261010115117): 25, once per place ever, three a day in the
  -- trip's time zone. Unchanged by naming a service.
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

revoke all on function public.book_trip_at_service(uuid, timestamptz, uuid, text, text) from public, anon;
grant execute on function public.book_trip_at_service(uuid, timestamptz, uuid, text, text) to authenticated;

comment on function public.book_trip_at_service is
  'A member plans a visit to a place, optionally for one of its program''s '
  'services (D-470). Everything book_trip does, plus the service.';

-- ---------------------------------------------------------------------------
-- 3. The old door, same signature and result, now one line.

create or replace function public.book_trip(
  p_service_id uuid,
  p_starts_at  timestamptz,
  p_note       text default null,
  p_timezone   text default 'America/New_York'
)
returns public.appointments
language sql
security definer
set search_path = public, extensions
as $$
  select * from public.book_trip_at_service(p_service_id, p_starts_at, null, p_note, p_timezone);
$$;

revoke all on function public.book_trip(uuid, timestamptz, text, text) from public, anon;
grant execute on function public.book_trip(uuid, timestamptz, text, text) to authenticated;

comment on function public.book_trip is
  'A member plans a visit to a place (D-454): book_trip_at_service with no '
  'service. Kept so callers written before D-470 work unchanged.';

-- ---------------------------------------------------------------------------
-- 4. Which service each of the caller's trips is for.

create or replace function public.my_trip_services()
returns table (
  appointment_id      uuid,
  program_service_id  uuid,
  service_name        text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a.id, ps.id, ps.name
  from public.appointments a
  join public.program_services ps on ps.id = a.program_service_id
  where a.member_id = auth.uid()
    and a.status in ('scheduled', 'attended', 'missed');
$$;

revoke all on function public.my_trip_services() from public, anon;
grant execute on function public.my_trip_services() to authenticated;

comment on function public.my_trip_services is
  'The caller''s own trips that name a program service, with its name (D-470).';
