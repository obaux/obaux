-- pam_conversations_have_a_limit_and_an_after_hours_reply — the send limit, the reopening, the audit and Pam's out-of-hours reply
-- (D-605, D-606).
--
-- Claimed 2026-10-18 07:30:13 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
-- Runs after `a_message_to_pam_rings_the_right_bell`.
--
-- EXPAND: two triggers on `messages`, each doing nothing unless the conversation is a support one.
--
--   Before a message is written (the limit). Only the PERSON's side is limited: 30 messages an hour, 150 a day, 10 photos an
--   hour (Mira, 18 October: "a limit nobody normal reaches, the same for everyone"; a limited account has no lower limit than
--   anyone else, Will: "no limit there"). Pam's replies, the welcome, the out-of-hours reply and the team writing first are
--   never limited. A message over the limit is refused with the message PAM_RATE_LIMITED, which the app turns into a calm line
--   and keeps the draft.
--
--   After a message is written:
--     * the person writes: the conversation is open again (a closed one reopens); and if Pam is not here (`pam_hours`), and no
--       out-of-hours reply has gone since Pam last closed, one goes: a system message `pam.away` carrying when Pam is next
--       here. One per stretch of closed hours, not one per message.
--     * the team writes: an audit row, `pam.reply` (actor the person on the team, target the person), because the person sees
--       "Pam" and the team needs to know who. No text of the message is in it.

create or replace function public.pam_before_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_asker uuid;
  v_hour integer;
  v_day integer;
  v_photos integer;
begin
  if new.sender_id is null or not public.is_support_conversation(new.conversation_id) then
    return new;
  end if;
  select t.asker_id into v_asker from public.pam_threads t where t.conversation_id = new.conversation_id;
  if v_asker is null or new.sender_id <> v_asker then
    return new;                                    -- the team and the system are not limited
  end if;

  select count(*) filter (where m.created_at > now() - interval '1 hour'),
         count(*),
         count(*) filter (where m.created_at > now() - interval '1 hour' and m.attachment_kind = 'photo')
    into v_hour, v_day, v_photos
  from public.messages m
  where m.conversation_id = new.conversation_id and m.sender_id = v_asker and m.created_at > now() - interval '1 day';

  if v_hour >= 30 or v_day >= 150 or (new.attachment_kind = 'photo' and v_photos >= 10) then
    raise exception 'PAM_RATE_LIMITED';
  end if;
  return new;
end;
$$;

revoke all on function public.pam_before_message() from public, anon, authenticated;

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
            jsonb_build_object('opensAt', public.pam_next_open(now())));
    update public.pam_threads set last_auto_reply_at = now() where conversation_id = new.conversation_id;
  end if;
  return new;
end;
$$;

revoke all on function public.pam_after_message() from public, anon, authenticated;

create or replace trigger messages_pam_before
  before insert on public.messages
  for each row execute function public.pam_before_message();

create or replace trigger messages_pam_after
  after insert on public.messages
  for each row execute function public.pam_after_message();
