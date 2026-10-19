-- The saved-place text carries its link (Lena, reading the code for the carrier refile; Mira, 18 October).
--
-- The template is "Pam: A place you saved is {reason}. Find others in Pam: {link}" (`saved_place_closed`, packages/config/src/
-- sms-templates.ts, vars `reason` and `link`). `queue_saved_place_closed` (0037) queued only `{reason_key}`; the dispatcher turns the
-- key into `reason` and has no default for `link`, so `render()` throws "missing variable link for saved_place_closed" and every one of
-- these rows would fail. Nothing has failed yet: no such row has ever been queued (the texts are held, texts_live), and
-- `dispatcher.test.ts` passes only because it hands `render` a link itself.
--
-- Now the vars carry `link`: the app's own address and the path the sentence means ("Find others" is Explore, the first tab a member
-- lands on, which is `/`, as the Text alerts use for a place or a visit). Built the way every other enqueuer builds its link (an
-- `app_url` setting, then a path). The words do not change. Only the function is restated, with the same arguments and result.
--
-- Anything already waiting without a link gets one, so it cannot fail on that.

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
  n    integer;
  base text := coalesce((select value from public.app_settings where key = 'app_url'), '');
begin
  if not exists (select 1 from public.services where id = p_service_id) then
    return 0;
  end if;

  -- The queue carries the reason KEY, never the phrase and never the place (0037), and the link the sentence ends with.
  insert into public.outbound_messages (member_id, template_key, vars)
  select sp.member_id, 'saved_place_closed', jsonb_build_object('reason_key', p_reason, 'link', base || '/')
  from public.saved_places sp
  where sp.service_id = p_service_id;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.queue_saved_place_closed(uuid, text) from public, anon, authenticated;

update public.outbound_messages
set vars = vars || jsonb_build_object('link', coalesce((select value from public.app_settings where key = 'app_url'), '') || '/')
where template_key = 'saved_place_closed' and not (vars ? 'link');
