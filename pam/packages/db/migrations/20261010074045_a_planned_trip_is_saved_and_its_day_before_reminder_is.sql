-- A planned trip is saved, and its day-before reminder is queued (D-454;
-- Will, 10 October 2026: "Pam is an app that conveniently messages people to
-- make it easy to help them access and get reminded about services").
--
-- What was true before: a trip a member planned lived only in the browser tab.
-- The `appointments` table existed (0004) and nothing wrote to it; the three
-- reminder texts existed and were signed; and nothing connected the two, so the
-- done screen's "We will remind you the day before" had nothing behind it. The
-- dispatcher reads one queue — `outbound_messages` (0039) — and no code or
-- trigger put an appointment's reminder there.
--
-- EXPAND ONLY. Adds two columns, five functions and one trigger. The live app
-- never calls any of them, so nothing it does changes.
--
-- ## Consent lives here, not in the screen
--
-- 0042: reminders are off until somebody asks for them. The dispatcher's claim
-- cancels a queued text for a member whose `sms_enabled` is false or who sent
-- STOP, but it does NOT stop a member with no `notification_preferences` row
-- (never asked) — so a reminder must never be queued for one. `sync_trip_
-- reminder` queues only when the row exists, `sms_enabled` is true and
-- `sms_stopped_at` is null, and cancels a queued text if that stops being true
-- when the trip next changes.

-- ---------------------------------------------------------------------------
-- 1. Somewhere for the member's note, and a way to find a trip's queued text.

alter table public.appointments
  add column if not exists note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass and conname = 'appointments_note_is_short'
  ) then
    alter table public.appointments
      add constraint appointments_note_is_short check (note is null or char_length(note) <= 200);
  end if;
end;
$$;

alter table public.outbound_messages
  add column if not exists appointment_id uuid references public.appointments (id) on delete cascade;

create index if not exists outbound_appointment_idx
  on public.outbound_messages (appointment_id) where appointment_id is not null;

comment on column public.outbound_messages.appointment_id is
  'The visit a reminder is for, so moving or cancelling the visit can re-time '
  'or cancel its text (D-454). Null for every other kind of message.';

-- ---------------------------------------------------------------------------
-- 2. The reminder follows the trip. Runs after a trip is saved, moved or
-- cancelled, and does one of: queue the day-before text, re-time it, or
-- cancel it. Idempotent: running it twice leaves one text.

create or replace function public.sync_trip_reminder()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  has_consent boolean;
  send        timestamptz := new.starts_at - interval '24 hours';
  existing    uuid;
  svc_name    text;
  svc_address text;
  street      text;
  link        text;
  filled      jsonb;
begin
  select (np.sms_enabled and np.sms_stopped_at is null) into has_consent
  from public.notification_preferences np
  where np.member_id = new.member_id;
  has_consent := coalesce(has_consent, false);

  select o.id into existing
  from public.outbound_messages o
  where o.appointment_id = new.id
    and o.template_key = 'appointment_24h'
    and o.status = 'scheduled'
  limit 1;

  if new.status = 'scheduled' and has_consent and send > now() then
    select s.name, s.address into svc_name, svc_address
    from public.services s where s.id = new.service_id;

    -- The street only, short enough for the signed template (34 characters).
    street := left(
      coalesce(
        nullif(btrim(split_part(coalesce(new.location_text, svc_address, ''), ',', 1)), ''),
        svc_name,
        ''
      ),
      34
    );
    -- The Trips screen, where the visit and its directions are one tap away: a
    -- link to one place would not fit the text's 160 characters.
    link := coalesce((select value from public.app_settings where key = 'app_url'), '') || '/trips/';
    filled := jsonb_build_object(
      'time', to_char(new.starts_at at time zone new.timezone, 'FMHH12:MI AM'),
      'address', street,
      'link', link
    );

    if existing is null then
      insert into public.outbound_messages (member_id, template_key, vars, send_at, appointment_id)
      values (new.member_id, 'appointment_24h', filled, send, new.id);
    else
      update public.outbound_messages set send_at = send, vars = filled where id = existing;
    end if;
  elsif existing is not null then
    update public.outbound_messages
    set status = 'cancelled',
        failure_reason = case
          when new.status <> 'scheduled' then 'the visit is no longer planned'
          when not has_consent then 'the member has reminders off'
          else 'the visit is less than a day away'
        end
    where id = existing;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_trip_reminder() from public, anon, authenticated;

create or replace trigger appointments_keep_reminder
  after insert or update of starts_at, status, timezone, location_text on public.appointments
  for each row execute function public.sync_trip_reminder();

-- ---------------------------------------------------------------------------
-- 3. The member's three doors: plan, move, cancel. Each acts on the caller's
-- own trips only, whatever id is passed.

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
  caller uuid := auth.uid();
  svc    public.services;
  trip   public.appointments;
  zone   text := p_timezone;
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

  return trip;
end;
$$;

create or replace function public.move_trip(p_id uuid, p_starts_at timestamptz)
returns public.appointments
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  trip   public.appointments;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;
  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'TRIP_IN_THE_PAST';
  end if;

  update public.appointments
  set starts_at = p_starts_at
  where id = p_id and member_id = caller and status = 'scheduled'
  returning * into trip;
  if trip.id is null then
    raise exception 'TRIP_NOT_FOUND';
  end if;
  return trip;
end;
$$;

create or replace function public.cancel_trip(p_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  trip   public.appointments;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;

  update public.appointments
  set status = 'cancelled'
  where id = p_id and member_id = caller and status = 'scheduled'
  returning * into trip;
  if trip.id is null then
    raise exception 'TRIP_NOT_FOUND';
  end if;
  return trip;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. The member's own trips, with the place's name and where it is. The
-- screens read this one function, so the table's columns can change without
-- touching them (and the place's coordinates, which a plain read returns as an
-- opaque value, arrive as numbers).

create or replace function public.my_trips()
returns table (
  id          uuid,
  service_id  uuid,
  place_name  text,
  category    text,
  address     text,
  lat         double precision,
  lon         double precision,
  starts_at   timestamptz,
  note        text,
  status      text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    a.id,
    a.service_id,
    s.name,
    s.category::text,
    coalesce(a.location_text, s.address),
    extensions.st_y(coalesce(a.geo, s.geo)::extensions.geometry),
    extensions.st_x(coalesce(a.geo, s.geo)::extensions.geometry),
    a.starts_at,
    a.note,
    a.status::text
  from public.appointments a
  left join public.services s on s.id = a.service_id
  where a.member_id = auth.uid()
    and a.status in ('scheduled', 'attended', 'missed')
  order by a.starts_at
  limit 200;
$$;

revoke all on function public.book_trip(uuid, timestamptz, text, text) from public, anon;
revoke all on function public.move_trip(uuid, timestamptz) from public, anon;
revoke all on function public.cancel_trip(uuid) from public, anon;
revoke all on function public.my_trips() from public, anon;
grant execute on function public.book_trip(uuid, timestamptz, text, text) to authenticated;
grant execute on function public.move_trip(uuid, timestamptz) to authenticated;
grant execute on function public.cancel_trip(uuid) to authenticated;
grant execute on function public.my_trips() to authenticated;

comment on function public.book_trip is
  'A member plans a visit to a place (D-454). Saves it, and the appointment '
  'trigger queues the day-before reminder if the member has reminders on.';
