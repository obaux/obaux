-- 0037 — The closure notice never names the place.
--
-- Will: say what is wrong and offer a way on, without naming the programme.
-- "A place you saved is closed, so there is no need to go. Find others in PAM."
--
-- It is a better message and a smaller surface at the same time. Naming the
-- place added nothing a member needs — they saved it, and the app shows them
-- which one when they open it — while making every notice a disclosure
-- question. 0035 handled that with a second, nameless template for the eleven
-- places whose names give somebody away. Naming none of them deletes the
-- branch, the flag lookup, and the risk together.
--
-- Fewer moving parts is the smaller reason. The real one: the safest version of
-- a message is the one that carries nothing it does not need.

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
  n integer;
begin
  if not exists (select 1 from public.services where id = p_service_id) then
    return 0;
  end if;

  -- The queue carries the reason KEY, never the phrase and never the place.
  -- The dispatcher renders it in the member's own language from reviewed copy,
  -- so a wording change reaches messages that are already waiting.
  insert into public.outbound_messages (member_id, template_key, vars)
  select sp.member_id, 'saved_place_closed', jsonb_build_object('reason_key', p_reason)
  from public.saved_places sp
  where sp.service_id = p_service_id;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.queue_saved_place_closed(uuid, text) from public, anon, authenticated;

-- Anything already queued under the old shape.
update public.outbound_messages
set template_key = 'saved_place_closed', vars = vars - 'place'
where template_key in ('saved_place_closed', 'saved_place_closed_private');
