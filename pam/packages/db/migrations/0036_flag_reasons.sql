-- 0036 — A flag says what is wrong, from a fixed list.
--
-- Will: standardise the reasons, have the person pick one, and tell the members
-- who saved the place which one it was.
--
-- Free text was the wrong shape for all three. A member picks from four things
-- that are true often enough to be worth naming, and the same four survive all
-- the way to the text message — where a fixed list is not a convenience but a
-- requirement, because §9 copy has to be reviewed and translated, and nobody
-- can review a sentence a stranger will type next week.
--
--   closed          the place has shut
--   moved           it is somewhere else now
--   not_accepting   still there, not taking new people
--   wrong_info      what PAM says about it is wrong
--
-- The free-text note stays, and stays internal: it is what the person adds
-- beside the reason, and it goes to the super admin deciding, never into a
-- message. The phrases a member actually reads live in @pam/config's
-- SERVICE_FLAG_REASONS, under the same review as every other outbound word.

alter table public.service_flags
  add column if not exists reason text;

update public.service_flags set reason = 'closed' where reason is null;

alter table public.service_flags
  alter column reason set not null;

alter table public.service_flags
  drop constraint if exists service_flags_reason_known;
alter table public.service_flags
  add constraint service_flags_reason_known check (
    reason in ('closed', 'moved', 'not_accepting', 'wrong_info')
  );

comment on column public.service_flags.reason is
  'One of four standard reasons. Reaches the member''s text message through '
  'SERVICE_FLAG_REASONS in @pam/config, so it has to be a value somebody has '
  'reviewed copy for — not free text (0036).';

comment on column public.service_flags.note is
  'What the person added beside the reason. Internal: it goes to the super '
  'admin deciding, never into a message.';

-- ---------------------------------------------------------------------------

create or replace function public.flag_service(
  p_service_id uuid,
  p_reason     text,
  p_note       text default null
)
returns public.service_flags
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  flag public.service_flags;
begin
  if caller is null then
    raise exception 'Sign in to flag a place';
  end if;
  if not public.is_active_account() then
    raise exception 'This account cannot flag a place';
  end if;
  if p_reason not in ('closed', 'moved', 'not_accepting', 'wrong_info') then
    raise exception 'Pick one of the four reasons';
  end if;
  if not exists (select 1 from public.services where id = p_service_id) then
    raise exception 'No such place';
  end if;

  insert into public.service_flags (service_id, flagged_by, reason, note)
  values (p_service_id, caller, p_reason, nullif(btrim(p_note), ''))
  returning * into flag;

  update public.services
  set is_active = false, updated_at = now()
  where id = p_service_id and removed_at is null;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'service.flag', 'service', p_service_id,
          jsonb_build_object('flag_id', flag.id, 'reason', p_reason,
                             'has_note', p_note is not null));

  return flag;
end;
$$;

drop function if exists public.flag_service(uuid, text);
revoke all on function public.flag_service(uuid, text, text) from public, anon;
grant execute on function public.flag_service(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- The reason travels into the message.

create or replace function public.queue_saved_place_closed(
  p_service_id uuid,
  p_reason     text
)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text;
  v_discloses boolean;
  n integer;
begin
  select name, name_may_disclose into v_name, v_discloses
  from public.services where id = p_service_id;

  if v_name is null then
    return 0;
  end if;

  -- The queue carries the reason KEY, not the phrase. The dispatcher renders it
  -- in the member's own language from reviewed copy, so a wording change
  -- reaches messages that are already waiting.
  insert into public.outbound_messages (member_id, template_key, vars)
  select
    sp.member_id,
    case when v_discloses then 'saved_place_closed_private' else 'saved_place_closed' end,
    jsonb_strip_nulls(jsonb_build_object(
      'place', case when v_discloses then null else v_name end,
      'reason_key', p_reason
    ))
  from public.saved_places sp
  where sp.service_id = p_service_id;

  get diagnostics n = row_count;
  return n;
end;
$$;

drop function if exists public.queue_saved_place_closed(uuid);
revoke all on function public.queue_saved_place_closed(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Deciding, with the reason the members will be told.
--
-- A super admin can correct it: the flagger reported what they saw from the
-- pavement, and PAM should text the reason it has actually confirmed rather
-- than an unverified claim about somebody's organisation.

create or replace function public.resolve_service_flag(
  p_flag_id uuid,
  p_action  text,
  p_note    text default null,
  p_reason  text default null
)
returns public.service_flags
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  flag public.service_flags;
  v_reason text;
  notified integer := 0;
begin
  if not public.is_super_admin() then
    raise exception 'Only a super admin decides what happens to a flagged place';
  end if;
  if p_action not in ('keep', 'remove') then
    raise exception 'Action must be keep or remove';
  end if;

  select * into flag from public.service_flags where id = p_flag_id;
  if flag.id is null then
    raise exception 'No such flag';
  end if;
  if flag.status <> 'pending' then
    raise exception 'That flag was already decided';
  end if;

  v_reason := coalesce(p_reason, flag.reason);
  if v_reason not in ('closed', 'moved', 'not_accepting', 'wrong_info') then
    raise exception 'Pick one of the four reasons';
  end if;

  update public.service_flags
  set status = case when p_action = 'keep' then 'kept' else 'removed' end,
      reason = v_reason,
      resolved_by = caller,
      resolved_at = now(),
      resolution_note = nullif(btrim(p_note), '')
  where id = p_flag_id
  returning * into flag;

  if p_action = 'keep' then
    update public.services s
    set is_active = true, updated_at = now()
    where s.id = flag.service_id
      and s.removed_at is null
      and not exists (
        select 1 from public.service_flags f
        where f.service_id = s.id and f.status = 'pending'
      );
  else
    -- Queued before the removal, so the saved rows are still there to read.
    notified := public.queue_saved_place_closed(flag.service_id, v_reason);

    update public.services
    set is_active = false, removed_at = now(), updated_at = now()
    where id = flag.service_id;

    update public.service_flags
    set status = 'removed', resolved_by = caller, resolved_at = now(),
        resolution_note = 'Settled with flag ' || p_flag_id
    where service_id = flag.service_id and status = 'pending';
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'service.flag.resolve', 'service', flag.service_id,
          jsonb_build_object('flag_id', p_flag_id, 'action', p_action,
                             'reason', v_reason, 'members_notified', notified));

  return flag;
end;
$$;

drop function if exists public.resolve_service_flag(uuid, text, text);
revoke all on function public.resolve_service_flag(uuid, text, text, text) from public, anon;
grant execute on function public.resolve_service_flag(uuid, text, text, text) to authenticated;
