-- open_pam_conversation_and_when_pam_is_here — a person's one Pam conversation, and what "Pam is here" means (D-605, D-606).
--
-- Claimed 2026-10-18 07:23:39 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
-- Runs after `who_reads_a_pam_conversation`.
--
-- EXPAND: new functions, and `conversation_partners()` restated with one added branch (same signature and columns). With
-- `app_settings.pam_messaging_live` off, `open_pam_conversation()` creates nothing and returns null, so nothing here is visible.
--
--   open_pam_conversation()   Signed in only. Returns the caller's one Pam conversation, creating it the first time: the
--                             conversation (kind 'support') with the caller as its only member, its `pam_threads` row, and Pam's
--                             welcome (a system message, `pam.welcome`, no author). Idempotent; two calls at once make one.
--                             Returns null when the switch is off and for the Pam team (they are Pam, they get no conversation).
--   pam_status()              Any signed-in person: whether Pam messaging is on, when Pam is here, whether it is open now, when it
--                             next opens (null while it is open).
--   conversation_partners()   For a support conversation the caller is in, one row with a null `profile_id` (and no name, role or
--                             program): that is how the app knows the other side is Pam, with no fake account behind it.
--
-- "When Pam is here" is `app_settings.pam_hours` (migration 20261018071553): a time zone, ISO weekdays, an opening and a closing
-- time. The helpers below read it with the defaults Will gave (Monday to Friday, 9:00 to 17:00, America/New_York) when the row is
-- missing or part of it is, and do their sums in the zone, so daylight saving moves the opening with the clock on the wall. They
-- are for the functions here and the out-of-hours reply (a later migration), not for clients.

create or replace function public.pam_hours_config()
returns table (tz text, days int[], opens time, closes time)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with raw as (
    select coalesce((select value::jsonb from public.app_settings where key = 'pam_hours'), '{}'::jsonb) as j
  )
  select
    coalesce(j ->> 'tz', 'America/New_York'),
    coalesce(
      case when jsonb_typeof(j -> 'days') = 'array'
           then (select array_agg(x::int order by x::int) from jsonb_array_elements_text(j -> 'days') x)
      end,
      array[1, 2, 3, 4, 5]),
    coalesce((j ->> 'open')::time, '09:00'::time),
    coalesce((j ->> 'close')::time, '17:00'::time)
  from raw;
$$;

create or replace function public.pam_is_open(p_at timestamptz default now())
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select extract(isodow from (p_at at time zone c.tz))::int = any (c.days)
     and (p_at at time zone c.tz)::time >= c.opens
     and (p_at at time zone c.tz)::time <  c.closes
  from public.pam_hours_config() c;
$$;

-- The next opening strictly after p_at (null if the days list is empty).
create or replace function public.pam_next_open(p_at timestamptz default now())
returns timestamptz
language sql
stable
security definer
set search_path = public, extensions
as $$
  select min(x.cand)
  from public.pam_hours_config() c
  cross join generate_series(0, 8) d
  cross join lateral (
    select ((((p_at at time zone c.tz)::date + d) + c.opens) at time zone c.tz) as cand,
           extract(isodow from ((p_at at time zone c.tz)::date + d))::int as dow
  ) x
  where x.dow = any (c.days) and x.cand > p_at;
$$;

-- The latest closing at or before p_at (null if there is none in the last nine days).
create or replace function public.pam_last_close(p_at timestamptz default now())
returns timestamptz
language sql
stable
security definer
set search_path = public, extensions
as $$
  select max(x.cand)
  from public.pam_hours_config() c
  cross join generate_series(0, 8) d
  cross join lateral (
    select ((((p_at at time zone c.tz)::date - d) + c.closes) at time zone c.tz) as cand,
           extract(isodow from ((p_at at time zone c.tz)::date - d))::int as dow
  ) x
  where x.dow = any (c.days) and x.cand <= p_at;
$$;

