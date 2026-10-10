-- A program lead's review record, a pending change, and the services a program
-- offers (D-462; Will, 10 October 2026: option A, "I trust you will make Pam
-- fully functional. Do what you must.").
--
-- Part 5a of "Load a program lead's own program" (before-launch, Programs):
-- the database half. The screens that read it, and the super admin's side of
-- the queue (approve / ask for changes / discard, part 6), come after.
--
-- EXPAND ONLY. Adds two tables, three functions and replaces one (same
-- signature). The live app calls none of the new ones; the replaced one,
-- `submit_program`, answers exactly as before and also leaves a record.
--
-- ## What this adds
--
-- 1. `program_submissions` — one row per send, as specified in
--    docs/design/program-review-queue.md (D-386): the history of what a lead
--    sent survives their deleting it and starting over, and a super admin can
--    see both. Two kinds: `new` (a program sent for its first check) and
--    `change` (D-447: a LIVE program's new name, address or kind of help,
--    held beside the live row, which keeps serving members until Pam approves).
-- 2. `withdraw_program_submission` — "Delete and start over" (D-385): the
--    submission becomes `withdrawn`, a first listing is deactivated so it can
--    never go live by being approved late, nothing is deleted. A new send links
--    to the one it replaces.
-- 3. `request_program_change` — D-447's pending change for a live program.
-- 4. `program_services` — the services a program offers (D-313), a child of the
--    program's own listing: name, a sentence or two, and where they differ from
--    the program's, a phone, website, address and hours. Members read a live
--    program's; its lead manages their own; nobody else writes. Policies per
--    service are the next table.
--
-- The super admin's decisions are not here: nothing in this file can approve,
-- ask for changes to, or discard a submission. Until part 6, a submission is
-- cleared the way a listing always has been (a super admin or an admin writing
-- `services` directly, 0007).

-- ---------------------------------------------------------------------------
-- 1. program_submissions

create table if not exists public.program_submissions (
  id            uuid primary key default gen_random_uuid(),
  -- The listing this is about: the one a `new` submission created, or the live
  -- program a `change` is for.
  service_id    uuid not null references public.services (id) on delete cascade,
  org_id        uuid references public.orgs (id) on delete set null,
  region_id     uuid references public.regions (id) on delete set null,
  -- Kept as a record if the account is erased: the audit log keeps six months
  -- (D-443); a submission is the program's, not the person's.
  submitted_by  uuid references public.profiles (id) on delete set null,
  kind          text not null default 'new' check (kind in ('new', 'change')),
  -- Exactly what was sent: what "What you sent" shows. For a `change`, only the
  -- fields being changed (name, category, subcategory, address).
  details       jsonb not null,
  sent_at       timestamptz not null default now(),
  status        text not null default 'in_review'
                check (status in ('in_review', 'changes_asked', 'approved', 'withdrawn', 'discarded')),
  -- Pam's note when it asks for changes; reaches the lead only.
  changes_note  text,
  -- The submission this one came after, when the lead started over.
  replaces_id   uuid references public.program_submissions (id) on delete set null,
  withdrawn_at  timestamptz,
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,

  constraint program_submissions_note_is_short check (changes_note is null or char_length(changes_note) <= 1000)
);

-- At most one open submission per listing: a program is checked once at a
-- time, and a live program has one change waiting at a time.
create unique index if not exists program_submissions_one_open
  on public.program_submissions (service_id) where status in ('in_review', 'changes_asked');
create index if not exists program_submissions_org_idx on public.program_submissions (org_id, sent_at desc);
create index if not exists program_submissions_open_idx
  on public.program_submissions (sent_at) where status in ('in_review', 'changes_asked');

comment on table public.program_submissions is
  'One row per time a program lead sends a program (or a change to a live one) '
  'for Pam to check (D-386, D-447). Members never see these. Written only by '
  'the functions below; a super admin reads them all.';

alter table public.program_submissions enable row level security;
alter table public.program_submissions force row level security;

-- A lead reads their own program's, whoever of its leads sent it. A super
-- admin reads every one, to review them. Nobody else, and nobody writes
-- directly: every change goes through a function that checks who is asking.
create policy program_submissions_select_own on public.program_submissions
  for select using (
    submitted_by = auth.uid()
    or (org_id is not null and org_id = public.my_org())
  );
create policy program_submissions_select_super_admin on public.program_submissions
  for select using (public.is_super_admin());

revoke all on public.program_submissions from anon, authenticated;
grant select on public.program_submissions to authenticated;

-- ---------------------------------------------------------------------------
-- submit_program (20261010042108), now also leaving the record. Same signature
-- and the same answers; one thing differs on purpose: a program that was
-- withdrawn (deactivated) no longer counts as "already in review", so the lead
-- can send again.
create or replace function public.submit_program(
  p_name        text,
  p_category    text,
  p_subcategory text default null,
  p_description text default null,
  p_address     text default null,
  p_phone       text default null,
  p_website     text default null
)
returns public.services
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller  uuid := auth.uid();
  me      public.profiles;
  org     uuid;
  listing public.services;
  earlier uuid;
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
  if not public.feature_allowed(caller, 'provider_listing') then
    raise exception 'LISTING_NOT_ALLOWED';
  end if;
  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'NAME_REQUIRED';
  end if;

  org := me.org_id;
  if org is null then
    insert into public.orgs (name, type, address, phone, website, region_id)
    values (
      btrim(p_name), 'program',
      nullif(btrim(coalesce(p_address, '')), ''),
      nullif(btrim(coalesce(p_phone, '')), ''),
      nullif(btrim(coalesce(p_website, '')), ''),
      me.region_id
    )
    returning id into org;

    update public.profiles set org_id = org where id = caller;
  elsif exists (
    select 1 from public.services s where s.org_id = org and s.needs_review and s.is_active
  ) then
    raise exception 'PROGRAM_ALREADY_IN_REVIEW';
  end if;

  insert into public.services (
    org_id, name, category, subcategory, description_plain,
    address, phone, website, source, needs_review, is_active
  )
  values (
    org,
    btrim(p_name),
    p_category::public.service_category,
    nullif(btrim(coalesce(p_subcategory, '')), ''),
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_address, '')), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_website, '')), ''),
    'manual', true, true
  )
  returning * into listing;

  -- The one this replaces, if the lead deleted an earlier send and started over.
  select ps.id into earlier
  from public.program_submissions ps
  where ps.org_id = org and ps.kind = 'new' and ps.status = 'withdrawn'
  order by ps.sent_at desc
  limit 1;

  insert into public.program_submissions (service_id, org_id, region_id, submitted_by, kind, details, replaces_id)
  values (
    listing.id, org, me.region_id, caller, 'new',
    jsonb_build_object(
      'name', listing.name,
      'category', listing.category,
      'subcategory', listing.subcategory,
      'description', listing.description_plain,
      'address', listing.address,
      'phone', listing.phone,
      'website', listing.website
    ),
    earlier
  );

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'program.submit', 'service', listing.id,
          jsonb_build_object('name', listing.name));

  return listing;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. withdraw_program_submission: Delete and start over (D-385).
