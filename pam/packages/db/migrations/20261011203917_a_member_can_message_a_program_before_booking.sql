-- A member can message a program before booking a visit (D-541).
--
-- Will, 11 October: residents must be able to message programs even before
-- booking. Until now the only road to a program's lead was an enrollment, and
-- nothing in the app writes one. Two parts, both here:
--
--   * message_program(service): the member opens (or reuses) a conversation
--     with ONE lead of the program's organisation. Only a member starts it.
--   * can_start_conversation(a, b): who may open a NEW conversation. It is
--     can_message() plus one arm: a program lead and a member who has a
--     non-cancelled visit at the lead's org (enrolled members are already in
--     can_message). A member who has only written to a program is NOT linked:
--     a conversation is not a relationship. They are not on the lead's New
--     message list, and people_activity(), the caseload and the visits reads
--     (which use can_message or enrollments/appointments) learn nothing about
--     them. The lead answers inside the conversation, which needs no rule of
--     its own: the message policy lets any member of a conversation send into it
--     (active account, chat feature, no block).
--
-- Why one lead and not all of them: a conversation is two people (members,
-- unread counts, blocks and notifications are all per pair). A group would put
-- every colleague's name in front of a person who wrote to "a program", and a
-- block would silence one of several. The lead is the longest-standing active
-- lead of the organisation; if the member already has a conversation with an
-- active lead there, that one is reused; if the lead is later suspended or
-- blocks the member, the next message opens one with the next lead.

