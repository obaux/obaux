-- 0034 — A reported message is quoted by the database, not by the reporter.
--
-- Will chose option C: a case manager sees a message only when somebody reports
-- it as unsafe. That is what the schema already does, and it does it well —
-- `messages` has no admin policy at all, so an admin cannot read the table
-- under any circumstance, and `reports.target_excerpt` is the single route by
-- which message text ever reaches one.
--
-- The hole is who writes that excerpt.
--
-- `reports_insert_reporter` checks only that the reporter is the caller. So a
-- member could file a report against any message id with a `target_excerpt`
-- they typed themselves — words the other person never wrote — and a case
-- manager would read fabricated text as the evidence. For this population that
-- is not a theoretical griefing problem: an accusation with a quote attached,
-- reviewed by somebody with power over you, is a way to do real harm with the
-- safety feature.
--
-- So the excerpt now comes from the message row, copied by the database, and a
-- report against a message can only be filed through this function.

create or replace function public.report_message(
  p_message_id uuid,
  p_reason     text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  msg public.messages;
  rep public.reports;
begin
  if caller is null then
    raise exception 'Sign in to report a message';
  end if;

  select * into msg from public.messages where id = p_message_id;
  if msg.id is null then
    raise exception 'No such message';
  end if;

  -- Only somebody in the conversation can report what was said in it. This is
  -- the same gate the read policy uses, so reporting cannot become a way to
  -- read a message you were never shown.
  if not public.in_conversation(msg.conversation_id) then
    raise exception 'You can only report a message in your own conversation';
  end if;

  -- Reporting your own words back at somebody is not a safety report.
  if msg.sender_id = caller then
    raise exception 'You cannot report your own message';
  end if;

  insert into public.reports (reporter_id, target_type, target_id, reason, target_excerpt)
  values (
    caller, 'message', p_message_id, nullif(btrim(p_reason), ''),
    -- Copied from the row, capped. A case manager sees what was actually sent.
    left(msg.body, 500)
  )
  returning * into rep;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'message.report', 'message', p_message_id,
          jsonb_build_object('report_id', rep.id));

  return rep;
end;
$$;

revoke all on function public.report_message(uuid, text) from public, anon;
grant execute on function public.report_message(uuid, text) to authenticated;

-- And close the direct route. Reports about a profile, a place or a post carry
-- no quoted text and stay insertable as before; a report about a message has to
-- come through the function above, which is the only thing that can prove the
-- quote is real.
drop policy if exists reports_insert_reporter on public.reports;
create policy reports_insert_reporter on public.reports
  for insert with check (
    reporter_id = auth.uid()
    and target_type <> 'message'
    and target_excerpt is null
  );

comment on column public.reports.target_excerpt is
  'The reported message, copied from the row by report_message(). Never '
  'supplied by the reporter: a hand-written "quote" reviewed by somebody with '
  'power over you is a way to do harm with the safety feature (0034).';
