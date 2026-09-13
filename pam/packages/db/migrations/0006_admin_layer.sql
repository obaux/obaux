-- 0006 — The admin layer: facilitation, access control, audit (§4.1).
--
-- "Admin ≠ surveillance." The tables here give admins exactly the powers §4.1
-- names and no more. Two rules shape every column:
--   1. Every access change carries a reason and is logged.
--   2. The affected user sees a plain-language note, never the raw reason.

create table public.facilitations (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references public.profiles (id) on delete cascade,
  member_id   uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid references public.profiles (id) on delete set null,
  service_id  uuid references public.services (id) on delete set null,
  -- The admin's one-line introduction ("Marcus wants to start GED classes").
  -- Shown to the provider. Plain language, no justice detail (§9 applies).
  note_plain  text,
  status      public.facilitation_status not null default 'proposed',
  -- Set when the provider accepts and the enrollment + conversation are made.
  enrollment_id   uuid references public.enrollments (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  declined_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint facilitations_distinct check (member_id <> admin_id),
  constraint facilitations_has_target check (provider_id is not null or service_id is not null)
);

create index facilitations_member_idx on public.facilitations (member_id, created_at desc);
create index facilitations_admin_idx on public.facilitations (admin_id, created_at desc);
create index facilitations_provider_open_idx on public.facilitations (provider_id)
  where status = 'proposed';

comment on table public.facilitations is
  'Admin-made introductions. The admin sees status only, never the resulting '
  'conversation (SOP §4.1 step 5).';

-- ---------------------------------------------------------------------------
-- Per-feature access control (§4.1).
-- ---------------------------------------------------------------------------

create table public.access_controls (
  id         uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.profiles (id) on delete cascade,
  feature    public.controllable_feature not null,
  allowed    boolean not null,
  set_by     uuid not null references public.profiles (id) on delete cascade,
  -- Required. §4.1: "Every change requires a reason and is logged."
  -- Internal only — never rendered to the affected user.
  reason     text not null,
  -- What the affected user is shown instead. Plain language, no justice terms.
  user_facing_note text,
  updated_at timestamptz not null default now(),

  unique (subject_id, feature),
  constraint access_controls_reason_present check (length(btrim(reason)) > 0)
);

create index access_controls_subject_idx on public.access_controls (subject_id);

comment on column public.access_controls.reason is
  'Internal justification. Never shown to the subject — see user_facing_note.';

-- ---------------------------------------------------------------------------
-- Audit log (§4.1: "Admin actions go through RLS like everyone else and are
-- written to audit_log").
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);
create index audit_log_target_idx on public.audit_log (target_type, target_id);

comment on table public.audit_log is
  'Append-only. No UPDATE or DELETE policy is granted to any role, including admins.';

-- ---------------------------------------------------------------------------
-- Invite code generation.
-- ---------------------------------------------------------------------------

-- Alphabet excludes 0/O, 1/I/L, 2/Z, 5/S, 8/B so a code survives being read
-- aloud over a bad phone line or copied off a scrap of paper (§4.1).
create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := '34679ACDEFGHJKMNPQRTUVWXY';
  candidate text;
  attempt integer := 0;
begin
  loop
    candidate := '';
    for i in 1..8 loop
      -- gen_random_bytes lives in the extensions schema; search_path covers it.
      candidate := candidate || substr(
        alphabet,
        1 + (get_byte(gen_random_bytes(1), 0) % length(alphabet)),
        1
      );
    end loop;

    exit when not exists (select 1 from public.invites where code = candidate);

    attempt := attempt + 1;
    if attempt > 20 then
      raise exception 'Could not generate a unique invite code after 20 attempts';
    end if;
  end loop;

  return candidate;
end;
$$;

comment on function public.generate_invite_code is
  'Returns an 8-character code with no ambiguous glyphs, safe to read aloud.';

-- Keeps updated_at honest without every caller remembering to set it.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();
create trigger enrollments_touch before update on public.enrollments
  for each row execute function public.touch_updated_at();
create trigger facilitations_touch before update on public.facilitations
  for each row execute function public.touch_updated_at();
create trigger access_controls_touch before update on public.access_controls
  for each row execute function public.touch_updated_at();
