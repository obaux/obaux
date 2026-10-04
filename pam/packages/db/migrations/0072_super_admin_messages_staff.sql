-- 0072 — The person running PAM can message case managers and program leads
-- (D-262, Will, 4 October 2026).
--
-- Will: "Super admin home: … also a way to message the program lead or case
-- manager from the app, to make sure they coordinate how to use the app."
--
-- D-171 said a super admin messages nobody. This narrows it rather than
-- ending it:
--
--   * `can_message` gains one arm: super admin <-> an `admin` or `provider`
--     profile, either way round. **Never a member** — a member's messages
--     stay between them, their case manager and their programs (§4.1,
--     `transparency.ts` unchanged).
--   * `open_direct_conversation` and `messageable_people` let a super admin
--     through to that rule. Everything after the rule is unchanged: the same
--     reuse of an existing pair, the same audit row, the same RLS on
--     `messages` (sender is a member of the conversation, account active).
--   * `staff_request_phone(user_id)`: before approval a requester has no
--     profile, so there is nobody to message in PAM yet. This gives the
--     super admin the number they signed up with, for a text or a call —
--     only for a pending request, only to a super admin, audited.
--
-- The three functions are copied from 0063 with only the lines above
-- changed, so a diff against 0063 shows exactly what moved.

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
    -- the person running PAM <-> a case manager or a program lead, either
    -- way round (0072, D-262). Never a member: that line does not move.
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

comment on function public.can_message is
  'True when a and b are a case manager and a member on their active caseload, '
  'a program admin and a member enrolled in a service their org owns, or the '
  'super admin and a case manager or program admin (0072, D-262). Never the '
  'super admin and a member. Region alone is not a relationship.';

revoke all on function public.can_message(uuid, uuid) from public, anon, authenticated;

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
    and public.can_message(auth.uid(), p.id)
  order by p.first_name asc nulls last, p.id asc;
$$;

revoke all on function public.messageable_people() from public, anon;
grant execute on function public.messageable_people() to authenticated;

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
  -- D-262 narrows D-171 rather than ending it: a super admin may start a
  -- conversation, but `can_message` only lets them reach staff.
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

revoke all on function public.open_direct_conversation(uuid) from public, anon;
grant execute on function public.open_direct_conversation(uuid) to authenticated;

create or replace function public.staff_request_phone(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  found_phone text;
begin
  if not public.is_super_admin() then
    raise exception 'Only the person running PAM sees a requester''s number';
  end if;
  if not exists (
    select 1 from public.staff_requests where user_id = p_user_id and decision is null
  ) then
    return null;
  end if;
  select phone into found_phone from auth.users where id = p_user_id;
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (auth.uid(), 'staff_request.phone_read', 'profile', p_user_id, '{}'::jsonb);
  return found_phone;
end;
$$;

revoke all on function public.staff_request_phone(uuid) from public, anon;
grant execute on function public.staff_request_phone(uuid) to authenticated;
