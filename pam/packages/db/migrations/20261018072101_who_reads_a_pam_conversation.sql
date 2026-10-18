-- who_reads_a_pam_conversation — the Pam team reads a person's Pam conversation, and nothing else (D-605, D-606).
--
-- Claimed 2026-10-18 07:21:01 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
-- Runs after `a_pam_conversation_is_a_kind_of_conversation`, `a_message_can_come_from_pam_itself` and
-- `a_system_message_says_what_it_is_by_a_key`.
--
-- EXPAND: a table, two helper functions, and policies that ADD access. No policy that exists is changed, dropped or made
-- narrower; `messages_select_conversation_member` keeps its comment ("deliberately NO admin policy") and is still the only
-- policy that lets anyone read a message in any conversation that is not a support one. Nothing creates a support
-- conversation until `open_pam_conversation()` (the next migration) and the switch (`pam_messaging_live`) are on.
--
-- What is added, and for whom:
--   * `is_pam_team()`: who the Pam team is. Today exactly `is_super_admin()`. EVERY Pam policy and function calls this, never
--     `is_super_admin()` directly, so adding support staff later is one function to widen (two sign-offs from Will).
--   * `is_support_conversation(id)`: a conversation of kind 'support'.
--   * The Pam team reads and writes in a support conversation (and reads its members, so the inbox and the thread header work).
--     `PAM_TEAM_CAN_READ.messages_written_to_pam` is this and only this. It names no case manager and no program: a guide, a
--     program lead and another member read nothing in it.
--   * The person in it can write to Pam when their account is `limited` too (Will, 18 October: "Limited accounts can message
--     Pam"); a `suspended` one cannot sign in at all. Every other conversation keeps D-413 ("a limited account can read but not
--     send"): this policy is scoped to support conversations only.
--   * Photos: the person in it and the Pam team can put a photo in a support conversation's folder of `message-photos`, and the
--     Pam team can read it (the person already can, `can_see_message_photo`). The bucket is the same private one (0079).
--   * `pam_threads`: one row per Pam conversation (`asker_id` is unique: one Pam conversation per person), for what the inbox
--     needs and nothing about the content. RLS on, readable and its status editable by the Pam team only; rows are created by
--     functions, never by a client.
-- Every table policy here is `to authenticated`: a visitor (anon) has no grant on these tables, and a policy that calls a function
-- the visitor may not run would otherwise fail instead of simply matching nothing.
-- Clients cannot create a conversation or a member row at all (0063 dropped those policies), so a support conversation exists
-- only because a function made it.

create or replace function public.is_pam_team()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select public.is_super_admin();
$$;

comment on function public.is_pam_team is
  'Who the Pam team is: today exactly the super admins. Every Pam policy and function calls this, so adding support staff is one place to widen (D-605, D-606).';

revoke all on function public.is_pam_team() from public, anon;
grant execute on function public.is_pam_team() to authenticated;

create or replace function public.is_support_conversation(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (select 1 from public.conversations c where c.id = p_conversation and c.kind = 'support');
$$;

revoke all on function public.is_support_conversation(uuid) from public, anon;
grant execute on function public.is_support_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- One row per Pam conversation.

create table if not exists public.pam_threads (
  conversation_id    uuid primary key references public.conversations (id) on delete cascade,
  asker_id           uuid not null unique references public.profiles (id) on delete cascade,
  status             text not null default 'open' check (status in ('open', 'closed')),
  -- When the out-of-hours reply last went (D-605): one per stretch of closed hours.
  last_auto_reply_at timestamptz,
  created_at         timestamptz not null default now()
);

comment on table public.pam_threads is
  'One row per Pam conversation (D-605): who asked, open or closed, when the out-of-hours reply last went. Nothing about the content. Read and closed or reopened by the Pam team only; created by functions.';

alter table public.pam_threads enable row level security;
alter table public.pam_threads force row level security;

revoke all on public.pam_threads from anon, authenticated;
grant select on public.pam_threads to authenticated;
grant update (status) on public.pam_threads to authenticated;

create policy pam_threads_select_team on public.pam_threads
  for select to authenticated using (public.is_pam_team());

create policy pam_threads_update_team on public.pam_threads
  for update to authenticated using (public.is_pam_team()) with check (public.is_pam_team());

-- ---------------------------------------------------------------------------
-- The Pam team, in a support conversation only.

create policy conversations_select_pam_team on public.conversations
  for select to authenticated using (public.is_pam_team() and kind = 'support');

create policy conversation_members_select_pam_team on public.conversation_members
  for select to authenticated using (public.is_pam_team() and public.is_support_conversation(conversation_id));

create policy messages_select_pam_team on public.messages
  for select to authenticated using (public.is_pam_team() and public.is_support_conversation(conversation_id));

create policy messages_insert_pam_team on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and public.is_pam_team()
    and public.is_support_conversation(conversation_id)
    and public.is_active_account()
  );

-- ---------------------------------------------------------------------------
-- The person, in their own support conversation, even when their account is limited.

create policy messages_insert_pam_asker on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and public.in_conversation(conversation_id)
    and public.is_support_conversation(conversation_id)
    and public.my_access_status() in ('active', 'limited')
    and public.my_feature_allowed('chat')
  );

-- ---------------------------------------------------------------------------
-- Photos in a support conversation: the same private bucket as every conversation (0079).

create policy message_photos_insert_pam_team on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'message-photos'
    and public.is_pam_team()
    and public.is_support_conversation(public.message_photo_conversation(name))
    and public.is_active_account()
  );

create policy message_photos_select_pam_team on storage.objects
  for select to authenticated
  using (
    bucket_id = 'message-photos'
    and public.is_pam_team()
    and public.is_support_conversation(public.message_photo_conversation(name))
  );

create policy message_photos_insert_pam_asker on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'message-photos'
    and coalesce(public.in_conversation(public.message_photo_conversation(name)), false)
    and public.is_support_conversation(public.message_photo_conversation(name))
    and public.my_access_status() in ('active', 'limited')
    and public.my_feature_allowed('chat')
  );
