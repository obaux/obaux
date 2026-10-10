-- The day-before reminder goes out on the day before, for trips planned before
-- texts were turned on, and with the whole place name (D-473, Nico's rehearsal;
-- the CTO's decision of 10 October 2026).
--
-- Three gaps in `sync_trip_reminder` (20261010074045), each found by playing the
-- journey end to end:
--
-- (a) EVENING VISITS. A visit at 21:00 or later has its 24-hour mark inside
--     quiet hours, so the dispatcher held the text to 07:00 on the morning of the
--     visit — where "tomorrow" is wrong. Now the reminder always goes out on the
--     day before the visit, outside the member's quiet hours:
--       * if the 24-hour mark is outside quiet hours: at the mark, as before;
--       * else, at the end of quiet hours, if that is still the day before
--         (a 06:00 visit: 07:00 the day before);
--       * else, five minutes before quiet hours begin that evening (a 21:30 visit:
--         20:55 the evening before);
--       * if no such moment remains (a visit planned under a day ahead): today's
--         rule stands — the mark, which the dispatcher holds to the end of quiet
--         hours, or no text at all if the mark has passed.
--     The member's own quiet hours (`notification_preferences`) and the trip's
--     time zone decide "the day before". NOTE: the dispatcher's own quiet-hours
--     check (`in_quiet_hours`, 0039) still reads New York time; for a trip in
--     another zone the two can disagree. Reported, not changed here.
--
-- (b) TEXTS TURNED ON LATER. A member who turns texts on (or whose STOP is
--     cleared by START) after planning trips got nothing for those trips until
--     each next changed. Now turning them on queues the day-before text for every
--     future scheduled trip, under the same rules — and still never for a trip
--     whose reminder moment has passed. Consent first: only a real turn-on (not
--     on and unstopped before, on and unstopped now).
--
-- (c) PLACE NAMES. The trigger cut the street/name at 34 characters, mid-word
--     ("…Opportunitie"). The full name is passed; the renderer already cuts at a
--     word and the dispatcher's 134/160-character limit still holds.
--
-- EXPAND ONLY: one new function for the moment, the trigger function split in two
-- (same name, same trigger), one new trigger. No columns, no drops.

-- ---------------------------------------------------------------------------
-- 1. Which moment the text goes out (a).

create or replace function public.reminder_moment(
  p_member_id uuid,
  p_starts_at timestamptz,
  p_zone      text
)
returns timestamptz
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  qs         integer;
  qe         integer;
  mark       timestamptz := p_starts_at - interval '24 hours';
  visit_day  date := (p_starts_at at time zone p_zone)::date;
  prev_day   date := (p_starts_at at time zone p_zone)::date - 1;
  local_mark timestamp := (p_starts_at - interval '24 hours') at time zone p_zone;
  quiet_end  timestamptz;
  before_q   timestamptz;
begin
  select np.quiet_hours_start, np.quiet_hours_end into qs, qe
  from public.notification_preferences np where np.member_id = p_member_id;
  qs := coalesce(qs, 21);
  qe := coalesce(qe, 7);

  -- No quiet hours at all, or the mark is outside them: the mark.
  if qs = qe or not public.reminder_is_quiet(local_mark, qs, qe) then
    return mark;
  end if;

  -- The end of quiet hours, if that is still the day before the visit.
  quiet_end := (date_trunc('day', local_mark) + make_interval(hours => qe)
                + case when date_trunc('day', local_mark) + make_interval(hours => qe) <= local_mark
                       then interval '1 day' else interval '0' end) at time zone p_zone;
  if (quiet_end at time zone p_zone)::date = prev_day then
    return quiet_end;
  end if;

  -- Else shortly before quiet hours begin the evening before.
  before_q := (prev_day + make_interval(hours => qs) - interval '5 minutes') at time zone p_zone;
  if (before_q at time zone p_zone)::date = prev_day
     and not public.reminder_is_quiet(before_q at time zone p_zone, qs, qe)
     and before_q > now() then
    return before_q;
  end if;

  -- Nothing allowed remains on the day before: today's rule.
  return mark;
end;
$$;

-- The quiet-hours test on a local clock time, the same rule as `in_quiet_hours`
-- (0039): the window may wrap midnight.
create or replace function public.reminder_is_quiet(p_local timestamp, p_start integer, p_end integer)
returns boolean
language sql
immutable
as $$
  select case
    when p_start = p_end then false
    when p_start < p_end then extract(hour from p_local) >= p_start and extract(hour from p_local) < p_end
    else extract(hour from p_local) >= p_start or extract(hour from p_local) < p_end
  end;
$$;

revoke all on function public.reminder_moment(uuid, timestamptz, text) from public, anon, authenticated;
revoke all on function public.reminder_is_quiet(timestamp, integer, integer) from public, anon, authenticated;

comment on function public.reminder_moment is
  'When the day-before text for a visit should go out: on the day before, '
  'outside the member''s quiet hours where one exists (D-473). See the migration.';

-- ---------------------------------------------------------------------------
-- 2. The one place a trip's text is queued, re-timed or cancelled: the old
-- trigger body, taking a trip, with (a) and (c). Idempotent.

create or replace function public.queue_trip_reminder(trip public.appointments)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  has_consent boolean;
  send        timestamptz;
  existing    uuid;
  svc_name    text;
  svc_address text;
  street      text;
  link        text;
  filled      jsonb;
begin
  select (np.sms_enabled and np.sms_stopped_at is null) into has_consent
  from public.notification_preferences np
  where np.member_id = trip.member_id;
  has_consent := coalesce(has_consent, false);

  send := public.reminder_moment(trip.member_id, trip.starts_at, trip.timezone);

  select o.id into existing
  from public.outbound_messages o
  where o.appointment_id = trip.id
    and o.template_key = 'appointment_24h'
    and o.status = 'scheduled'
  limit 1;

  if trip.status = 'scheduled' and has_consent and send > now() then
    select s.name, s.address into svc_name, svc_address
    from public.services s where s.id = trip.service_id;

    -- The street, or the place's name: whole. The renderer cuts at a word to
    -- fit the signed template; this no longer cuts in the middle of one.
    street := coalesce(
      nullif(btrim(split_part(coalesce(trip.location_text, svc_address, ''), ',', 1)), ''),
      svc_name,
      ''
    );
    link := coalesce((select value from public.app_settings where key = 'app_url'), '') || '/trips/';
    filled := jsonb_build_object(
      'time', to_char(trip.starts_at at time zone trip.timezone, 'FMHH12:MI AM'),
      'address', street,
      'link', link
    );

    if existing is null then
      insert into public.outbound_messages (member_id, template_key, vars, send_at, appointment_id)
      values (trip.member_id, 'appointment_24h', filled, send, trip.id);
    else
      update public.outbound_messages set send_at = send, vars = filled where id = existing;
    end if;
  elsif existing is not null then
    update public.outbound_messages
    set status = 'cancelled',
        failure_reason = case
          when trip.status <> 'scheduled' then 'the visit is no longer planned'
          when not has_consent then 'the member has reminders off'
          else 'the visit is less than a day away'
        end
    where id = existing;
  end if;
end;
$$;

revoke all on function public.queue_trip_reminder(public.appointments) from public, anon, authenticated;

create or replace function public.sync_trip_reminder()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.queue_trip_reminder(new);
  return new;
end;
$$;

revoke all on function public.sync_trip_reminder() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Texts turned on later (b): a real turn-on queues the text for every trip
-- still ahead.

create or replace function public.queue_reminders_when_texts_turn_on()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  was_on boolean := false;
  trip   public.appointments;
begin
  if tg_op = 'UPDATE' then
    was_on := old.sms_enabled and old.sms_stopped_at is null;
  end if;
  if new.sms_enabled and new.sms_stopped_at is null and not was_on then
    for trip in
      select * from public.appointments a
      where a.member_id = new.member_id and a.status = 'scheduled' and a.starts_at > now()
    loop
      perform public.queue_trip_reminder(trip);
    end loop;
  end if;
  return new;
end;
$$;

revoke all on function public.queue_reminders_when_texts_turn_on() from public, anon, authenticated;

create or replace trigger notification_preferences_queue_reminders
  after insert or update of sms_enabled, sms_stopped_at on public.notification_preferences
  for each row execute function public.queue_reminders_when_texts_turn_on();
