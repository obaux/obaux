-- A program keeps its policies for participants in the database (D-261,
-- D-313 step 2; Will, 10 October 2026, card a25: "Go for it", all six points as
-- recommended). Part 1 of 4: the policies and their files. Signing is part 2,
-- who signed and the verified tick part 3, "only for this service" part 4.
--
-- Until now a program's policies, uploads and signatures were all example data
-- kept in the browser tab (`usePolicies`). This is where a real program's
-- policies live:
--
--   * `program_policies` — one row per policy a program asks of its participants
--     (a confidentiality policy, a liability disclaimer), with a version.
--     A policy is NEVER edited after it is made: a new version replaces it
--     (`replaces_id`), the old one is archived, and people who signed it keep it
--     (Will's point 3). Removing a policy archives it; nothing is deleted.
--   * `program_policy_files` — the pages: a PDF, or a photo of each page. At most
--     5 per policy, 10 MB each (point 4), kept in the private `policies` bucket.
--
-- Who reads what: a program's lead reads and writes their own; a super admin or
-- admin reads all; a signed-in person reads the CURRENT policies of a live
-- program (to read them before booking, D-270). Nobody writes a row directly:
-- `add_policy` and `archive_policy` check who is asking.
--
-- Not here (part 2 onward): signatures, and a member's access to an archived
-- policy they signed. Members therefore see nothing new in the app until
-- signing ships; the lead's own screens use these tables first.
--
-- EXPAND ONLY: new tables, functions, one bucket and its policies. Nothing
-- existing changes.

-- ---------------------------------------------------------------------------
-- 1. The tables.

create table if not exists public.program_policies (
  id          uuid primary key default gen_random_uuid(),
  -- The program's listing (a program is a `services` row, D-462).
  service_id  uuid not null references public.services (id) on delete cascade,
  title       text not null,
  version     integer not null default 1,
  -- The version this one replaced, when the program replaced it.
  replaces_id uuid references public.program_policies (id) on delete set null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  -- Taken off (or replaced). The row stays: people who signed keep their copy.
  archived_at timestamptz,

  constraint program_policies_title_present check (char_length(btrim(title)) between 1 and 120),
  constraint program_policies_version_positive check (version >= 1)
);

create index if not exists program_policies_program_idx
  on public.program_policies (service_id) where archived_at is null;

create table if not exists public.program_policy_files (
  id           uuid primary key default gen_random_uuid(),
  policy_id    uuid not null references public.program_policies (id) on delete cascade,
  -- Where it is in the `policies` bucket: <program id>/<something>.<ext>.
  path         text not null unique,
  name         text not null,
  content_type text not null,
  size_bytes   integer not null,
  position     smallint not null default 0,

  constraint program_policy_files_name_ok check (
    char_length(name) between 1 and 200 and name !~ '[[:cntrl:]/\\]'
  ),
  constraint program_policy_files_type_ok check (
    content_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic')
  ),
  constraint program_policy_files_size_ok check (size_bytes between 1 and 10485760)
);

create index if not exists program_policy_files_policy_idx on public.program_policy_files (policy_id, position);

comment on table public.program_policies is
  'The policies a program asks its participants to read and sign (D-261). Never '
  'edited: a new version replaces one (replaces_id) and the old is archived, so '
  'the people who signed keep it. Written only by add_policy / archive_policy.';

-- ---------------------------------------------------------------------------
-- 2. Row-level security: set as a set.

alter table public.program_policies enable row level security;
alter table public.program_policies force row level security;
alter table public.program_policy_files enable row level security;
alter table public.program_policy_files force row level security;

-- A lead reads their own program's, archived ones too (the record).
create policy program_policies_select_lead on public.program_policies
  for select using (
    exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  );
create policy program_policies_select_admin on public.program_policies
  for select using (public.is_admin());
-- Anyone signed in reads the CURRENT policies of a live program.
create policy program_policies_select_current on public.program_policies
  for select to authenticated using (
    archived_at is null
    and exists (select 1 from public.services s where s.id = service_id and s.is_active and not s.needs_review)
  );

create policy program_policy_files_select on public.program_policy_files
  for select using (
    exists (select 1 from public.program_policies p where p.id = policy_id)
  );

revoke all on public.program_policies from anon, authenticated;
revoke all on public.program_policy_files from anon, authenticated;
grant select on public.program_policies to authenticated;
grant select on public.program_policy_files to authenticated;

-- ---------------------------------------------------------------------------
-- 3. add_policy: a program makes a policy (or a new version of one).

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
  if (select count(*) from public.program_policies where service_id = p_service_id and archived_at is null) >= 30 then
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

-- ---------------------------------------------------------------------------
-- 4. archive_policy: take a policy off. The row and its files stay.

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

revoke all on function public.add_policy(uuid, text, jsonb, uuid) from public, anon;
revoke all on function public.archive_policy(uuid) from public, anon;
grant execute on function public.add_policy(uuid, text, jsonb, uuid) to authenticated;
grant execute on function public.archive_policy(uuid) to authenticated;

comment on function public.add_policy is
  'A program lead makes a policy from files already put in their program''s '
  'folder of the policies bucket, or a new version of one (p_replaces), which '
  'archives the old (D-261, a25).';

-- ---------------------------------------------------------------------------
-- 5. The private bucket (10 MB a file, PDFs and photos only), and who reads it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'policies', 'policies', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The first folder of a path is the program's id.
create or replace function public.owns_policy_folder(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.services s
    where s.id::text = split_part(p_name, '/', 1)
      and s.org_id is not null and s.org_id = public.my_org()
  ) and public.my_role() = 'provider' and public.is_active_account();
$$;

-- Whether a file is one a person may read: a lead's own program, or a page of a
-- current policy of a live program.
create or replace function public.can_read_policy_file(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    coalesce(public.owns_policy_folder(p_name), false)
    or public.is_admin()
    or exists (
      select 1
      from public.program_policy_files f
      join public.program_policies p on p.id = f.policy_id
      join public.services s on s.id = p.service_id
      where f.path = p_name and p.archived_at is null and s.is_active and not s.needs_review
    );
$$;

revoke all on function public.owns_policy_folder(text) from public, anon;
revoke all on function public.can_read_policy_file(text) from public, anon;
grant execute on function public.owns_policy_folder(text) to authenticated;
grant execute on function public.can_read_policy_file(text) to authenticated;

create policy policies_insert_lead on storage.objects
  for insert to authenticated
  with check (bucket_id = 'policies' and public.owns_policy_folder(name));

create policy policies_select_readable on storage.objects
  for select to authenticated
  using (bucket_id = 'policies' and public.can_read_policy_file(name));

-- A lead takes back a file that never made it into a policy; one that did stays.
create policy policies_delete_unused on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'policies'
    and public.owns_policy_folder(name)
    and not exists (select 1 from public.program_policy_files f where f.path = storage.objects.name)
  );
