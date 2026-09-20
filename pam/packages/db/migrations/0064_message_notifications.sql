-- 0064 — A new message lights the bell, and nothing else.
--
-- Will's messenger brief: unread messages should show in the app — the Home
-- tile and the bell — and never as a text message. The bell already reads
-- `notifications` (0038), so a message becomes one more kind of row there,
-- written by a trigger the same way a flag or a report is (0038's
-- `notify_on_*` pattern): nothing depends on a screen remembering to do it.
--
-- What the row carries: `notify.message_received` and the sender's first
-- name. Never the message body — `body_key` + `body_vars` is a locale key and
-- variables by design (0038), so a notification cannot quote anybody, and the
-- text lives only where `messages_select_conversation_member` allows.
--
-- Who gets it: every other member of the conversation. Not the sender, not a
-- case manager who is not in it (D-074 — they hear about a message only when
-- somebody reports it, through `notify_on_report`, untouched).
--
-- No SMS: `notify()` writes to `notifications` only. The SMS queue
-- (`outbound_messages`, 0035) is written by `queue_saved_place_closed` and
-- the staff-request functions and by nothing here — checked, not assumed.

alter table public.notifications drop constraint if exists notifications_kind_known;
alter table public.notifications add constraint notifications_kind_known check (
  kind in (
    'service_flagged', 'service_removed', 'message_reported',
    'staff_request_pending', 'message_received'
  )
);

create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_recipients uuid[];
  v_sender_name text;
begin
  select coalesce(array_agg(m.profile_id), '{}') into v_recipients
  from public.conversation_members m
  where m.conversation_id = new.conversation_id
    and m.profile_id <> new.sender_id;

  select first_name into v_sender_name from public.profiles where id = new.sender_id;

  perform public.notify(
    v_recipients,
    'message_received',
    'notify.message_received',
    'conversation', new.conversation_id,
    jsonb_build_object('name', coalesce(v_sender_name, ''))
  );
  return new;
end;
$$;

-- A trigger body is not an endpoint (0041, 0058).
revoke all on function public.notify_on_message() from public, anon, authenticated;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_on_message();