create or replace function public.can_start_conversation(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select public.can_message(a, b)
  or (
    a is not null and b is not null and a <> b
    and not exists (
      select 1 from public.blocks k
      where (k.blocker_id = a and k.blocked_id = b) or (k.blocker_id = b and k.blocked_id = a)
    )
    and (
      -- a visit that has not been cancelled, at the lead's org
      exists (
        select 1
        from public.appointments ap
        join public.services s on s.id = ap.service_id
        join public.profiles staff on staff.org_id = s.org_id and staff.access_status = 'active'
        join public.profile_roles sr on sr.profile_id = staff.id and sr.role = 'provider'
        where s.org_id is not null
          and ap.status <> 'cancelled'
          and ((staff.id = a and ap.member_id = b) or (staff.id = b and ap.member_id = a))
      )
    )
  );
$$;

revoke all on function public.can_start_conversation(uuid, uuid) from public, anon, authenticated;

comment on function public.can_start_conversation is
  'Who may open a NEW conversation (D-541): can_message(), or a program lead and '
  'a member with a non-cancelled visit at the lead''s org. A member opening one '
  'with a program before any visit goes through message_program(), not this.';

create or replace function public.open_direct_conversation(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  existing uuid;
  created uuid;
begin
  if caller is null then
    raise exception 'Sign in to start a conversation';
  end if;
  if not public.is_active_account() then
    raise exception 'This account cannot start a conversation';
  end if;
  if public.my_role() not in ('member', 'admin', 'provider', 'super_admin') then
    raise exception 'This account cannot start a conversation';
  end if;
  if p_other is null or p_other = caller then
    raise exception 'Choose somebody to message';
  end if;

  if not public.can_start_conversation(caller, p_other) then
    raise exception 'You can only message your own case manager, program, or the people on your list';
  end if;

  -- Reuse the conversation the two of them already have, if any.
  select mine.conversation_id into existing
  from public.conversation_members mine
  join public.conversation_members theirs
    on theirs.conversation_id = mine.conversation_id
   and theirs.profile_id = p_other
  join public.conversations c on c.id = mine.conversation_id and c.kind = 'direct'
  where mine.profile_id = caller
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.conversations (kind) values ('direct') returning id into created;
  insert into public.conversation_members (conversation_id, profile_id)
  values (created, caller), (created, p_other);

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'conversation.open', 'conversation', created,
          jsonb_build_object('with', p_other));

  return created;
end;
$$;

revoke all on function public.open_direct_conversation(uuid) from public, anon;
grant execute on function public.open_direct_conversation(uuid) to authenticated;

create or replace function public.messageable_people()
returns table (
  profile_id uuid,
  first_name text,
  role       public.user_role
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.id, p.first_name, p.role
  from public.profiles p
  where auth.uid() is not null
    and public.my_role() in ('member', 'admin', 'provider', 'super_admin')
    and p.id <> auth.uid()
    and p.role in ('member', 'admin', 'provider', 'super_admin')
    and public.can_start_conversation(auth.uid(), p.id)
  order by p.first_name asc nulls last, p.id asc;
$$;

revoke all on function public.messageable_people() from public, anon;
grant execute on function public.messageable_people() to authenticated;

-- ---------------------------------------------------------------------------
-- The member's way in: from a place, before or without a visit.

create or replace function public.message_program(p_service_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  v_org uuid;
  lead uuid;
  existing uuid;
  created uuid;
begin
  if caller is null then
    raise exception 'Sign in to message a program';
  end if;
  if not public.is_active_account() or public.my_role() <> 'member' then
    raise exception 'Only a member can start a message to a program';
  end if;

  select s.org_id into v_org
  from public.services s
  where s.id = p_service_id and s.is_active;

  -- A place with no organisation, or none with a lead on Pam, has nobody to
  -- answer: the screen shows Call / Website for those (service_has_lead).
  if v_org is null then
    raise exception 'NO_PROGRAM_LEAD';
  end if;

  -- Never one's own program (the same rule as enrollments_not_own_program).
  if exists (select 1 from public.profiles me where me.id = caller and me.org_id = v_org) then
    raise exception 'NO_PROGRAM_LEAD';
  end if;

  -- The leads this member may reach: active, a provider, not blocked either way.
  -- Prefer one they already talk to (most recent), then the longest-standing.
  select l.id into lead
  from public.profiles l
  join public.profile_roles r on r.profile_id = l.id and r.role = 'provider'
  where l.org_id = v_org
    and l.access_status = 'active'
    and l.id <> caller
    and not exists (
      select 1 from public.blocks k
      where (k.blocker_id = caller and k.blocked_id = l.id)
         or (k.blocker_id = l.id and k.blocked_id = caller)
    )
  order by
    (select max(c.last_message_at)
       from public.conversation_members mine
       join public.conversation_members theirs
         on theirs.conversation_id = mine.conversation_id and theirs.profile_id = l.id
       join public.conversations c on c.id = mine.conversation_id and c.kind = 'direct'
      where mine.profile_id = caller) desc nulls last,
    (exists (
       select 1
       from public.conversation_members mine
       join public.conversation_members theirs
         on theirs.conversation_id = mine.conversation_id and theirs.profile_id = l.id
       join public.conversations c on c.id = mine.conversation_id and c.kind = 'direct'
      where mine.profile_id = caller)) desc,
    l.created_at asc, l.id asc
  limit 1;

  if lead is null then
    raise exception 'NO_PROGRAM_LEAD';
  end if;

  select mine.conversation_id into existing
  from public.conversation_members mine
  join public.conversation_members theirs
    on theirs.conversation_id = mine.conversation_id and theirs.profile_id = lead
  join public.conversations c on c.id = mine.conversation_id and c.kind = 'direct'
  where mine.profile_id = caller
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.conversations (kind) values ('direct') returning id into created;
  insert into public.conversation_members (conversation_id, profile_id)
  values (created, caller), (created, lead);

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'conversation.open', 'conversation', created,
          jsonb_build_object('with', lead, 'via', 'place', 'service', p_service_id));

  return created;
end;
$$;

revoke all on function public.message_program(uuid) from public, anon;
grant execute on function public.message_program(uuid) to authenticated;

comment on function public.message_program is
  'A member opens or reuses a conversation with one lead of a place''s program '
  '(D-541). Only a member starts it; the lead can reply but cannot open a new one '
  'with a member who has not written, has no visit and is not enrolled '
  '(can_start_conversation). Raises NO_PROGRAM_LEAD when the place has nobody on Pam.';
