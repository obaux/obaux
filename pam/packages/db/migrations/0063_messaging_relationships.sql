-- 0063 — Who may open a conversation with whom is a database rule now.
--
-- D-163 shipped staff-to-member messaging with the scope enforced only by the
-- screen: `useMessageableMembers` offered a case manager their caseload and a
-- program admin their enrolled members, but `conversations_insert_participant`
-- and `conversation_members_insert` (0007) let any active account create a
-- conversation and add ANY profile id to it. Worse, `profile_id = auth.uid()`
-- let an account add itself to any conversation whose id it learned — which,
-- under `in_conversation()`, then made every message in it readable. Will's
-- brief for the messenger closes that: "no open messaging outside these
-- relationships" has to be true of the database, not of one component.
--
-- The relationships, exactly (D-176):
--
--   case manager  <->  a member on their caseload — an active row in
--                      `admin_assignments`. NOT the region arm of
--                      `admin_covers()`: sharing a city is not a relationship.
--   program admin <->  a member enrolled in a service the program's org owns.
--   member        <->  those same two people, from their side ("and vice
--                      versa", superseding D-163's "a member starts nothing").
--
-- Nothing else. Not member <-> member, not staff <-> staff, and not a super
-- admin with anybody (D-171 — now true at the database layer, not just in
-- `canMessage`'s role list).
--
-- How: the two insert policies are dropped outright. The only way to create a
-- conversation is `open_direct_conversation()`, a SECURITY DEFINER function
-- that checks the relationship inside its own body and adds both members
-- atomically — the pattern CLAUDE.md asks for ("guard inside the function"),
-- and the same shape 0034's `report_message()` already uses for the report
-- route. Reading (`conversations_select_member`, `messages_select_*`) and
-- sending inside a conversation (`messages_insert_sender`) are untouched.

-- ---------------------------------------------------------------------------
-- The rule, as one function both the RPC and the tests can ask.

create or replace function public.can_message(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a is not null and b is not null and a <> b and (
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
  );
$$;

comment on function public.can_message is
  'True when a and b are a case manager and a member on their active caseload, '
  'or a program admin and a member enrolled in a service their org owns. The '
  'whole of who may message whom in PAM (0063, D-176). Region alone is not a '
  'relationship; neither is being a super admin (D-171).';

revoke all on function public.can_message(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Who the caller may start a conversation with: the same rule, listed.
-- One function for all three roles so the screen and the database can never
-- disagree about the list (before this, the screen asked `profiles` through
-- `admin_covers()`, which includes the region arm the rule above excludes).

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
    and public.my_role() in ('member', 'admin', 'provider')
    and p.id <> auth.uid()
    and p.role in ('member', 'admin', 'provider')
    and public.can_message(auth.uid(), p.id)
  order by p.first_name asc nulls last, p.id asc;
$$;

comment on function public.messageable_people is
  'Everyone the caller may open a conversation with, by can_message(): a case '
  'manager''s assigned members, a program admin''s enrolled members, and — '
  'from the other side — a member''s own case manager and program admins. Id, '
  'first name and role only, following conversation_partners() (0061). A super '
  'admin gets zero rows (D-171).';

revoke all on function public.messageable_people() from public, anon;
grant execute on function public.messageable_people() to authenticated;

-- ---------------------------------------------------------------------------
-- The one door.

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
  if public.my_role() not in ('member', 'admin', 'provider') then
    -- D-171: a super admin does not message anybody, from any screen.
    raise exception 'This account cannot start a conversation';
  end if;
  if p_other is null or p_other = caller then
    raise exception 'Choose somebody to message';
  end if;
  if not public.can_message(caller, p_other) then
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

comment on function public.open_direct_conversation is
  'Finds or creates the direct conversation between the caller and p_other. '
  'The only way a conversation comes to exist: the insert policies on '
  'conversations and conversation_members are gone (0063). Refuses anything '
  'can_message() does not allow, including a super admin (D-171).';

revoke all on function public.open_direct_conversation(uuid) from public, anon;
grant execute on function public.open_direct_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Close the direct routes. No policy means no insert for `authenticated`;
-- `service_role` bypasses RLS and is unaffected.

drop policy if exists conversations_insert_participant on public.conversations;
drop policy if exists conversation_members_insert on public.conversation_members;
