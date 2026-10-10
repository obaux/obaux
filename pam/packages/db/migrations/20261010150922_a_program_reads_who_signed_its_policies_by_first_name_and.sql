-- A program reads who signed its policies, by first name and date (D-261,
-- D-485; Will's card a25, point 1: "A program sees the member's first name and
-- the date they signed"). Part 3 of 4.
--
-- `policy_signatures` is readable only by the member who signed (part 2). A
-- program reads the record through this one function, which returns a first
-- name and a date for each signature on its own program's policies — never the
-- picture, never a phone number, never a last name. It is what the policy's
-- Signed tab lists, and what the small verified tick beside a person reads:
-- they signed every current policy.
--
-- Only the program's own lead (and a super admin) may ask, and only for their
-- own program; any other program reads as not found. NOT is_admin(): on live
-- that is also a case manager, who reaches assigned members only (0082).
--
-- Also here (merge desk, after part 1 went live): archive_policy checks
-- is_active_account(); add_policy leaves the policy being replaced out of the
-- 30 cap; reminder_is_quiet pins its search path; and a case manager no longer
-- reads archived or not-yet-live programs' policies (they read current ones of
-- live programs like anyone signed in).
--
-- EXPAND ONLY: create or replace / alter, no DROP.

create or replace function public.program_policy_signers(p_service_id uuid)
returns table (
  policy_id  uuid,
  member_id  uuid,
  first_name text,
  signed_at  timestamptz
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  if not public.is_super_admin() and not exists (
    select 1 from public.services s
    where s.id = p_service_id and s.org_id is not null and s.org_id = public.my_org()
      and public.my_role() = 'provider'
  ) then
    raise exception 'PROGRAM_NOT_FOUND';
  end if;

  return query
  select sig.policy_id, sig.member_id, pr.first_name, sig.signed_at
  from public.policy_signatures sig
  join public.program_policies pol on pol.id = sig.policy_id
  join public.profiles pr on pr.id = sig.member_id
  where pol.service_id = p_service_id
  order by sig.signed_at desc;
end;
$$;

revoke all on function public.program_policy_signers(uuid) from public, anon;
grant execute on function public.program_policy_signers(uuid) to authenticated;

comment on function public.program_policy_signers is
  'Who signed a program''s policies: first name and date, never the picture '
  '(D-485, a25). The program''s own lead, or a super admin.';

-- ---------------------------------------------------------------------------
-- Fixes

create or replace function public.archive_policy(p_id uuid)
returns public.program_policies
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  me     public.profiles;
  policy public.program_policies;
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
  where p.id = p_id and s.org_id is not null and s.org_id = me.org_id
  for update of p;
  if policy.id is null then
    raise exception 'POLICY_NOT_FOUND';
  end if;
  if policy.archived_at is not null then
    raise exception 'POLICY_ALREADY_REMOVED';
  end if;

  update public.program_policies set archived_at = now() where id = policy.id returning * into policy;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'policy.archive', 'program_policy', policy.id, jsonb_build_object('version', policy.version));

  return policy;
end;
$$;

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
  -- Their own program's, whatever id is passed.
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
    -- Each file was put in the bucket under this program's own folder first.
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
    update public.program_policies set archived_at = now() where id = old.id;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, case when old.id is null then 'policy.add' else 'policy.replace' end,
          'program_policy', policy.id, jsonb_build_object('version', policy.version));

  return policy;
end;
$$;

create or replace function public.can_read_policy_file(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    coalesce(public.owns_policy_folder(p_name), false)
    or public.is_super_admin()
    or exists (
      select 1
      from public.program_policy_files f
      join public.program_policies p on p.id = f.policy_id
      join public.services s on s.id = p.service_id
      where f.path = p_name and p.archived_at is null and s.is_active and not s.needs_review
    )
    or exists (
      select 1
      from public.program_policy_files f
      join public.policy_signatures sig on sig.policy_id = f.policy_id
      where f.path = p_name and sig.member_id = auth.uid()
    );
$$;

revoke all on function public.add_policy(uuid, text, jsonb, uuid) from public, anon;
revoke all on function public.archive_policy(uuid) from public, anon;
revoke all on function public.can_read_policy_file(text) from public, anon;
grant execute on function public.add_policy(uuid, text, jsonb, uuid) to authenticated;
grant execute on function public.archive_policy(uuid) to authenticated;
grant execute on function public.can_read_policy_file(text) to authenticated;

-- Current policies of live programs are already readable by anyone signed in;
-- the rest (archived, not yet live) is the lead's and a super admin's.
alter policy program_policies_select_admin on public.program_policies using (public.is_super_admin());

alter function public.reminder_is_quiet(timestamp, integer, integer) set search_path = public, extensions;
