-- The out-of-hours reply carries the hours that were in force when it was sent (Iris P3; Mira, 18 October).
--
-- `system_vars` held only `{opensAt}`, so the thread drew "Pam is here {hours}" from TODAY's hours: after the hours changed, an
-- earlier reply quietly told the person something that was no longer what it said then. Now `system_vars` also carries
-- `hours: {tz, days, open, close}`, and the app draws those when they are there and today's for the replies sent before this.
--
-- Only the function is restated (create or replace); the trigger and its grants stay as they were.

create or replace function public.pam_after_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_asker uuid;
  v_last_reply timestamptz;
begin
  if new.sender_id is null or not public.is_support_conversation(new.conversation_id) then
    return new;
  end if;
  select t.asker_id, t.last_auto_reply_at into v_asker, v_last_reply
  from public.pam_threads t where t.conversation_id = new.conversation_id;
  if v_asker is null then
    return new;
  end if;

  if new.sender_id <> v_asker then
    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (new.sender_id, 'pam.reply', 'profile', v_asker, '{}'::jsonb);
    return new;
  end if;

  update public.pam_threads set status = 'open' where conversation_id = new.conversation_id and status <> 'open';

  if not public.pam_is_open(now())
     and (v_last_reply is null or v_last_reply < coalesce(public.pam_last_close(now()), '-infinity'::timestamptz)) then
    insert into public.messages (conversation_id, sender_id, body, system_key, system_vars)
    values (new.conversation_id, null, '', 'pam.away',
            jsonb_build_object(
              'opensAt', public.pam_next_open(now()),
              -- The hours in force right now, so the reply keeps saying what was true when it was sent, even after the hours change.
              'hours', (select jsonb_build_object('tz', c.tz, 'days', to_jsonb(c.days), 'open', to_char(c.opens, 'HH24:MI'), 'close', to_char(c.closes, 'HH24:MI'))
                        from public.pam_hours_config() c)));
    update public.pam_threads set last_auto_reply_at = now() where conversation_id = new.conversation_id;
  end if;
  return new;
end;
$$;

