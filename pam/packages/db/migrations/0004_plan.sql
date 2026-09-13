-- 0004 — My Plan: enrollments, appointments, reminders, tasks (§7).
--
-- The core loop this table set exists to serve:
--   Find place -> I'm interested -> Contact -> Enrolled -> Appointment
--   -> Reminder -> Attend -> Check in -> Points -> Next step

create table public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  status     public.enrollment_status not null default 'interested',
  started_at timestamptz,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (member_id, service_id)
);

create index enrollments_member_idx on public.enrollments (member_id);
create index enrollments_service_idx on public.enrollments (service_id);

create table public.appointments (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.profiles (id) on delete cascade,
  service_id    uuid references public.services (id) on delete set null,
  provider_id   uuid references public.profiles (id) on delete set null,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  -- The member's IANA zone, captured at creation. Reminder send_at is computed
  -- from this, not from the server's zone — an 8am "morning of" text must land
  -- at 8am where the member actually is (§7.2).
  timezone      text not null default 'America/New_York',
  location_text text,
  geo           extensions.geography(Point, 4326),
  status        public.appointment_status not null default 'scheduled',
  -- §7.3: a recurring series shares a parent so "every week" is one tap.
  series_id     uuid,
  -- Short code the provider scans or types at check-in (§3.2 Check-in tab).
  check_in_code text unique,
  checked_in_at timestamptz,
  attendance_method public.attendance_method,
  created_at    timestamptz not null default now(),

  constraint appointments_ends_after_starts check (ends_at is null or ends_at > starts_at),
  -- An attended appointment must say how we know. This is what keeps the §8
  -- points award honest.
  constraint appointments_attended_has_method check (
    status <> 'attended' or attendance_method is not null
  )
);

create index appointments_member_time_idx on public.appointments (member_id, starts_at);
create index appointments_provider_idx on public.appointments (provider_id, starts_at);
create index appointments_series_idx on public.appointments (series_id) where series_id is not null;
create index appointments_followup_idx on public.appointments (ends_at)
  where status = 'scheduled';

create table public.reminders (
  id               uuid primary key default gen_random_uuid(),
  appointment_id   uuid not null references public.appointments (id) on delete cascade,
  member_id        uuid not null references public.profiles (id) on delete cascade,
  channel          public.reminder_channel not null default 'sms',
  send_at          timestamptz not null,
  sent_at          timestamptz,
  status           public.reminder_status not null default 'scheduled',
  -- Key into @pam/config/sms-templates. The dispatcher refuses to send a
  -- template with no reviewedBy, so an unreviewed key fails loudly here.
  message_template text not null,
  failure_reason   text,
  created_at       timestamptz not null default now()
);

-- The cron dispatcher polls this. Partial index keeps that query cheap as the
-- sent-reminder history grows.
create index reminders_due_idx on public.reminders (send_at)
  where status = 'scheduled';
create index reminders_member_idx on public.reminders (member_id);

-- §7.2: quiet hours, and the STOP unsubscribe, both live per-member.
create table public.notification_preferences (
  member_id        uuid primary key references public.profiles (id) on delete cascade,
  sms_enabled      boolean not null default true,
  push_enabled     boolean not null default true,
  -- §6.3: buddies are notified by push digest, never SMS, unless turned on here.
  buddy_sms_enabled boolean not null default false,
  quiet_hours_start smallint not null default 21,
  quiet_hours_end   smallint not null default 7,
  -- Set by the Twilio STOP webhook. Honoured immediately and never overridden
  -- by an app-side preference change (§7.2 acceptance, Twilio compliance).
  sms_stopped_at   timestamptz,
  updated_at       timestamptz not null default now(),

  constraint quiet_hours_valid check (
    quiet_hours_start between 0 and 23 and quiet_hours_end between 0 and 23
  )
);

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.profiles (id) on delete cascade,
  title_plain text not null,
  category    public.service_category,
  service_id  uuid references public.services (id) on delete set null,
  due_at      timestamptz,
  done_at     timestamptz,
  points      integer not null default 10,
  -- 'onboarding' | 'enrollment' | 'reschedule' | 'ai_suggestion' | 'admin'
  source      text not null default 'system',
  -- §7.1: the call script shown with a "Call X to sign up" task.
  script_plain text,
  created_at  timestamptz not null default now(),

  constraint tasks_points_in_range check (points between 10 and 50)
);

create index tasks_member_open_idx on public.tasks (member_id, due_at) where done_at is null;
