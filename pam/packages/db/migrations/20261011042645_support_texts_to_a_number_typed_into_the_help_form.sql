-- support_texts_to_a_number_typed_into_the_help_form: a super admin can answer a help request by text, and a number that
-- replied STOP is remembered even when no profile has it (D-524). Expand only. Built off: nothing here sends until
-- texts_live is 'on' and the two new templates are signed.
--
-- Claimed 2026-10-11 04:26:45 UTC on `claude/messages-help-request-forward` with `pnpm claim migration`.
--
--   * phone_stops: a hash of a number that texted STOP and has no profile (D-460 point 6 ignored them). START clears it.
--   * phone_hash / phone_is_stopped: the check every support text goes through. A number counts as stopped if it is in
--     phone_stops or a profile with that number has a stop.
--   * record_sms_stop / record_sms_start: now also keep and clear a phone-only stop. Still return false when no profile.
--   * support_texts_log: when, who sent, a hash of the number, the outcome. Never the words, never the number.
--   * send_support_text(phone, words): super admin only; refuses unless texts are on and the number has not stopped;
--     queues the one text straight to the number (a phone-only row, like a denied staff request, 0055).
--   * claim_outbound_messages: the same function as 20261010141859 plus one step: a queued support text whose number has
--     stopped meanwhile is cancelled. Support texts are not account texts, so texts_live still holds them.

create table if not exists public.phone_stops (
  phone_hash text primary key,
  stopped_at timestamptz not null default now()
);
alter table public.phone_stops enable row level security;
alter table public.phone_stops force row level security;
revoke all on public.phone_stops from public, anon, authenticated;
create policy phone_stops_no_client on public.phone_stops for select using (false);

create table if not exists public.support_texts_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  sent_by uuid references public.profiles(id) on delete set null,
  phone_hash text not null,
  outcome text not null
);
alter table public.support_texts_log enable row level security;
alter table public.support_texts_log force row level security;
revoke all on public.support_texts_log from public, anon, authenticated;
create policy support_texts_log_no_client on public.support_texts_log for select using (false);

create or replace function public.phone_hash(p_phone text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(extensions.digest(public.to_e164(p_phone), 'sha256'), 'hex');
$$;

create or replace function public.phone_is_stopped(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (select 1 from public.phone_stops s where s.phone_hash = public.phone_hash(p_phone))
      or exists (
        select 1
        from public.profiles p
        join public.notification_preferences np on np.member_id = p.id
        where p.phone = public.to_e164(p_phone) and np.sms_stopped_at is not null
      );
$$;

revoke all on function public.phone_hash(text) from public, anon, authenticated;
revoke all on function public.phone_is_stopped(text) from public, anon, authenticated;
grant execute on function public.phone_hash(text) to service_role;
grant execute on function public.phone_is_stopped(text) to service_role;

create or replace function public.record_sms_stop(p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member uuid;
begin
  select id into v_member from public.profiles where phone = public.to_e164(p_phone);
  if v_member is null then
    -- Nobody in Pam has this number, but it asked to stop (a help request, D-524): remember that.
    if public.to_e164(p_phone) is not null then
      insert into public.phone_stops (phone_hash) values (public.phone_hash(p_phone)) on conflict do nothing;
    end if;
    return false;
  end if;

  insert into public.notification_preferences (member_id, sms_stopped_at)
  values (v_member, now())
  on conflict (member_id) do update
    set sms_stopped_at = coalesce(public.notification_preferences.sms_stopped_at, now()),
        updated_at = now();

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (null, 'sms.stop', 'profile', v_member, '{}'::jsonb);
  return true;
end;
$$;

create or replace function public.record_sms_start(p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member uuid;
  v_changed integer;
begin
  delete from public.phone_stops where phone_hash = public.phone_hash(p_phone);

  select id into v_member from public.profiles where phone = public.to_e164(p_phone);
  if v_member is null then
    return false;
  end if;

  update public.notification_preferences
  set sms_stopped_at = null, updated_at = now()
  where member_id = v_member and sms_stopped_at is not null;
  get diagnostics v_changed = row_count;
  if v_changed = 0 then
    return false;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (null, 'sms.start', 'profile', v_member, '{}'::jsonb);
  return true;
end;
$$;

revoke all on function public.record_sms_stop(text) from public, anon, authenticated;
revoke all on function public.record_sms_start(text) from public, anon, authenticated;
grant execute on function public.record_sms_stop(text) to service_role;
grant execute on function public.record_sms_start(text) to service_role;

-- A super admin's answer to a help request, as one text to the number the person typed. The caller sees why it was refused.
create or replace function public.send_support_text(p_phone text, p_words text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_phone text := public.to_e164(p_phone);
  v_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin can send a support text' using errcode = '42501';
  end if;
  if v_phone is null or length(regexp_replace(v_phone, '\D', '', 'g')) < 10 then
    raise exception 'That is not a phone number';
  end if;
  if p_words is null or btrim(p_words) = '' then
    raise exception 'Write the answer first';
  end if;
  if length(btrim(p_words)) > 120 then
    raise exception 'The answer is too long for one text: 120 characters at most';
  end if;
  if coalesce((select s.value from public.app_settings s where s.key = 'texts_live'), 'off') <> 'on' then
    raise exception 'Pam''s texts are not on yet';
  end if;
  if public.phone_is_stopped(v_phone) then
    raise exception 'That number asked Pam to stop texting';
  end if;

  insert into public.outbound_messages (phone, locale, template_key, vars)
  values (v_phone, 'en', 'support_reply', jsonb_build_object('reply', btrim(p_words)))
  returning id into v_id;

  insert into public.support_texts_log (sent_by, phone_hash, outcome)
  values (auth.uid(), public.phone_hash(v_phone), 'queued');
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (auth.uid(), 'support_text.queue', 'outbound_message', v_id, '{}'::jsonb);
  return v_id;
end;
$$;

revoke all on function public.send_support_text(text, text) from public, anon;
grant execute on function public.send_support_text(text, text) to authenticated;

comment on function public.send_support_text(text, text) is
  'A super admin answers a help request by text (D-524): queues one support_reply to the number, after checking texts are on and '
  'the number has not stopped. Nothing is kept but a log row with a hash of the number. The dispatcher still applies its own checks.';

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

  -- A support text (D-524) to a number that has since replied STOP is cancelled, not sent.
  update public.outbound_messages o
  set status = 'cancelled', failure_reason = 'number stopped texts'
  where o.status = 'scheduled'
    and o.member_id is null
    and o.template_key = any (array['support_reply', 'reply_no_read'])
    and public.phone_is_stopped(o.phone);

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
