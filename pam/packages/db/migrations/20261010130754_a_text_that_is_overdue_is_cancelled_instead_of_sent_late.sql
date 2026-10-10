-- A text that is overdue is cancelled instead of sent late (D-475, the merge
-- desk for Will, 10 October 2026).
--
-- Found by the day-before reminder rehearsal (D-473, known gap 4): nothing
-- stopped a text that had gone overdue — the clock paused, an outage — from
-- going out long after it was any use. A "your visit is tomorrow" text arriving
-- after the visit is worse than none.
--
-- Two rules, both in the claim, the last line before a phone:
--
--   1. A reminder for a visit that has already started is never handed over
--      (`the visit has already started`). The three appointment reminders.
--
--   2. A text that is time-bound and more than 12 hours late is cancelled (`it
--      was more than 12 hours late`). Time spent waiting out the member's own
--      quiet hours does not count: the limit is 12 hours, or an hour more than
--      their quiet window if that is longer, so a long window cannot make every
--      held text stale. The time-bound texts are the sign-in code, the three
--      appointment reminders, the "did you make it" check-in and "you have a new
--      message". Everything else is still true or still useful late — an
--      invitation, a decision on a request, the notice that parts of the app are
--      off, a saved place that closed, someone wanting to connect, a program
--      connecting you, a visit booked or changed for staff, and the gentle
--      follow-up to a missed visit — and is never cancelled for lateness.
--
-- Expand only: `create or replace` with the same signature (0055, as changed by
-- 20261010072848) and two more steps. Nothing else about the function changes.

create or replace function public.claim_outbound_messages(p_limit integer default 50)
returns table (
  id           uuid,
  member_id    uuid,
  phone        text,
  locale       text,
  template_key text,
  vars         jsonb
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.outbound_messages o
  set status = 'cancelled', failure_reason = 'member stopped texts'
  from public.notification_preferences np
  where np.member_id = o.member_id
    and o.status = 'scheduled'
    and (np.sms_stopped_at is not null or np.sms_enabled = false);

  -- Never asked: no row, so neither of the above found them. Only reminders
  -- and notices; the account texts named in 20261010072848 are exempt.
  update public.outbound_messages o
  set status = 'cancelled', failure_reason = 'never agreed to texts'
  where o.status = 'scheduled'
    and o.member_id is not null
    and o.template_key <> all (array[
      'verify_code', 'staff_request_approved', 'staff_request_denied',
      'access_limited_notice', 'invite_member', 'invite_provider'
    ])
    and not exists (
      select 1 from public.notification_preferences np where np.member_id = o.member_id
    );

  -- A reminder for a visit that has begun is of no use to anybody.
  update public.outbound_messages o
  set status = 'cancelled', failure_reason = 'the visit has already started'
  from public.appointments a
  where a.id = o.appointment_id
    and o.status = 'scheduled'
    and o.template_key in ('appointment_24h', 'appointment_2h', 'appointment_morning_of')
    and a.starts_at <= now();

  -- A time-bound text that is far past its time. The member's own quiet hours
  -- are allowed for: the limit is 12 hours, or an hour past their window.
  update public.outbound_messages o
  set status = 'cancelled', failure_reason = 'it was more than 12 hours late'
  where o.status = 'scheduled'
    and o.template_key in (
      'verify_code', 'appointment_24h', 'appointment_2h', 'appointment_morning_of',
      'attendance_check', 'message_waiting'
    )
    and o.send_at < now() - greatest(
      interval '12 hours',
      -- One hour past the member's quiet window (the default, 9 pm to 7 am, is 10 hours).
      make_interval(hours => 1 + coalesce((
        select case when np.quiet_hours_start = np.quiet_hours_end then 0
                    else (np.quiet_hours_end - np.quiet_hours_start + 24) % 24 end
        from public.notification_preferences np
        where np.member_id = o.member_id
      ), 10))
    );

  update public.outbound_messages o
  set status = 'failed', failure_reason = 'no phone number on file'
  from public.profiles p
  where p.id = o.member_id and o.status = 'scheduled' and p.phone is null;

  return query
  with due as (
    select o.id
    from public.outbound_messages o
    where o.status = 'scheduled'
      and o.send_at <= now()
      and (o.member_id is null or not public.in_quiet_hours(o.member_id))
    order by o.send_at
    limit greatest(p_limit, 0)
    for update skip locked
  ),
  claimed as (
    update public.outbound_messages o
    set status = 'sent', sent_at = now()
    from due
    where o.id = due.id
    returning o.id, o.member_id, o.phone, o.locale, o.template_key, o.vars
  )
  select c.id, c.member_id, coalesce(p.phone, c.phone), coalesce(p.preferred_language, c.locale),
         c.template_key, c.vars
  from claimed c
  left join public.profiles p on p.id = c.member_id;
end;
$$;

comment on function public.claim_outbound_messages(integer) is
  'Atomically claims due messages for the dispatcher. A row with a member_id '
  'goes through the full §7.2 quiet-hours/STOP-list check (0039) and, for a '
  'reminder or a notice, must belong to somebody who agreed to texts (D-453); '
  'account texts are exempt. An appointment reminder for a visit that has begun, '
  'and a time-bound text more than 12 hours late (quiet hours allowed for), are '
  'cancelled rather than sent (D-475). A phone-only row (0055, denied staff '
  'requests only) skips quiet hours and consent, by instruction, and is claimed '
  'as soon as it is due.';

revoke all on function public.claim_outbound_messages(integer) from public, anon, authenticated;
