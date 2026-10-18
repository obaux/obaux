-- a_message_to_pam_rings_the_right_bell — who is told when a Pam conversation moves (D-605, D-606).
--
-- Claimed 2026-10-18 07:30:11 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
-- Runs after `the_pam_team_inbox_and_starting_a_conversation`.
--
-- EXPAND: two functions restated with one added branch each (same signatures), and one small helper.
--
-- The bell (`notifications`), never a text, and no new kind of notification: a Pam conversation uses `message_received`.
--   * The Pam team writes (a reply, or writing first): the PERSON is told, as "Pam". The name in the notification is the
--     word 'Pam', never the first name of the person on the team who wrote it: nothing a person can read says who answered.
--   * The person writes: every member of the Pam team is told, with the person's first name. A second message while one is
--     still unread adds no second row, so a burst of messages is one bell row, not twenty.
--   * A system message (Pam's welcome, the out-of-hours reply) tells nobody: the welcome is the unread "1" on the Messages tab,
--     and the reply appears in a conversation the person has open.
--   * Nobody else is ever told: a case manager hears nothing about a Pam conversation.
-- Every other conversation behaves exactly as before.
--
-- Texts: a Pam conversation is left exactly as every other conversation is. `queue_message_text_alert` (20261010134429, D-478)
-- queues the opt-in "message waiting" text for every other member of a conversation, so a person who asked for message texts
-- gets one when Pam writes, as from anyone (the merge desk, 18 October: "Will said messaging Pam should feel like messaging
-- anyone else"). The welcome and the out-of-hours reply have no sender, so `m.profile_id <> new.sender_id` is never true and
-- they queue nothing. All of it is behind `texts_live`, which is off.

create or replace function public.pam_team_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public, extensions
as $$
  -- Today the super admins; the one place to widen with `is_pam_team()`.
  select public.super_admin_ids();
$$;

revoke all on function public.pam_team_ids() from public, anon, authenticated;

create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_recipients uuid[];
  v_sender_name text;
  v_asker uuid;
begin
  if public.is_support_conversation(new.conversation_id) then
    select t.asker_id into v_asker from public.pam_threads t where t.conversation_id = new.conversation_id;

    if new.sender_id is null or v_asker is null then
      return new;                                  -- a system message tells nobody
    elsif new.sender_id = v_asker then
      select first_name into v_sender_name from public.profiles where id = v_asker;
      -- the team, except anyone who already has an unread row for this conversation
      select coalesce(array_agg(r), '{}') into v_recipients
      from unnest(public.pam_team_ids()) r
      where not exists (
        select 1 from public.notifications n
        where n.recipient_id = r and n.kind = 'message_received'
          and n.subject_id = new.conversation_id and n.read_at is null
      );
      perform public.notify(v_recipients, 'message_received', 'notify.message_received',
        'conversation', new.conversation_id, jsonb_build_object('name', coalesce(v_sender_name, '')));
    else
      -- the team wrote: the person is told it was Pam, never who
      if not exists (
        select 1 from public.notifications n
        where n.recipient_id = v_asker and n.kind = 'message_received'
          and n.subject_id = new.conversation_id and n.read_at is null
      ) then
        perform public.notify(array[v_asker], 'message_received', 'notify.message_received',
          'conversation', new.conversation_id, jsonb_build_object('name', 'Pam'));
      end if;
    end if;
    return new;
  end if;

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

revoke all on function public.notify_on_message() from public, anon, authenticated;
