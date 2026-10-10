-- Members sign a program's policies, and keep their signature (D-261, D-270,
-- D-485; Will's card a25, points 1, 2, 3 and 6). Part 2 of 4.
--
--   * `policy_signatures` — one row per member per policy: when, and the picture
--     they signed with (each policy keeps its own picture, D-271). Written only by
--     `sign_policy`. A member reads their own, and no one else's. A program does
--     NOT read this table: it reads names and dates through part 3's function,
--     never the picture (a25 point 1).
--   * `member_signatures` — the member's saved signature, so the next policy is
--     one tap. Kept with the account, private, shown only to them (point 1);
--     they can forget it.
--   * `sign_policy(policy, image)` — a member signs a CURRENT policy of a live
--     program; signing again replaces the picture and the date (the corner × on
--     the screen, D-271). A policy that has been replaced by a new version is
--     simply a different policy: nobody has signed it, so people are asked again
--     (point 3), and what they signed before stays as the record.
--   * People who signed a policy keep their copy after it is archived: a member
--     reads a policy, and its pages, if they signed it, even once it is replaced
--     or removed (point 4).
--
-- Nothing here stops a booking (point 6): this only records.
--
-- Signed pictures are PNG data URLs, up to 200 KB, in a column of a table only
-- the member can read; there is no second bucket to keep private.
--
-- EXPAND ONLY: new tables, functions, policies; `can_read_policy_file` is
-- replaced with the same signature to add "or one they signed". No drops.

create table if not exists public.member_signatures (
  member_id  uuid primary key references public.profiles (id) on delete cascade,
  image      text not null,
  updated_at timestamptz not null default now(),

  constraint member_signatures_is_a_png check (image like 'data:image/png;base64,%' and char_length(image) <= 200000)
);

create table if not exists public.policy_signatures (
  id        uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.program_policies (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  signed_at timestamptz not null default now(),
  image     text not null,

  constraint policy_signatures_once unique (policy_id, member_id),
  constraint policy_signatures_is_a_png check (image like 'data:image/png;base64,%' and char_length(image) <= 200000)
);

create index if not exists policy_signatures_member_idx on public.policy_signatures (member_id);

comment on table public.policy_signatures is
  'A member signed a program''s policy (a record that they read and agreed, D-485). '
  'Private to the member; a program reads names and dates only, through a function, never the picture.';

alter table public.member_signatures enable row level security;
alter table public.member_signatures force row level security;
alter table public.policy_signatures enable row level security;
alter table public.policy_signatures force row level security;

create policy member_signatures_select_own on public.member_signatures
  for select to authenticated using (member_id = auth.uid());
create policy policy_signatures_select_own on public.policy_signatures
  for select to authenticated using (member_id = auth.uid());

revoke all on public.member_signatures from anon, authenticated;
revoke all on public.policy_signatures from anon, authenticated;
grant select on public.member_signatures to authenticated;
grant select on public.policy_signatures to authenticated;

-- A member reads a policy they signed even after it was replaced or removed.
create policy program_policies_select_signed on public.program_policies
  for select to authenticated using (
    exists (select 1 from public.policy_signatures s where s.policy_id = program_policies.id and s.member_id = auth.uid())
  );

-- ... and its pages (same signature as P1's, now also "or one they signed").
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
    )
    or exists (
      select 1
      from public.program_policy_files f
      join public.policy_signatures sig on sig.policy_id = f.policy_id
      where f.path = p_name and sig.member_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- sign_policy: a member signs one.

create or replace function public.sign_policy(p_policy_id uuid, p_image text default null)
returns public.policy_signatures
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  image  text := p_image;
  signed public.policy_signatures;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if public.my_role() is distinct from 'member' then
    raise exception 'NOT_A_MEMBER';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;

  -- Only a current policy of a live program can be signed.
  if not exists (
    select 1
    from public.program_policies p
    join public.services s on s.id = p.service_id
    where p.id = p_policy_id and p.archived_at is null and s.is_active and not s.needs_review
  ) then
    raise exception 'POLICY_NOT_FOUND';
  end if;

  -- Their saved signature when none is given.
  if image is null then
    select m.image into image from public.member_signatures m where m.member_id = caller;
  end if;
  if image is null then
    raise exception 'SIGNATURE_REQUIRED';
  end if;

  insert into public.policy_signatures (policy_id, member_id, image)
  values (p_policy_id, caller, image)
  on conflict (policy_id, member_id)
  do update set image = excluded.image, signed_at = now()
  returning * into signed;

  -- It becomes their saved signature, so the next one is a tap.
  insert into public.member_signatures (member_id, image)
  values (caller, image)
  on conflict (member_id) do update set image = excluded.image, updated_at = now();

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'policy.sign', 'program_policy', p_policy_id, '{}'::jsonb);

  return signed;
end;
$$;

-- forget_my_signature: they can clear it; signed policies keep the picture they were signed with.
create or replace function public.forget_my_signature()
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from public.member_signatures where member_id = auth.uid();
$$;

revoke all on function public.sign_policy(uuid, text) from public, anon;
revoke all on function public.forget_my_signature() from public, anon;
grant execute on function public.sign_policy(uuid, text) to authenticated;
grant execute on function public.forget_my_signature() to authenticated;

comment on function public.sign_policy is
  'A member signs a current policy of a live program (D-485): a record that they '
  'read and agreed. Signing again replaces the picture and the date. Nothing here '
  'stops a booking.';
