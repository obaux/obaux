-- A STOP or START reply is recorded, by the number it came from (D-460, Will via
-- Mira, 10 October 2026: build the Twilio inbound receiver "so a STOP is actually
-- recorded").
--
-- Twilio already stops texting a number that replied STOP. What Pam never did was
-- learn it: `notification_preferences.sms_stopped_at` was documented as "set by
-- the Twilio STOP webhook" and nothing set it, so the app could not say "Texts are
-- off" and a later START could not bring them back. The `sms-inbound` Edge
-- Function is that webhook; it calls these two, with the service role, after it
-- has checked Twilio's signature. No client role can call either (a person's own
-- client must never be able to write a STOP, or clear one: D-453).
--
-- Both find the person by the verified phone number on their profile (`to_e164`,
-- 0075), which is the one thing a text from a number proves. A number that
-- matches no profile is ignored and answers false (somebody who texted STOP and
-- never joined has nothing in Pam to change, and Twilio has blocked them anyway).
--
--   * `record_sms_stop(phone)` — sets `sms_stopped_at` (keeps the first time if
--     it is already set). A person who never agreed to texts and replies STOP
--     gets a row with `sms_enabled` false and the stop on it.
--   * `record_sms_start(phone)` — clears `sms_stopped_at` and nothing else. It
--     does not turn texts on: `sms_enabled` stays what the person chose, so
--     somebody who agreed, replied STOP and then START is texted again, and
--     somebody who never agreed is not.
--
-- Each leaves a row in the audit log naming the profile and nothing about the
-- number or the message. Expand only: two new functions.

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

comment on function public.record_sms_stop(text) is
  'Called by the sms-inbound function (service role) when Twilio delivers a STOP '
  'reply: sets sms_stopped_at on the profile with that verified number (D-460). '
  'False when no profile has the number.';
comment on function public.record_sms_start(text) is
  'Called by the sms-inbound function (service role) when Twilio delivers a START '
  'reply: clears sms_stopped_at, nothing else (D-460). False when there was no '
  'stop to clear.';

revoke all on function public.record_sms_stop(text) from public, anon, authenticated;
revoke all on function public.record_sms_start(text) from public, anon, authenticated;
grant execute on function public.record_sms_stop(text) to service_role;
grant execute on function public.record_sms_start(text) to service_role;
