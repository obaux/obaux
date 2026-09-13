-- 0035 — Telling the people who saved a place that it is gone.
--
-- Somebody saves a place because they mean to go there. When a super admin
-- takes it out of the catalogue, the member who saved it is the one person the
-- removal is actually about — and until now they would have found out by
-- walking there.
--
-- ## The message never names a place whose name discloses
--
-- "Fairmount Behavioral Health is not open any more" on a lock screen tells a
-- roommate something the member never chose to tell them. `name_may_disclose`
-- was built for exactly this (0017, 0028) and this is its first real use:
-- eleven of the imported places carry a name that gives somebody away, and for
-- those the private template sends instead — same message, no name.
--
-- ## Why an outbox rather than sending
--
-- `reminders` is bound to an appointment by a not-null foreign key, so it
-- cannot carry this. `outbound_messages` is the general queue: a dispatcher
-- polls it, honours quiet hours (§7.2) and the STOP list, and refuses any
-- template with no `reviewedBy`. None of that exists yet — no SMS provider is
-- configured — so these rows queue and wait, which is the correct behaviour for
-- a message that must not send until a human has read the copy.

create table if not exists public.outbound_messages (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references public.profiles (id) on delete cascade,
  channel        public.reminder_channel not null default 'sms',
  -- Key into @pam/config/sms-templates. The dispatcher refuses a template with
  -- no reviewedBy, so an unreviewed key fails loudly at send rather than
  -- shipping quietly.
  template_key   text not null,
  -- Filled placeholders. Never the message body: the body is rendered at send
  -- time from the reviewed template, so a queued row cannot carry text nobody
  -- signed off.
  vars           jsonb not null default '{}'::jsonb,
  send_at        timestamptz not null default now(),
  sent_at        timestamptz,
  status         public.reminder_status not null default 'scheduled',
  failure_reason text,
  created_at     timestamptz not null default now()
);

create index if not exists outbound_due_idx on public.outbound_messages (send_at)
  where status = 'scheduled';
create index if not exists outbound_member_idx on public.outbound_messages (member_id);

comment on table public.outbound_messages is
  'Queue for messages that are not appointment reminders. Rows carry a template '
  'key and its variables, never a body: the body is rendered at send time from '
  'a template a human has signed off.';

alter table public.outbound_messages enable row level security;
alter table public.outbound_messages force row level security;

-- A member can see what PAM has queued for them. Nobody else can, including an
-- admin: what a member is being texted is not on the §4.1 list.
drop policy if exists outbound_select_own on public.outbound_messages;
create policy outbound_select_own on public.outbound_messages
  for select using (member_id = auth.uid());

grant select on public.outbound_messages to authenticated;

-- ---------------------------------------------------------------------------
-- Queueing, when a place is removed.

create or replace function public.queue_saved_place_closed(p_service_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text;
  v_discloses boolean;
  n integer;
begin
  select name, name_may_disclose into v_name, v_discloses
  from public.services where id = p_service_id;

  if v_name is null then
    return 0;
  end if;

  insert into public.outbound_messages (member_id, template_key, vars)
  select
    sp.member_id,
    case when v_discloses then 'saved_place_closed_private' else 'saved_place_closed' end,
    case when v_discloses then '{}'::jsonb else jsonb_build_object('place', v_name) end
  from public.saved_places sp
  where sp.service_id = p_service_id;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.queue_saved_place_closed(uuid) from public, anon, authenticated;

-- Hooked into the decision itself, so it cannot be forgotten by a screen.
create or replace function public.resolve_service_flag(
  p_flag_id uuid,
  p_action  text,
  p_note    text default null
)
returns public.service_flags
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  flag public.service_flags;
  notified integer := 0;
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin decides what happens to a flagged place';
  end if;
  if p_action not in ('keep', 'remove') then
    raise exception 'Action must be keep or remove';
  end if;

  select * into flag from public.service_flags where id = p_flag_id;
  if flag.id is null then
    raise exception 'No such flag';
  end if;
  if flag.status <> 'pending' then
    raise exception 'That flag was already decided';
  end if;

  update public.service_flags
  set status = case when p_action = 'keep' then 'kept' else 'removed' end,
      resolved_by = caller,
      resolved_at = now(),
      resolution_note = nullif(btrim(p_note), '')
  where id = p_flag_id
  returning * into flag;

  if p_action = 'keep' then
    update public.services s
    set is_active = true, updated_at = now()
    where s.id = flag.service_id
      and s.removed_at is null
      and not exists (
        select 1 from public.service_flags f
        where f.service_id = s.id and f.status = 'pending'
      );
  else
    -- Queue the notices BEFORE the delete cascade takes the saved rows with it.
    notified := public.queue_saved_place_closed(flag.service_id);

    update public.services
    set is_active = false, removed_at = now(), updated_at = now()
    where id = flag.service_id;

    update public.service_flags
    set status = 'removed', resolved_by = caller, resolved_at = now(),
        resolution_note = 'Settled with flag ' || p_flag_id
    where service_id = flag.service_id and status = 'pending';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'service.flag.resolve', 'service', flag.service_id,
          jsonb_build_object('flag_id', p_flag_id, 'action', p_action,
                             'members_notified', notified));

  return flag;
end;
$$;

revoke all on function public.resolve_service_flag(uuid, text, text) from public, anon;
grant execute on function public.resolve_service_flag(uuid, text, text) to authenticated;
