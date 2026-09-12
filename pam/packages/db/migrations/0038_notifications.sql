-- 0038 — In-app notifications for the people who have to act on something.
--
-- Will: when a message or a place is flagged, the case manager should hear
-- about it too, not only the super admin — and both should have a list in the
-- app rather than finding out by chance.
--
-- ## Who hears about what, and why it is not "everyone"
--
-- A flag is routed to the people it is actually about:
--
--   a flagged place       -> every super admin (they decide), and the case
--                            managers of members who saved it (their people
--                            were planning to go there)
--   a reported message    -> every super admin, and the case manager of the
--                            member who was reported about
--
-- The second one is the §4.1 line. A case manager hears that a message in their
-- caseload was reported, and the notification carries no message text at all —
-- the excerpt lives on the report, which they already read through the review
-- screen (0034). A notification is a nudge to look, not a copy of the thing.
--
-- ## Why a table and not a query
--
-- "Unread" is per person, and a case manager needs to be able to clear one.
-- That is state, and state belongs in a row.

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  -- Who needs to see it.
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind        text not null,
  -- What it is about. Kept as a loose reference rather than a foreign key,
  -- because a notification outlives the thing it points at — a removed place
  -- is exactly when somebody most wants to know why.
  subject_type text,
  subject_id   uuid,
  -- A plain-language key into the locale bundles plus its variables. Never a
  -- sentence: the words stay translatable and reviewable, and a notification
  -- can never carry text that came from a member.
  body_key    text not null,
  body_vars   jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now(),

  constraint notifications_kind_known check (
    kind in ('service_flagged', 'service_removed', 'message_reported')
  )
);

create index if not exists notifications_unread_idx
  on public.notifications (recipient_id, created_at desc) where read_at is null;
create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

comment on table public.notifications is
  'In-app notices for people who have to act. body_key is a locale key, never a '
  'sentence — so a notification can never carry words a member wrote, and the '
  'copy stays translatable and reviewable.';

alter table public.notifications enable row level security;
alter table public.notifications force row level security;

-- Yours and only yours, including from other admins.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (recipient_id = auth.uid());

-- The only thing a recipient may change is whether they have read it.
drop policy if exists notifications_mark_read on public.notifications;
create policy notifications_mark_read on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

grant select, update on public.notifications to authenticated;

-- ---------------------------------------------------------------------------

create or replace function public.notify(
  p_recipients uuid[],
  p_kind       text,
  p_body_key   text,
  p_subject_type text default null,
  p_subject_id   uuid default null,
  p_body_vars    jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare n integer;
begin
  insert into public.notifications
    (recipient_id, kind, body_key, body_vars, subject_type, subject_id)
  select distinct r, p_kind, p_body_key, p_body_vars, p_subject_type, p_subject_id
  from unnest(p_recipients) r
  where r is not null;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.notify(uuid[], text, text, text, uuid, jsonb)
  from public, anon, authenticated;

/** Every super admin. Small set by design. */
create or replace function public.super_admin_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(array_agg(id), '{}') from public.profiles where role = 'super_admin';
$$;

revoke all on function public.super_admin_ids() from public, anon, authenticated;

/** The case managers responsible for a given set of members. */
create or replace function public.case_managers_for(p_member_ids uuid[])
returns uuid[]
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(array_agg(distinct a.admin_id), '{}')
  from public.admin_assignments a
  where a.member_id = any(p_member_ids);
$$;

revoke all on function public.case_managers_for(uuid[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Wiring, on the two events Will named.
--
-- Triggers rather than calls inside the RPCs: a notification that depends on
-- somebody remembering to send it is a notification that stops arriving the
-- first time a second code path appears.

create or replace function public.notify_on_service_flag()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_savers uuid[];
begin
  -- The people who saved it are whose case managers care: their person was
  -- planning to go there.
  select coalesce(array_agg(member_id), '{}') into v_savers
  from public.saved_places where service_id = new.service_id;

  perform public.notify(
    public.super_admin_ids() || public.case_managers_for(v_savers),
    'service_flagged',
    'notify.service_flagged',
    'service', new.service_id,
    jsonb_build_object('reason', new.reason)
  );
  return new;
end;
$$;

drop trigger if exists service_flags_notify on public.service_flags;
create trigger service_flags_notify
  after insert on public.service_flags
  for each row execute function public.notify_on_service_flag();

create or replace function public.notify_on_report()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_about uuid;
begin
  if new.target_type <> 'message' then
    return new;
  end if;

  -- The case manager of the person the report is about — the sender of the
  -- reported message, not the reporter.
  select m.sender_id into v_about from public.messages m where m.id = new.target_id;

  -- No message text travels with this. The excerpt lives on the report, which a
  -- case manager reads through the review screen; a notification is a nudge to
  -- look, not a copy of the thing (§4.1).
  perform public.notify(
    public.super_admin_ids() || public.case_managers_for(array[v_about]),
    'message_reported',
    'notify.message_reported',
    'report', new.id
  );
  return new;
end;
$$;

drop trigger if exists reports_notify on public.reports;
create trigger reports_notify
  after insert on public.reports
  for each row execute function public.notify_on_report();
