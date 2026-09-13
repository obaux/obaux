-- 0033 — The flag itself. See 0032 for the reasoning; this is the machinery.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  -- A super admin is a case manager with more, not a different kind of person:
  -- they keep a caseload, and every policy written against is_admin() keeps
  -- meaning exactly what it meant.
  select coalesce(
    (select role in ('admin', 'super_admin') from public.profiles where id = auth.uid()),
    false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false);
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------

alter table public.services
  add column if not exists removed_at timestamptz;

comment on column public.services.removed_at is
  'Set when a super admin takes a place out of the catalogue for good. The '
  'importers never clear it, which is the point: a decision that a place is '
  'gone must outlive the next import run (0032).';

create table if not exists public.service_flags (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references public.services (id) on delete cascade,
  flagged_by   uuid references public.profiles (id) on delete set null,
  -- What the person typed. Plain language, shown to the super admin deciding.
  note         text,
  status       text not null default 'pending',
  resolved_by  uuid references public.profiles (id) on delete set null,
  resolved_at  timestamptz,
  resolution_note text,
  created_at   timestamptz not null default now(),

  constraint service_flags_status_known check (status in ('pending', 'kept', 'removed')),
  constraint service_flags_resolved_consistently check (
    (status = 'pending') = (resolved_at is null)
  )
);

create index if not exists service_flags_service_idx on public.service_flags (service_id);
create index if not exists service_flags_pending_idx on public.service_flags (status) where status = 'pending';

comment on table public.service_flags is
  'Somebody reported that a place is no longer there. The flag hides it at '
  'once; a super admin then keeps it or removes it. Anyone signed in can flag, '
  'because the person who finds out first is whoever walked there.';

alter table public.service_flags enable row level security;
alter table public.service_flags force row level security;

-- Anyone signed in can raise one, through the function below.
drop policy if exists service_flags_select_own on public.service_flags;
create policy service_flags_select_own on public.service_flags
  for select using (flagged_by = auth.uid());

drop policy if exists service_flags_select_admin on public.service_flags;
create policy service_flags_select_admin on public.service_flags
  for select using (public.is_admin());

drop policy if exists service_flags_super_admin_write on public.service_flags;
create policy service_flags_super_admin_write on public.service_flags
  for all using (public.is_super_admin()) with check (public.is_super_admin());

grant select on public.service_flags to authenticated;
grant insert, update, delete on public.service_flags to authenticated;

-- ---------------------------------------------------------------------------
-- Raising a flag.
--
-- Hides the place immediately. That is deliberate and worth defending: hiding a
-- live place for a few days costs somebody one wasted search, and leaving a
-- closed one up costs somebody a bus fare, an afternoon, and some of the small
-- amount of faith they have left in being told the truth.

create or replace function public.flag_service(p_service_id uuid, p_note text default null)
returns public.service_flags
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  flag public.service_flags;
begin
  if caller is null then
    raise exception 'Sign in to flag a place';
  end if;
  if not public.is_active_account() then
    raise exception 'This account cannot flag a place';
  end if;
  if not exists (select 1 from public.services where id = p_service_id) then
    raise exception 'No such place';
  end if;

  insert into public.service_flags (service_id, flagged_by, note)
  values (p_service_id, caller, nullif(btrim(p_note), ''))
  returning * into flag;

  update public.services
  set is_active = false, updated_at = now()
  where id = p_service_id and removed_at is null;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'service.flag', 'service', p_service_id,
          jsonb_build_object('flag_id', flag.id, 'has_note', p_note is not null));

  return flag;
end;
$$;

revoke all on function public.flag_service(uuid, text) from public, anon;
grant execute on function public.flag_service(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Deciding.

create or replace function public.resolve_service_flag(
  p_flag_id uuid,
  p_action  text,   -- 'keep' or 'remove'
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
    -- Back in the catalogue, unless a different flag is still open against it.
    update public.services s
    set is_active = true, updated_at = now()
    where s.id = flag.service_id
      and s.removed_at is null
      and not exists (
        select 1 from public.service_flags f
        where f.service_id = s.id and f.status = 'pending'
      );
  else
    update public.services
    set is_active = false, removed_at = now(), updated_at = now()
    where id = flag.service_id;

    -- Every other open flag on the same place is settled by the same decision.
    update public.service_flags
    set status = 'removed', resolved_by = caller, resolved_at = now(),
        resolution_note = 'Settled with flag ' || p_flag_id
    where service_id = flag.service_id and status = 'pending';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'service.flag.resolve', 'service', flag.service_id,
          jsonb_build_object('flag_id', p_flag_id, 'action', p_action));

  return flag;
end;
$$;

revoke all on function public.resolve_service_flag(uuid, text, text) from public, anon;
grant execute on function public.resolve_service_flag(uuid, text, text) to authenticated;

-- Will is the first super admin. Seeded by hand for the same reason the first
-- admin was: there is nobody to promote him.
update public.profiles set role = 'super_admin' where role = 'admin' and id = (
  select id from public.profiles where role = 'admin' order by created_at limit 1
);
