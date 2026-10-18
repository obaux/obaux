-- an_erased_account_takes_its_pam_conversation_with_it — and Pam's messages cannot be reported (D-605, D-606).
--
-- Claimed 2026-10-18 07:30:16 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
-- Runs after `pam_conversations_have_a_limit_and_an_after_hours_reply`.
--
-- EXPAND: one trigger, and `report_message()` restated with one added refusal.
--
--   Erasure. Deleting a profile cascades to its `pam_threads` row; this deletes that thread's CONVERSATION, so its messages
--   (the person's and Pam's replies, which would otherwise outlive the person in a conversation with no member) and its member
--   row go at once, not after six months (D-443: the audit rows that name the person stay six months and go with the account's
--   other rows). The photos' FILES are not removed by this: only the Storage API removes a file, so the nightly sweep for
--   message photos (Message Pam slice 3) does, as it will for every conversation; that sweep does not exist yet, for any
--   conversation (found 18 October, recorded in D-606).
--
--   Reporting. A person in a Pam conversation cannot report a message in it (Mira, 18 October: no block and no report on a Pam
--   conversation, either side). Without this, `report_message()` would copy the words of a Pam message into `reports`, where
--   the case managers who cover the person read them, and that is the one door through which a guide could read a Pam
--   conversation. The menu item is hidden in the app; this is the database saying it too.

create or replace function public.pam_thread_erased()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.conversations where id = old.conversation_id;
  return old;
end;
$$;

revoke all on function public.pam_thread_erased() from public, anon, authenticated;

create or replace trigger pam_threads_erased
  after delete on public.pam_threads
  for each row execute function public.pam_thread_erased();

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

  -- A Pam conversation has no report (D-605): the Pam team reads it already, and a report would hand its words to a guide.
  if public.is_support_conversation(msg.conversation_id) then
    raise exception 'A message to or from Pam cannot be reported';
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