create or replace function public.withdraw_program_submission(p_id uuid)
returns public.program_submissions
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  sub    public.program_submissions;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if public.my_role() is distinct from 'provider' then
    raise exception 'NOT_A_PROGRAM_LEAD';
  end if;

  -- Their own program's only; anything else reads as not found, so a guess at
  -- somebody else's id learns nothing.
  select * into sub
  from public.program_submissions ps
  where ps.id = p_id
    and (ps.submitted_by = caller or (ps.org_id is not null and ps.org_id = public.my_org()))
  for update;
  if sub.id is null then
    raise exception 'SUBMISSION_NOT_FOUND';
  end if;
  if sub.status not in ('in_review', 'changes_asked') then
    raise exception 'SUBMISSION_NOT_OPEN';
  end if;

  update public.program_submissions
  set status = 'withdrawn', withdrawn_at = now()
  where id = sub.id
  returning * into sub;

  -- A first listing is taken off so it can never go live by being approved
  -- late; the row stays, as the record of what was sent. A change leaves the
  -- live program exactly as it was.
  if sub.kind = 'new' then
    update public.services set is_active = false where id = sub.service_id and needs_review;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'program.withdraw', 'program_submission', sub.id,
          jsonb_build_object('kind', sub.kind));

  return sub;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. request_program_change: a live program's name, address or kind of help
