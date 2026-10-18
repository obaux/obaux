-- the_pam_inbox_lists_conversations_somebody_wrote_in — the Pam team's inbox skips a conversation with only Pam's welcome in it (D-605).
--
-- Claimed 2026-10-18 on `claude/messages-pam-s0-s1a` with `pnpm claim migration`. Runs after
-- `the_pam_team_inbox_and_starting_a_conversation` (20261018072644, live as 20261018074311).
--
-- EXPAND: `pam_inbox()` restated with one added condition (same signature and columns). Every account gets a Pam conversation with a
-- welcome, so without this the function returned one row for nearly everybody, and the screen filtered them out after receiving them
-- (Ava, 18 October). A conversation is in the inbox once a person has written in it: the person, or the team writing first. Nothing
-- else changes.

create or replace function public.pam_inbox()
returns table (
  conversation_id uuid,
  asker_id        uuid,
  first_name      text,
  role            public.user_role,
  region_name     text,
  program_name    text,
  status          text,
  last_message_at timestamptz,
  last_from       text,
  waiting_since   timestamptz,
  preview         text
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_pam_team() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;

  return query
  select
    t.conversation_id,
    t.asker_id,
    p.first_name,
    p.role,
    r.name,
    case when p.role = 'provider' then o.name else null end,
    t.status,
    lm.created_at,
    case when lm.created_at is null then null
         when lm.system_key is not null then 'system'
         when lm.sender_id = t.asker_id then 'asker'
         else 'team' end,
    ws.waiting_since,
    case when lm.created_at is not null and lm.system_key is null then left(split_part(coalesce(lm.body, ''), E'\n', 1), 140) else null end
  from public.pam_threads t
  join public.profiles p on p.id = t.asker_id
  left join public.regions r on r.id = p.region_id
  left join public.orgs o on o.id = p.org_id
  left join lateral (
    select m.created_at, m.body, m.sender_id, m.system_key
    from public.messages m
    where m.conversation_id = t.conversation_id
      and (m.system_key is null or m.system_key <> 'pam.welcome')
    order by m.created_at desc
    limit 1
  ) lm on true
  left join lateral (
    -- The oldest message from the person since the team last wrote (a person on the team, not the system).
    select min(m.created_at) as waiting_since
    from public.messages m
    where m.conversation_id = t.conversation_id
      and m.sender_id = t.asker_id
      and m.created_at > coalesce((
        select max(x.created_at) from public.messages x
        where x.conversation_id = t.conversation_id and x.sender_id is not null and x.sender_id <> t.asker_id
      ), '-infinity'::timestamptz)
  ) ws on true
  -- Only a conversation somebody has written in: a welcome on its own is nobody's question (Ava), and without this the inbox would
  -- carry one row for nearly every account.
  where exists (select 1 from public.messages w where w.conversation_id = t.conversation_id and w.sender_id is not null);
end;
$$;

comment on function public.pam_inbox is
  'The Pam team''s inbox: one row per Pam conversation, with who, open or closed, the last message, how long the person has waited and the first line of the last message (D-605). Pam team only.';
