-- the_pam_team_inbox_and_starting_a_conversation — what the Pam team calls (D-605, D-606).
--
-- Claimed 2026-10-18 07:26:44 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
-- Runs after `open_pam_conversation_and_when_pam_is_here`.
--
-- EXPAND: new functions only. Every one refuses anyone but the Pam team (`ONLY_A_SUPER_ADMIN`, the code the other
-- super-admin functions use) and is granted to `authenticated` only. Nothing is visible while the switch is off: with no Pam
-- conversation, `pam_inbox()` is empty.
--
--   pam_inbox()                           One row per Pam conversation: who (first name, role, region, the program for a lead),
--                                         open or closed, the last message and who wrote it, when the person has been waiting
--                                         since (their oldest message since the team last wrote), and the first line of the last
--                                         message. No last name, phone, email or city beyond the region. A system message (the
--                                         welcome, the out-of-hours reply) never counts as the team answering.
--   pam_set_thread_status(conv, status)   Close or reopen. (A new message from the person reopens it, in the next migration.)
--   pam_reply_times(days)                 The median and the mean time to a first reply, over the stretches that began in the
--                                         last N days and were answered, and how many. Durations and a count; no text.
--   pam_set_hours(tz, days, open, close)  Writes `app_settings.pam_hours`, after checking it.
--   pam_start_conversation(person, text)  The Pam team writes first, to any member, case manager or program lead, in that
--                                         person's one Pam conversation (made with the welcome if it is not there). Audited.
--   pam_program_has_lead(svc)             Whether the program has an active lead to write to (the screen asks before it offers the button).
--   pam_start_program_conversation(svc, text)  The same text to each ACTIVE lead of the program, each in their own Pam
--                                         conversation; returns how many. No active lead: raises PAM_NO_ACTIVE_LEAD.
-- D-171 and D-262 (a super admin messages nobody / only staff, never a member) are narrowed for the Pam conversation only:
-- `can_message` and `open_direct_conversation` are untouched.

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
  ) ws on true;
end;
$$;

comment on function public.pam_inbox is
  'The Pam team''s inbox: one row per Pam conversation, with who, open or closed, the last message, how long the person has waited and the first line of the last message (D-605). Pam team only.';

create or replace function public.pam_set_thread_status(p_conversation uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_pam_team() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;
  if p_status not in ('open', 'closed') then
    raise exception 'INVALID_STATUS';
  end if;
  update public.pam_threads set status = p_status where conversation_id = p_conversation;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
end;
$$;

create or replace function public.pam_reply_times(p_days integer default 30)
returns table (median_seconds numeric, mean_seconds numeric, answered integer)
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
  with person_and_team as (
    -- Only what a person wrote: the person's messages and the team's, in order; the system's are left out.
    select m.conversation_id, m.created_at, (m.sender_id = t.asker_id) as from_asker
    from public.messages m
    join public.pam_threads t on t.conversation_id = m.conversation_id
    where m.sender_id is not null
  ),
  starts as (
    -- A stretch starts at a message from the person when the one before it was the team's, or there was none.
    select s.conversation_id, s.created_at
    from (
      select pt.*, lag(pt.from_asker) over (partition by pt.conversation_id order by pt.created_at) as prev_from_asker
      from person_and_team pt
    ) s
    where s.from_asker and (s.prev_from_asker is null or not s.prev_from_asker)
      and s.created_at >= now() - make_interval(days => greatest(p_days, 1))
  ),
  answered_in as (
    select extract(epoch from (
      (select min(pt.created_at) from person_and_team pt
        where pt.conversation_id = st.conversation_id and not pt.from_asker and pt.created_at > st.created_at)
      - st.created_at)) as secs
    from starts st
  )
  select
    (percentile_cont(0.5) within group (order by a.secs))::numeric,
    (avg(a.secs))::numeric,
    count(*)::integer
  from answered_in a
  where a.secs is not null;
end;
$$;

create or replace function public.pam_set_hours(p_tz text, p_days integer[], p_open time, p_close time)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_pam_team() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;
  if not exists (select 1 from pg_timezone_names n where n.name = p_tz) then
    raise exception 'INVALID_TIME_ZONE';
  end if;
  if p_days is null or cardinality(p_days) = 0
     or exists (select 1 from unnest(p_days) d where d is null or d < 1 or d > 7) then
    raise exception 'INVALID_DAYS';
  end if;
  if p_open is null or p_close is null or p_open >= p_close then
    raise exception 'INVALID_HOURS';
  end if;

  insert into public.app_settings (key, value, description, updated_by, updated_at)
  values ('pam_hours',
          jsonb_build_object(
            'tz', p_tz,
            'days', (select jsonb_agg(distinct d order by d) from unnest(p_days) d),
            'open', to_char(p_open, 'HH24:MI'),
            'close', to_char(p_close, 'HH24:MI'))::text,
          'When Pam is here (D-605).', auth.uid(), now())
  on conflict (key) do update
    set value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.pam_start_conversation(p_profile uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  if not public.is_pam_team() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;
  if coalesce((select value from public.app_settings where key = 'pam_messaging_live'), 'off') <> 'on' then
    raise exception 'PAM_OFF';
  end if;
  if v_body = '' or char_length(v_body) > 3000 then
    raise exception 'INVALID_MESSAGE';
  end if;
  if p_profile is null or not exists (select 1 from public.profiles where id = p_profile) then
    raise exception 'NOT_FOUND';
  end if;
  -- Pam writes to people, not to itself.
  if exists (select 1 from public.profiles where id = p_profile and role = 'super_admin') then
    raise exception 'NOT_ALLOWED';
  end if;

  v_id := public.pam_ensure_conversation(p_profile);
  insert into public.messages (conversation_id, sender_id, body) values (v_id, auth.uid(), v_body);
  update public.pam_threads set status = 'open' where conversation_id = v_id and status <> 'open';

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (auth.uid(), 'pam.start', 'profile', p_profile, '{}'::jsonb);

  return v_id;
end;
$$;

create or replace function public.pam_start_program_conversation(p_service uuid, p_body text)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_org uuid;
  v_lead uuid;
  v_n integer := 0;
begin
  if not public.is_pam_team() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;

  select s.org_id into v_org from public.services s where s.id = p_service;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  for v_lead in
    select p.id from public.profiles p
    where p.role = 'provider' and p.access_status = 'active' and v_org is not null and p.org_id = v_org
    order by p.created_at
  loop
    perform public.pam_start_conversation(v_lead, p_body);
    v_n := v_n + 1;
  end loop;

  if v_n = 0 then
    raise exception 'PAM_NO_ACTIVE_LEAD';
  end if;
  return v_n;
end;
$$;

-- Whether a program has an active lead on Pam to write to, so the screen can say so before the Pam team writes a message that
-- cannot go (the same rule as `pam_start_program_conversation`).
create or replace function public.pam_program_has_lead(p_service uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_pam_team() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;
  return exists (
    select 1
    from public.services s
    join public.profiles p on p.org_id = s.org_id
    where s.id = p_service and s.org_id is not null and p.role = 'provider' and p.access_status = 'active'
  );
end;
$$;

do $grants$
declare
  f text;
begin
  foreach f in array array[
    'pam_inbox()', 'pam_set_thread_status(uuid, text)', 'pam_reply_times(integer)',
    'pam_set_hours(text, integer[], time, time)', 'pam_start_conversation(uuid, text)',
    'pam_start_program_conversation(uuid, text)', 'pam_program_has_lead(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$grants$;
