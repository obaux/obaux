-- A lead corrects and sends again the program they sent (D-386 part 5b).
--
-- Part 6 let a super admin ask for changes. Nothing let the lead answer:
-- `submit_program` refuses while the listing is in review
-- (PROGRAM_ALREADY_IN_REVIEW), and nothing moved a `changes_asked` submission
-- back to `in_review`. And a lead who corrected a program still waiting changed
-- the listing in place while the record of what was sent stayed as first sent,
-- so the reviewer read the old words.
--
-- `resend_program_submission(id, ...)` is "Edit and send again" (D-386): the
-- SAME submission, its id kept, back in review with the corrected words. Used
-- for both: after Pam asked for changes, and for a correction while it waits
-- (the wait is then not restarted; after a change request it is, because the
-- leader has sent it again).
--
-- A live program's change is corrected through `request_program_change`, which
-- already returns the open one to review (20261010083715); this is for the
-- first send only. EXPAND ONLY: one function.

create or replace function public.resend_program_submission(
  p_id          uuid,
  p_name        text,
  p_category    text,
  p_subcategory text default null,
  p_description text default null,
  p_address     text default null,
  p_phone       text default null,
  p_website     text default null
)
returns public.program_submissions
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller  uuid := auth.uid();
  me      public.profiles;
  sub     public.program_submissions;
  listing public.services;
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  select * into me from public.profiles where id = caller;
  if me.id is null or public.my_role() is distinct from 'provider' then
    raise exception 'NOT_A_PROGRAM_LEAD';
  end if;
  if not public.is_active_account() then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;
  if not public.feature_allowed(caller, 'provider_listing') then
    raise exception 'LISTING_NOT_ALLOWED';
  end if;
  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'NAME_REQUIRED';
  end if;

  -- Their own program's only; anything else reads as not found.
  select * into sub
  from public.program_submissions ps
  where ps.id = p_id
    and (ps.submitted_by = caller or (ps.org_id is not null and ps.org_id = me.org_id))
  for update;
  if sub.id is null then
    raise exception 'SUBMISSION_NOT_FOUND';
  end if;
  if sub.status not in ('in_review', 'changes_asked') then
    raise exception 'SUBMISSION_NOT_OPEN';
  end if;
  if sub.kind <> 'new' then
    raise exception 'USE_REQUEST_PROGRAM_CHANGE';
  end if;

  update public.services
  set name = btrim(p_name),
      category = p_category::public.service_category,
      subcategory = nullif(btrim(coalesce(p_subcategory, '')), ''),
      description_plain = nullif(btrim(coalesce(p_description, '')), ''),
      address = nullif(btrim(coalesce(p_address, '')), ''),
      phone = nullif(btrim(coalesce(p_phone, '')), ''),
      website = nullif(btrim(coalesce(p_website, '')), '')
  where id = sub.service_id and needs_review
  returning * into listing;
  if listing.id is null then
    raise exception 'LISTING_NOT_AVAILABLE';
  end if;

  update public.program_submissions
  set status = 'in_review',
      changes_note = null,
      sent_at = case when sub.status = 'changes_asked' then now() else sub.sent_at end,
      submitted_by = caller,
      details = jsonb_build_object(
        'name', listing.name,
        'category', listing.category,
        'subcategory', listing.subcategory,
        'description', listing.description_plain,
        'address', listing.address,
        'phone', listing.phone,
        'website', listing.website
      )
  where id = sub.id
  returning * into sub;

  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values (caller, 'program.resend', 'program_submission', sub.id, jsonb_build_object('name', listing.name));

  return sub;
end;
$$;

revoke all on function public.resend_program_submission(uuid, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.resend_program_submission(uuid, text, text, text, text, text, text, text) to authenticated;

comment on function public.resend_program_submission is
  'A program lead corrects the program they sent and sends it again (D-386): '
  'the same submission, back in review, with the corrected words. First sends '
  'only; a live program''s change goes through request_program_change.';
