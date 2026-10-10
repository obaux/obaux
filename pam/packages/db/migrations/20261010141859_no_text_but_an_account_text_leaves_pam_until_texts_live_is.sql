-- No text but an account text leaves Pam until `texts_live` is on (D-481, the merge desk for
-- Will, 10 October 2026). Expand only.
--
-- Nothing may be texted to a member, a case manager or a program before Will says go and the
-- carrier filing is approved: sending ahead of approval is how a campaign gets suspended. Two
-- accounts already say yes to texts, trips will save to the account from tonight's deploy, and
-- the dispatcher runs every five minutes, so a day-before reminder could have gone to a test
-- account the day after. This is the server-side lock.
--
-- `app_settings.texts_live`, inserted as 'off' and never overwritten. While it is anything but
-- 'on', `claim_outbound_messages` hands over only the account texts: the sign-in code, a
-- decision on a staff request, the notice that parts of the app are off, and the two
-- invitations (the list in 20261010072848). Every reminder and alert stays scheduled, not
-- cancelled; the claim's other rules (STOP, never agreed, a visit that has begun, 12 hours late)
-- still run, so a stale one is cancelled rather than sent when the switch goes on.
--
-- Same signature as 20261010130754; the body is that one with one more condition on what is due.
-- To open texting: update public.app_settings set value = 'on' where key = 'texts_live';
-- To stop it again at once: set it back to 'off'.

insert into public.app_settings (key, value, description) values
  ('texts_live', 'off',
   'Whether reminders and alerts may be texted. Only ''on'' opens it (D-481); until then the dispatcher '
   'is handed account texts only. Set by the merge desk on the day Will says go.')
on conflict (key) do nothing;

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
      -- Until Will says go, only the account texts leave Pam (D-481).
      and (
        coalesce((select s.value from public.app_settings s where s.key = 'texts_live'), 'off') = 'on'
        or o.template_key = any (array[
          'verify_code', 'staff_request_approved', 'staff_request_denied',
          'access_limited_notice', 'invite_member', 'invite_provider'
        ])
      )
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
  'cancelled rather than sent (D-475). Until app_settings.texts_live is ''on'' only the '
  'account texts are handed over; everything else stays scheduled (D-481). A phone-only row (0055, denied staff '
  'requests only) skips quiet hours and consent, by instruction, and is claimed '
  'as soon as it is due.';

revoke all on function public.claim_outbound_messages(integer) from public, anon, authenticated;
