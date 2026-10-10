-- Text alerts are queued when the thing they say happens (D-478). Expand only.
--
-- Will approved four texts on 10 October 2026 and nothing queued them:
--   message_waiting  "You have a new message in Pam. Open it: {link}"
--   visit_booked     to a program: someone booked a visit
--   booking_changed  to a program: a visit was moved or cancelled
--   trip_planned     to a case manager: someone on their list planned a visit
-- They say that something happened, never what or to whom (no name, place or
-- day), and the words are exactly the signed ones: nothing here writes a word.
--
-- WHO GETS ONE. The person's own Text alerts switches decide, one per kind
-- (consent stays an act, so every switch starts off): four new columns on
-- `notification_preferences`. Turning a switch on also records the yes to texts
-- (`sms_enabled`) in the app, as it always has. On top of that, the existing
-- claim still applies every rule it always did: a yes to texts, no STOP, quiet
-- hours, a phone number. So a switch left on after a STOP sends nothing.
--
-- WHEN. Three new triggers beside the existing ones, each leaving the others
-- alone: a message (beside the bell's `messages_notify`), and a visit planned
-- or changed (beside the reminder's `appointments_keep_reminder`, which is not
-- touched). A visit is booked by a member's `book_trip*`, moved by `move_trip`
-- and cancelled by `cancel_trip`; the trigger sees all of them and any other
-- way a visit is written.
--
-- WHO IS TOLD.
--   * message_waiting: everyone else in the conversation.
--   * visit_booked / booking_changed: the lead of the program (the staff with
--     the same organisation as the place), never the person who made the
--     change, never the member the visit is for.
--   * trip_planned: the member's current case manager (`admin_assignments`).
--
-- ONE TEXT PER CHANGE, NOT PER FIELD OR PER EDIT. A text already waiting for
-- the same person and the same kind covers the next change too, because it says
-- nothing about which one; so six messages overnight are one text at 7 am. A
-- booking changed while its "booked" text is still waiting adds nothing: they
-- will open Pam and see the visit as it is. After a message_waiting text goes,
-- the next is not queued for 30 minutes.
--
-- Late is still useful for the three visit texts and never for a message (the
-- claim's 12-hour rule already lists message_waiting, D-475).

alter table public.notification_preferences
  add column if not exists alert_message boolean not null default false,
  add column if not exists alert_booked  boolean not null default false,
  add column if not exists alert_changed boolean not null default false,
  add column if not exists alert_trip    boolean not null default false;

comment on column public.notification_preferences.alert_message is
  'Text alerts switch: text me when I have a new message (D-478). Starts off; consent is an act.';
comment on column public.notification_preferences.alert_booked is
  'Text alerts switch for a program: text me when someone books a visit (D-478).';
comment on column public.notification_preferences.alert_changed is
  'Text alerts switch for a program: text me when a visit is moved or cancelled (D-478).';
comment on column public.notification_preferences.alert_trip is
  'Text alerts switch for a case manager: text me when someone on my list plans a visit (D-478).';

-- The person writes their own switches, as they write sms_enabled (20261010071947).
grant insert (alert_message, alert_booked, alert_changed, alert_trip)
  on public.notification_preferences to authenticated;
grant update (alert_message, alert_booked, alert_changed, alert_trip)
  on public.notification_preferences to authenticated;

-- ---------------------------------------------------------------------------
-- The one place a text alert is queued

create or replace function public.queue_text_alert(
  p_member   uuid,
  p_template text,
  p_link     text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  switched_on boolean;
begin
  -- Their switch for this kind, and the yes to texts, and no STOP.
  select (np.sms_enabled
          and np.sms_stopped_at is null
          and case p_template
                when 'message_waiting' then np.alert_message
                when 'visit_booked'    then np.alert_booked
                when 'booking_changed' then np.alert_changed
                when 'trip_planned'    then np.alert_trip
                else false
              end)
    into switched_on
  from public.notification_preferences np
  where np.member_id = p_member;
  if not coalesce(switched_on, false) then
    return;
  end if;

  -- One waiting text of a kind covers the next change too.
  if exists (
    select 1 from public.outbound_messages o
    where o.member_id = p_member and o.template_key = p_template and o.status = 'scheduled'
  ) then
    return;
  end if;
  -- A change while "booked" still waits: they will see the visit as it is.
  if p_template = 'booking_changed' and exists (
    select 1 from public.outbound_messages o
    where o.member_id = p_member and o.template_key = 'visit_booked' and o.status = 'scheduled'
  ) then
    return;
  end if;
  -- A message text is not repeated inside half an hour.
  if p_template = 'message_waiting' and exists (
    select 1 from public.outbound_messages o
    where o.member_id = p_member and o.template_key = 'message_waiting'
      and o.status = 'sent' and o.sent_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  insert into public.outbound_messages (member_id, template_key, vars, send_at)
  values (p_member, p_template, jsonb_build_object('link', p_link), now());
end;
$$;

revoke all on function public.queue_text_alert(uuid, text, text) from public, anon, authenticated;

comment on function public.queue_text_alert is
  'Queues one of the four approved text alerts for one person if their switch for it is on and '
  'they have said yes to texts and not replied STOP (D-478). Collapses repeats. Writes no words: '
  'the template is the signed one and the only variable is the link.';

-- ---------------------------------------------------------------------------
-- A message was written

create or replace function public.queue_message_text_alert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  recipient uuid;
  base      text := coalesce((select value from public.app_settings where key = 'app_url'), '');
begin
  for recipient in
    select m.profile_id from public.conversation_members m
    where m.conversation_id = new.conversation_id and m.profile_id <> new.sender_id
  loop
    perform public.queue_text_alert(recipient, 'message_waiting', base || '/messages/');
  end loop;
  return new;
end;
$$;

revoke all on function public.queue_message_text_alert() from public, anon, authenticated;

create or replace trigger messages_queue_text_alert
  after insert on public.messages
  for each row execute function public.queue_message_text_alert();

-- ---------------------------------------------------------------------------
-- A visit was planned, moved or cancelled

create or replace function public.queue_visit_text_alerts()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  base      text := coalesce((select value from public.app_settings where key = 'app_url'), '');
  actor     uuid := auth.uid();
  kind      text;
  recipient uuid;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'scheduled' then
      return new;
    end if;
    kind := 'visit_booked';
    -- A case manager hears that somebody on their list planned a visit.
    select a.admin_id into recipient
    from public.admin_assignments a
    where a.member_id = new.member_id and a.ended_at is null;
    if recipient is not null and recipient is distinct from actor and recipient <> new.member_id then
      perform public.queue_text_alert(recipient, 'trip_planned', base || '/');
    end if;
  elsif new.status = 'scheduled' and new.starts_at is distinct from old.starts_at and old.status = 'scheduled' then
    kind := 'booking_changed';
  elsif new.status = 'cancelled' and old.status = 'scheduled' then
    kind := 'booking_changed';
  else
    return new;
  end if;

  -- The program: its staff, other than whoever made the change and the member themself.
  for recipient in
    select p.id
    from public.services s
    join public.profiles p on p.org_id = s.org_id and p.role = 'provider' and p.access_status = 'active'
    where s.id = new.service_id and s.org_id is not null
      and p.id is distinct from actor and p.id <> new.member_id
  loop
    perform public.queue_text_alert(recipient, kind, base || '/');
  end loop;
  return new;
end;
$$;

revoke all on function public.queue_visit_text_alerts() from public, anon, authenticated;

create or replace trigger appointments_queue_text_alerts
  after insert or update of starts_at, status on public.appointments
  for each row execute function public.queue_visit_text_alerts();
