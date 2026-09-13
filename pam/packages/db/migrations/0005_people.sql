-- 0005 — People: connections, chat, buddy activity, safety (§6).

create table public.connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id  uuid not null references public.profiles (id) on delete cascade,
  kind         public.connection_kind not null,
  status       public.connection_status not null default 'pending',
  -- §6.2 step 5: a block is permanent and hides both users from each other.
  blocked_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  responded_at timestamptz,

  constraint connections_distinct_people check (requester_id <> receiver_id),
  constraint connections_blocked_has_blocker check (
    (status = 'blocked') = (blocked_by is not null)
  )
);

-- One connection per pair per kind, in either direction. The least/greatest
-- pair means A->B and B->A collapse to the same row, so two people cannot end
-- up with mirrored pending requests.
create unique index connections_pair_kind_uniq on public.connections (
  least(requester_id, receiver_id),
  greatest(requester_id, receiver_id),
  kind
);
create index connections_receiver_pending_idx on public.connections (receiver_id)
  where status = 'pending';
create index connections_accepted_idx on public.connections (requester_id, receiver_id)
  where status = 'accepted';

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  kind       public.conversation_kind not null default 'direct',
  -- §4.1 step 3: the admin who made the introduction is shown as "introduced
  -- by" in the chat header. They are NOT a conversation member and cannot read
  -- the messages — this column is a label, not an access grant.
  introduced_by uuid references public.profiles (id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz,
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create index conversation_members_profile_idx on public.conversation_members (profile_id);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text,
  -- Voice notes and photos (§6.2 step 4) live in Storage; this is the object path.
  attachment_url  text,
  attachment_kind text,
  -- §6.4 / §11: moderation flags for admin review. Never auto-deleted.
  flagged_at      timestamptz,
  flag_reason     text,
  created_at      timestamptz not null default now(),

  constraint messages_has_content check (body is not null or attachment_url is not null),
  constraint messages_attachment_kind_known check (
    attachment_kind is null or attachment_kind in ('voice', 'photo')
  )
);

create index messages_conversation_idx on public.messages (conversation_id, created_at desc);
create index messages_flagged_idx on public.messages (flagged_at) where flagged_at is not null;

-- ---------------------------------------------------------------------------
-- Buddy activity feed (§6.3).
-- ---------------------------------------------------------------------------

create table public.activities (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles (id) on delete cascade,
  type       public.activity_type not null,
  ref_id     uuid,
  points     integer not null default 0,
  note       text,
  -- Defaults to private. A member opts in once, then per-activity (§6.3).
  visibility public.activity_visibility not null default 'private',
  created_at timestamptz not null default now()
);

create index activities_member_idx on public.activities (member_id, created_at desc);
create index activities_buddy_feed_idx on public.activities (created_at desc)
  where visibility = 'buddies';

create table public.activity_reactions (
  activity_id uuid not null references public.activities (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  -- §6.3: exactly three one-tap reactions.
  reaction    text not null,
  created_at  timestamptz not null default now(),
  primary key (activity_id, profile_id),
  constraint activity_reactions_known check (reaction in ('thumbs_up', 'fire', 'heart'))
);

-- ---------------------------------------------------------------------------
-- Safety (§6.5).
-- ---------------------------------------------------------------------------

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id   uuid not null,
  reason      text,
  -- Denormalised so an admin reviewing a flag does not need read access to the
  -- whole conversation. §4.1: admins see flagged messages routed THROUGH
  -- reports — this column is that route, and it is the only message text an
  -- admin can ever see.
  target_excerpt text,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolution  text,
  created_at  timestamptz not null default now(),

  constraint reports_target_type_known check (
    target_type in ('message', 'profile', 'service', 'activity')
  )
);

create index reports_open_idx on public.reports (created_at desc) where resolved_at is null;
create index reports_target_idx on public.reports (target_type, target_id);

-- ---------------------------------------------------------------------------
-- Points (§8). The ledger is append-only: no UPDATE or DELETE policy is ever
-- granted on it, and balance is always sum(delta). See 0007 for the guard.
-- ---------------------------------------------------------------------------

create table public.points_ledger (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.profiles (id) on delete cascade,
  delta       integer not null,
  reason      text not null,
  activity_id uuid references public.activities (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index points_ledger_member_idx on public.points_ledger (member_id, created_at desc);

create table public.badges (
  id                uuid primary key default gen_random_uuid(),
  key               text not null unique,
  name              text not null,
  label_key         text not null,
  description_plain text not null,
  icon              text not null,
  -- Evaluated nightly by the badge job; mirrors BADGES in @pam/config/points.
  rule              jsonb not null,
  created_at        timestamptz not null default now()
);

create table public.member_badges (
  member_id uuid not null references public.profiles (id) on delete cascade,
  badge_id  uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (member_id, badge_id)
);

insert into public.badges (key, name, label_key, description_plain, icon, rule) values
  ('first_visit', 'First Visit', 'badge.first_visit',
   'You went to your first visit.', 'map-pin',
   '{"type":"count","of":"attended_appointments","atLeast":1}'),
  ('four_week_streak', '4-Week Streak', 'badge.four_week_streak',
   'You went 4 weeks in a row.', 'flame',
   '{"type":"streak","weeks":4}'),
  ('got_my_id', 'Got My ID', 'badge.got_my_id',
   'You finished getting your ID papers.', 'badge-check',
   '{"type":"completed_enrollment","subcategory":"id_documents"}'),
  ('first_paycheck', 'First Paycheck', 'badge.first_paycheck',
   'You started a job.', 'briefcase',
   '{"type":"completed_enrollment","subcategory":"job_openings"}'),
  ('family_time', 'Family Time', 'badge.family_time',
   'You went to something for you and your family.', 'heart',
   '{"type":"completed_enrollment","subcategory":"kids_parenting"}'),
  ('helped_a_buddy', 'Helped a Buddy', 'badge.helped_a_buddy',
   'You cheered on a buddy.', 'users',
   '{"type":"count","of":"buddy_reactions_sent","atLeast":5}');