-- (D-447). The live row is not touched; the change waits beside it. Asking
-- again while one waits corrects that same request (it is the same request,
-- fixed), as D-386 does for a first send.
create or replace function public.request_program_change(
  p_service_id  uuid,
  p_name        text,
  p_category    text,
  p_subcategory text default null,
  p_address     text default null
)
returns public.program_submissions
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller  uuid := auth.uid();
  me      public.profiles;
  live    public.services;
  open_id uuid;
  sub     public.program_submissions;
  wanted  jsonb;
  new_cat public.service_category;
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
  if not public.feature_allowed(caller, 'provider_listing') then
    raise exception 'LISTING_NOT_ALLOWED';
  end if;
  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'NAME_REQUIRED';
  end if;

  select * into live from public.services s
  where s.id = p_service_id and s.org_id is not null and s.org_id = me.org_id;
  if live.id is null then
    raise exception 'PROGRAM_NOT_FOUND';
  end if;
  -- A program still waiting for its first check is changed directly (it is not
  -- live yet); only a live one holds a change beside it.
  if live.needs_review or not live.is_active then
    raise exception 'PROGRAM_NOT_LIVE';
  end if;

  new_cat := p_category::public.service_category;
  wanted := jsonb_build_object(
    'name', btrim(p_name),
    'category', new_cat,
    'subcategory', nullif(btrim(coalesce(p_subcategory, '')), ''),
    'address', nullif(btrim(coalesce(p_address, '')), '')
  );
  if btrim(p_name) = live.name
     and new_cat = live.category
     and (wanted->>'subcategory') is not distinct from live.subcategory
     and (wanted->>'address') is not distinct from live.address then
    raise exception 'NOTHING_TO_CHANGE';
  end if;

  select ps.id into open_id
  from public.program_submissions ps
  where ps.service_id = live.id and ps.status in ('in_review', 'changes_asked')
  for update;

  if open_id is not null then
    update public.program_submissions
    set details = wanted, status = 'in_review', changes_note = null, sent_at = now(), submitted_by = caller
    where id = open_id
    returning * into sub;
  else
    insert into public.program_submissions (service_id, org_id, region_id, submitted_by, kind, details)
    values (live.id, live.org_id, me.region_id, caller, 'change', wanted)
    returning * into sub;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'program.change_requested', 'program_submission', sub.id,
          jsonb_build_object('name', live.name));

  return sub;
end;
$$;

revoke all on function public.withdraw_program_submission(uuid) from public, anon;
revoke all on function public.request_program_change(uuid, text, text, text, text) from public, anon;
grant execute on function public.withdraw_program_submission(uuid) to authenticated;
grant execute on function public.request_program_change(uuid, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. program_services: the services a program offers (D-313).

create table if not exists public.program_services (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.services (id) on delete cascade,
  name        text not null,
  -- "A sentence or two, in the program's own words."
  description text,
  -- Where they differ from the program's own (blank: the program's).
  phone       text,
  website     text,
  address     text,
  hours       jsonb,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint program_services_name_present check (char_length(btrim(name)) between 1 and 80),
  constraint program_services_description_short check (description is null or char_length(description) <= 300),
  constraint program_services_phone_e164 check (phone is null or phone ~ '^\+[1-9]\d{7,14}$')
);

create index if not exists program_services_program_idx on public.program_services (service_id, sort_order);

create or replace trigger program_services_touch
  before update on public.program_services
  for each row execute function public.touch_updated_at();

comment on table public.program_services is
  'The things a program does (GED classes, the computer room), each with its '
  'own phone, website, address and hours where they differ from the program''s '
  '(D-313). A member sees a live program''s; its lead manages their own.';

alter table public.program_services enable row level security;
alter table public.program_services force row level security;

-- Members and visitors read a live program's services (the same rule as the
-- listing itself, 0007: active and not waiting for review). Its lead reads
-- their own whatever the program's state, so they can set them up while it is
-- being checked; an admin reads all.
create policy program_services_select_public on public.program_services
  for select using (
    exists (
      select 1 from public.services s
      where s.id = service_id and s.is_active and not s.needs_review
    )
  );
create policy program_services_select_own on public.program_services
  for select using (
    exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  );
create policy program_services_select_admin on public.program_services
  for select using (public.is_admin());

-- Writes: the lead of the program, and admins, never a `for all` policy (a
-- `for all` is evaluated on every SELECT as well, CLAUDE.md "Verify, don't
-- assume").
create policy program_services_insert_own on public.program_services
  for insert with check (
    public.my_role() = 'provider'
    and public.feature_allowed(auth.uid(), 'provider_listing')
    and exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  );
create policy program_services_update_own on public.program_services
  for update using (
    public.my_role() = 'provider'
    and public.feature_allowed(auth.uid(), 'provider_listing')
    and exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  )
  with check (
    exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  );
create policy program_services_delete_own on public.program_services
  for delete using (
    public.my_role() = 'provider'
    and public.feature_allowed(auth.uid(), 'provider_listing')
    and exists (
      select 1 from public.services s
      where s.id = service_id and s.org_id is not null and s.org_id = public.my_org()
    )
  );
create policy program_services_write_admin_insert on public.program_services
  for insert with check (public.is_admin());
create policy program_services_write_admin_update on public.program_services
  for update using (public.is_admin()) with check (public.is_admin());
create policy program_services_write_admin_delete on public.program_services
  for delete using (public.is_admin());

revoke all on public.program_services from anon, authenticated;
grant select on public.program_services to anon, authenticated;
grant insert, update, delete on public.program_services to authenticated;
