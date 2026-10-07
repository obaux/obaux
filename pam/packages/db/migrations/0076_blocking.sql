-- 0076 — 0069 "blocking", carried over (D-346).
--
-- Written as 0069 on branch claude/hopeful-thompson-07nj7n and held back.
-- Renumbered to run after 0072, and reconciled with it: 0069 rewrote
-- `can_message` from 0063's two arms, which would have silently removed
-- 0072's third (the super admin <-> case managers and program leads). The
-- version below is 0069's block rule wrapped round all three arms.
--
-- 0069 — Blocking, from inside a conversation.
--
-- The privacy page has promised it since 13 September ("Block someone, or
-- report a message that is not safe. Both work from inside the chat") and
-- nothing in the app did it. `connections.status = 'blocked'` (0005) is a
-- member-to-member thing, one row per pair *per kind* (mentor, buddy); PAM's
-- conversations are between a member and their own case manager or program
-- (0063), which is not a connection at all. So a block gets a table of its
-- own, keyed by the two people and nothing else (D-206).
--
-- What a block does:
--   * neither person can send another message in any conversation they share;
--   * neither can open a new one (`can_message()` says no);
--   * the one blocked drops out of the blocker's "New message" list, and the
--     blocker out of theirs;
--   * everything already said stays readable to both, and reportable — a block
--     is not a way to destroy what was said before it.
--
-- Unlike a block between two members (§6.2 step 5, permanent), this one can be
-- undone by the person who made it: the other person is somebody's case
-- manager or program, and a mistaken tap should not cut a member off from
-- their own case manager for good (D-206). Only the blocker can undo it.

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_distinct_people check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

comment on table public.blocks is
  'Somebody stopped messages between themselves and somebody else. Written '
  'only by block_in_conversation()/unblock_in_conversation(); read by the '
  'blocker, and by the functions that enforce it (0069).';

alter table public.blocks enable row level security;
alter table public.blocks force row level security;

revoke all on public.blocks from anon, authenticated;
grant select on public.blocks to authenticated;

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select using (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- The existing block question answers for both kinds of block now, so every
-- policy that already asks it (profiles, connections) respects this one too.

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select (auth.uid() = a or auth.uid() = b) and (
    exists (
      select 1 from public.connections c
      where c.status = 'blocked'
        and ((c.requester_id = a and c.receiver_id = b) or (c.requester_id = b and c.receiver_id = a))
    )
    or exists (
      select 1 from public.blocks k
      where (k.blocker_id = a and k.blocked_id = b) or (k.blocker_id = b and k.blocked_id = a)
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- Who may message whom (0063), minus anybody on either side of a block.

create or replace function public.can_message(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a is not null and b is not null and a <> b
  and not exists (
    select 1 from public.blocks k
    where (k.blocker_id = a and k.blocked_id = b) or (k.blocker_id = b and k.blocked_id = a)
  )
  and (
    -- case manager <-> assigned member, either way round
    exists (
      select 1 from public.admin_assignments x
      where x.ended_at is null
        and ((x.admin_id = a and x.member_id = b) or (x.admin_id = b and x.member_id = a))
    )
    -- program admin <-> member enrolled in their org's service, either way round
    or exists (
      select 1
      from public.enrollments e
      join public.services s on s.id = e.service_id
      join public.profiles staff on staff.role = 'provider' and staff.org_id = s.org_id
      where s.org_id is not null
        and ((staff.id = a and e.member_id = b) or (staff.id = b and e.member_id = a))
    )
    -- the person running PAM <-> a case manager or a program lead, either
    -- way round (0072, D-262), kept when this was carried over (0076).
    -- Never a member: that line does not move.
    or exists (
      select 1
      from public.profiles pa
      join public.profiles pb on pb.id = b
      where pa.id = a
        and (
          (pa.role = 'super_admin' and pb.role in ('admin', 'provider'))
          or (pb.role = 'super_admin' and pa.role in ('admin', 'provider'))
        )
    )
  );
$$;

revoke all on function public.can_message(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Sending: refused into a conversation where either side has blocked.

create or replace function public.conversation_has_block(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.conversation_members other
    join public.blocks k
      on (k.blocker_id = other.profile_id and k.blocked_id = auth.uid())
      or (k.blocker_id = auth.uid() and k.blocked_id = other.profile_id)
    where other.conversation_id = p_conversation
      and other.profile_id <> auth.uid()
  );
$$;

revoke all on function public.conversation_has_block(uuid) from public, anon;
grant execute on function public.conversation_has_block(uuid) to authenticated;

drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.in_conversation(conversation_id)
    and public.is_active_account()
    and public.my_feature_allowed('chat')
    and not public.conversation_has_block(conversation_id)
  );

-- ---------------------------------------------------------------------------
-- What the screen needs to know, and the two things it can do.

create or replace function public.conversation_block_state(p_conversation uuid)
returns table (i_blocked boolean, blocked_me boolean)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    exists (
      select 1 from public.blocks k
      join public.conversation_members other
        on other.profile_id = k.blocked_id and other.conversation_id = p_conversation
      where k.blocker_id = auth.uid()
    ),
    exists (
      select 1 from public.blocks k
      join public.conversation_members other
        on other.profile_id = k.blocker_id and other.conversation_id = p_conversation
      where k.blocked_id = auth.uid()
    )
  where public.in_conversation(p_conversation);
$$;

comment on function public.conversation_block_state is
  'For a conversation the caller is in: whether they blocked the other person, '
  'and whether the other person blocked them. No row for anybody else (0069).';

revoke all on function public.conversation_block_state(uuid) from public, anon;
grant execute on function public.conversation_block_state(uuid) to authenticated;

create or replace function public.block_in_conversation(p_conversation uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  other  uuid;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if not public.in_conversation(p_conversation) then
    raise exception 'That conversation is not yours';
  end if;

  select m.profile_id into other
  from public.conversation_members m
  where m.conversation_id = p_conversation and m.profile_id <> caller
  limit 1;

  if other is null then
    raise exception 'There is nobody else in that conversation';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (caller, other)
  on conflict do nothing;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'profile.block', 'profile', other,
          jsonb_build_object('conversation_id', p_conversation));
end;
$$;

revoke all on function public.block_in_conversation(uuid) from public, anon;
grant execute on function public.block_in_conversation(uuid) to authenticated;

create or replace function public.unblock_in_conversation(p_conversation uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  n      integer;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if not public.in_conversation(p_conversation) then
    raise exception 'That conversation is not yours';
  end if;

  -- Only ever the caller's own block: a block made by the other person is
  -- theirs to lift.
  delete from public.blocks k
  using public.conversation_members other
  where other.conversation_id = p_conversation
    and other.profile_id <> caller
    and k.blocker_id = caller
    and k.blocked_id = other.profile_id;
  get diagnostics n = row_count;

  if n > 0 then
    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'profile.unblock', 'conversation', p_conversation, '{}'::jsonb);
  end if;
end;
$$;

revoke all on function public.unblock_in_conversation(uuid) from public, anon;
grant execute on function public.unblock_in_conversation(uuid) to authenticated;
