-- A policy can be only for some of a program's services (D-313 step 2, D-485;
-- Will's card a25). Part 4 of 4.
--
-- D-313's rule, as the example set has always had it: a service names the
-- policies that are ONLY for it; a policy no service names is the program's,
-- asked of everyone. `program_policy_services` is that naming. No rows for a
-- policy = everyone signs it.
--
--   * `set_policy_services(policy, services)` — the program's lead says which
--     services a CURRENT policy is only for (an empty list: everyone). Services
--     must be the program's own. This changes who is asked, not what the policy
--     says; the policy itself is never edited (a25 point 3).
--   * A policy keeps its scope when a new version replaces it: `add_policy` is
--     replaced, same signature, to carry the old version's rows to the new one.
--   * A service taken off leaves the policy asked of the program's other
--     services only (the rows go with it, `on delete cascade`) — and of
--     everyone, if it was the last one named.
--
-- Read like the policy itself: the program's lead, admins, and anyone signed in
-- for a current policy of a live program (so a member's screens know which
-- policies a service asks).
--
-- EXPAND ONLY: one table, one function, one function replaced (same signature).

create table if not exists public.program_policy_services (
  policy_id          uuid not null references public.program_policies (id) on delete cascade,
  program_service_id uuid not null references public.program_services (id) on delete cascade,
  primary key (policy_id, program_service_id)
);

create index if not exists program_policy_services_service_idx on public.program_policy_services (program_service_id);

alter table public.program_policy_services enable row level security;
alter table public.program_policy_services force row level security;

create policy program_policy_services_select on public.program_policy_services
  for select to authenticated using (
    exists (select 1 from public.program_policies p where p.id = policy_id)
  );

revoke all on public.program_policy_services from anon, authenticated;
grant select on public.program_policy_services to authenticated;

comment on table public.program_policy_services is
  'The services a policy is ONLY for (D-313). No rows: every service of the program asks it.';

create or replace function public.set_policy_services(p_policy_id uuid, p_service_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  me     public.profiles;
  policy public.program_policies;
  ids    uuid[] := coalesce(p_service_ids, '{}');
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  select * into me from public.profiles where id = caller;
  if me.id is null or public.my_role() is distinct from 'provider' then
    raise exception 'NOT_A_PROGRAM_LEAD';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;

  select p.* into policy
  from public.program_policies p
  join public.services s on s.id = p.service_id
  where p.id = p_policy_id and s.org_id is not null and s.org_id = me.org_id
  for update of p;
  if policy.id is null then
    raise exception 'POLICY_NOT_FOUND';
  end if;
  if policy.archived_at is not null then
    raise exception 'POLICY_ALREADY_REMOVED';
  end if;

  -- Every service named must be this program's own.
  if exists (
    select 1 from unnest(ids) as wanted(id)
    where not exists (
      select 1 from public.program_services ps where ps.id = wanted.id and ps.service_id = policy.service_id
    )
  ) then
    raise exception 'SERVICE_NOT_FOUND';
  end if;

  delete from public.program_policy_services where policy_id = policy.id;
  insert into public.program_policy_services (policy_id, program_service_id)
  select policy.id, x from (select distinct unnest(ids) as x) d;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'policy.scope', 'program_policy', policy.id,
          jsonb_build_object('services', coalesce(array_length(ids, 1), 0)));
end;
$$;

revoke all on function public.set_policy_services(uuid, uuid[]) from public, anon;
grant execute on function public.set_policy_services(uuid, uuid[]) to authenticated;

comment on function public.set_policy_services is
  'The services a current policy is only for (none: everyone), D-313 step 2. '
  'Changes who is asked, never what the policy says.';

-- A new version keeps the old version's scope.
create or replace function public.add_policy(
  p_service_id uuid,
  p_title      text,
  p_files      jsonb,
  p_replaces   uuid default null
)
returns public.program_policies
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller  uuid := auth.uid();
  me      public.profiles;
  policy  public.program_policies;
  old     public.program_policies;
  item    jsonb;
  n       integer := 0;
  title   text := nullif(btrim(coalesce(p_title, '')), '');
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  select * into me from public.profiles where id = caller;
  if me.id is null or public.my_role() is distinct from 'provider' then
    raise exception 'NOT_A_PROGRAM_LEAD';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;
  if not exists (
    select 1 from public.services s
    where s.id = p_service_id and s.org_id is not null and s.org_id = me.org_id
  ) then
    raise exception 'PROGRAM_NOT_FOUND';
  end if;
  if title is null then
    raise exception 'TITLE_REQUIRED';
  end if;
  if char_length(title) > 120 then
    raise exception 'TITLE_TOO_LONG';
  end if;
  if p_files is null or jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) = 0 then
    raise exception 'FILES_REQUIRED';
  end if;
  if jsonb_array_length(p_files) > 5 then
    raise exception 'TOO_MANY_FILES';
  end if;
  if (select count(*) from public.program_policies where service_id = p_service_id and archived_at is null
        and id is distinct from p_replaces) >= 30 then
    raise exception 'TOO_MANY_POLICIES';
  end if;

  if p_replaces is not null then
    select * into old from public.program_policies
    where id = p_replaces and service_id = p_service_id and archived_at is null
    for update;
    if old.id is null then
      raise exception 'POLICY_NOT_FOUND';
    end if;
  end if;

  insert into public.program_policies (service_id, title, version, replaces_id, created_by)
  values (p_service_id, title, coalesce(old.version, 0) + 1, old.id, caller)
  returning * into policy;

  for item in select * from jsonb_array_elements(p_files)
  loop
    if split_part(item->>'path', '/', 1) <> p_service_id::text
       or (item->>'path') like '%..%' then
      raise exception 'FILE_NOT_IN_PROGRAM_FOLDER';
    end if;
    insert into public.program_policy_files (policy_id, path, name, content_type, size_bytes, position)
    values (
      policy.id, item->>'path', item->>'name', item->>'content_type',
      (item->>'size_bytes')::integer, n
    );
    n := n + 1;
  end loop;

  if old.id is not null then
    -- D-313 step 2: the new version is asked of the same services as the old.
    insert into public.program_policy_services (policy_id, program_service_id)
    select policy.id, program_service_id from public.program_policy_services where policy_id = old.id;
    update public.program_policies set archived_at = now() where id = old.id;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, case when old.id is null then 'policy.add' else 'policy.replace' end,
          'program_policy', policy.id, jsonb_build_object('version', policy.version));

  return policy;
end;
$$;

revoke all on function public.add_policy(uuid, text, jsonb, uuid) from public, anon;
grant execute on function public.add_policy(uuid, text, jsonb, uuid) to authenticated;

-- (The merge desk's other small fixes are in part 3's migration. add_policy above keeps the cap fix.)