revoke all on function public.pam_hours_config() from public, anon, authenticated;
revoke all on function public.pam_is_open(timestamptz) from public, anon, authenticated;
revoke all on function public.pam_next_open(timestamptz) from public, anon, authenticated;
revoke all on function public.pam_last_close(timestamptz) from public, anon, authenticated;

-- ---------------------------------------------------------------------------

create or replace function public.pam_status()
returns table (live boolean, hours_tz text, hours_days int[], hours_open time, hours_close time, open_now boolean, next_open timestamptz)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    coalesce((select s.value from public.app_settings s where s.key = 'pam_messaging_live'), 'off') = 'on',
    c.tz, c.days, c.opens, c.closes,
    public.pam_is_open(now()),
    case when public.pam_is_open(now()) then null else public.pam_next_open(now()) end
  from public.pam_hours_config() c
  where auth.uid() is not null;
$$;

comment on function public.pam_status is
  'Whether messaging Pam is on, when Pam is here, whether it is open now and when it next opens (null while open). Signed-in only (D-605).';

revoke all on function public.pam_status() from public, anon;
grant execute on function public.pam_status() to authenticated;

-- ---------------------------------------------------------------------------

create or replace function public.open_pam_conversation()
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    return null;
  end if;
  if coalesce((select value from public.app_settings where key = 'pam_messaging_live'), 'off') <> 'on' then
    return null;
  end if;
  -- The Pam team are Pam: no conversation with themselves.
  if public.is_pam_team() then
    return null;
  end if;
  if not exists (select 1 from public.profiles where id = v_me) then
    return null;
  end if;

  select t.conversation_id into v_id from public.pam_threads t where t.asker_id = v_me;
  if v_id is not null then
    return v_id;
  end if;

  begin
    insert into public.conversations (kind) values ('support') returning id into v_id;
    insert into public.conversation_members (conversation_id, profile_id) values (v_id, v_me);
    insert into public.pam_threads (conversation_id, asker_id) values (v_id, v_me);
    -- Pam's welcome: written by no person; the app draws it in the reader's language (D-605).
    insert into public.messages (conversation_id, sender_id, body, system_key)
    values (v_id, null, '', 'pam.welcome');
  exception when unique_violation then
    -- Two calls at once: the other one made it.
    select t.conversation_id into v_id from public.pam_threads t where t.asker_id = v_me;
  end;
  return v_id;
end;
$$;

comment on function public.open_pam_conversation is
  'The caller''s one Pam conversation, made with Pam''s welcome the first time. Null when the switch is off or for the Pam team (D-605).';

revoke all on function public.open_pam_conversation() from public, anon;
grant execute on function public.open_pam_conversation() to authenticated;

-- ---------------------------------------------------------------------------
-- The other side of a conversation. A support conversation has no other member: one row with a null profile_id says "Pam".

create or replace function public.conversation_partners()
returns table (
  conversation_id uuid,
  profile_id      uuid,
  first_name      text,
  role            public.user_role,
  program_name    text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    mine.conversation_id,
    theirs.profile_id,
    p.first_name,
    p.role,
    case when p.role = 'provider' then o.name else null end
  from public.conversation_members mine
  join public.conversation_members theirs
    on theirs.conversation_id = mine.conversation_id
   and theirs.profile_id <> mine.profile_id
  join public.profiles p on p.id = theirs.profile_id
  left join public.orgs o on o.id = p.org_id
  where mine.profile_id = auth.uid()
  union all
  select mine.conversation_id, null::uuid, null::text, null::public.user_role, null::text
  from public.conversation_members mine
  join public.conversations c on c.id = mine.conversation_id and c.kind = 'support'
  where mine.profile_id = auth.uid();
$$;

comment on function public.conversation_partners is
  'For every conversation the caller is in, the other participant''s name and role (and a program admin''s organisation, 0066). '
  'A support conversation has no other member: one row with a null profile_id, which is Pam (D-605). Never last_active_at or phone (0061).';
