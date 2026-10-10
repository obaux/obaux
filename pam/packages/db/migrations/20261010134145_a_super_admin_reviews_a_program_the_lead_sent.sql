-- A super admin reviews a program the lead sent (D-386 part 6, D-462; the
-- CTO's answers of 10 October 2026).
--
-- What the lead's side (D-462) left open: a program was sent and nothing could
-- answer it except a super admin writing `services` by hand, which left its
-- `program_submissions` row 'in_review' for ever and blocked the lead's next
-- send (one open submission per listing).
--
-- EXPAND ONLY. Two functions, one trigger. No column, no drop, and no new
-- notification kind (the notifications CHECK is left alone: dropping it is a
-- contract step the connector hangs on, D-387). The lead learns from their
-- program going live; their screen reading a note is part 5b.
--
-- ## review_program_submission(id, decision, note)
--
-- Super admin only, checked inside the function (RLS does not cover the RPC
-- surface). One of:
--   * 'approved'       — only from 'in_review' (a submission waiting on the lead's
--                        changes is re-sent first). A first listing goes live
--                        (`needs_review` false); a change applies only the four
--                        fields the lead sent (name, category, subcategory,
--                        address) to the live row. The reviewer edits nothing.
--   * 'changes_asked'  — only from 'in_review'; the note is required (≤500
--                        characters) and reaches the lead only.
--   * 'discarded'      — only a WITHDRAWN submission. Pam is a human-touch
--                        company: an open request never vanishes because we were
--                        slow; "Ask for changes" says why instead.
-- Each is written to the audit log (action, submission, kind; never the note).
--
-- ## programs_to_check()
--
-- What the review list reads: every submission still to look at (in review,
-- waiting on the lead, or withdrawn and not yet discarded), newest first, with
-- the lead's FIRST NAME only. No contact details leave the function.
--
-- ## The old direct path stays sane
--
-- A trigger on `services`: when a listing's `needs_review` goes true -> false by
-- ANY path (including the hand-written one), its open first-time submission is
-- closed as approved. Without it the lead's one-open index would block them.

-- ---------------------------------------------------------------------------
-- 1. review_program_submission.

create or replace function public.review_program_submission(
  p_id       uuid,
  p_decision text,
  p_note     text default null
)
returns public.program_submissions
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  caller uuid := auth.uid();
  sub    public.program_submissions;
  note   text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if caller is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_super_admin() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;
  if p_decision not in ('approved', 'changes_asked', 'discarded') then
    raise exception 'NOT_A_DECISION';
  end if;

  select * into sub from public.program_submissions where id = p_id for update;
  if sub.id is null then
    raise exception 'SUBMISSION_NOT_FOUND';
  end if;

  if p_decision = 'approved' then
    if sub.status <> 'in_review' then
      raise exception 'SUBMISSION_NOT_IN_REVIEW';
    end if;

    -- Closed first, so the trigger below finds nothing left to close.
    update public.program_submissions
    set status = 'approved', reviewed_by = caller, reviewed_at = now(), changes_note = null
    where id = sub.id
    returning * into sub;

    if sub.kind = 'new' then
      update public.services set needs_review = false
      where id = sub.service_id and is_active;
      if not found then
        raise exception 'LISTING_NOT_AVAILABLE';
      end if;
    else
      -- Only what the lead sent, and only the four fields a change can carry.
      update public.services s
      set name        = case when sub.details ? 'name' then btrim(sub.details->>'name') else s.name end,
          category    = case when sub.details ? 'category' then (sub.details->>'category')::public.service_category else s.category end,
          subcategory = case when sub.details ? 'subcategory' then nullif(sub.details->>'subcategory', '') else s.subcategory end,
          address     = case when sub.details ? 'address' then nullif(sub.details->>'address', '') else s.address end
      where s.id = sub.service_id;
      if not found then
        raise exception 'LISTING_NOT_AVAILABLE';
      end if;
    end if;

    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'program.approve', 'program_submission', sub.id, jsonb_build_object('kind', sub.kind));

  elsif p_decision = 'changes_asked' then
    if sub.status <> 'in_review' then
      raise exception 'SUBMISSION_NOT_IN_REVIEW';
    end if;
    if note is null then
      raise exception 'NOTE_REQUIRED';
    end if;
    if char_length(note) > 500 then
      raise exception 'NOTE_TOO_LONG';
    end if;

    update public.program_submissions
    set status = 'changes_asked', changes_note = note, reviewed_by = caller, reviewed_at = now()
    where id = sub.id
    returning * into sub;

    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'program.ask_changes', 'program_submission', sub.id, jsonb_build_object('kind', sub.kind));

  else
    if sub.status <> 'withdrawn' then
      raise exception 'ONLY_WITHDRAWN_CAN_BE_DISCARDED';
    end if;

    update public.program_submissions
    set status = 'discarded', reviewed_by = caller, reviewed_at = now()
    where id = sub.id
    returning * into sub;

    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (caller, 'program.discard', 'program_submission', sub.id, jsonb_build_object('kind', sub.kind));
  end if;

  return sub;
end;
$$;

revoke all on function public.review_program_submission(uuid, text, text) from public, anon;
grant execute on function public.review_program_submission(uuid, text, text) to authenticated;

comment on function public.review_program_submission is
  'A super admin approves, asks for changes to, or discards a program '
  'submission (D-386). Approve applies only what the lead sent; discard is for '
  'withdrawn ones only. Audit-logged; the note reaches the lead only.';

-- ---------------------------------------------------------------------------
-- 2. programs_to_check: the review list.

create or replace function public.programs_to_check()
returns table (
  id            uuid,
  service_id    uuid,
  kind          text,
  status        text,
  sent_at       timestamptz,
  days_waiting  integer,
  program_name  text,
  details       jsonb,
  changes_note  text,
  lead_name     text,
  replaces_id   uuid,
  replaced_by   uuid,
  withdrawn_at  timestamptz
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_super_admin() then
    raise exception 'ONLY_A_SUPER_ADMIN';
  end if;

  return query
  select
    ps.id,
    ps.service_id,
    ps.kind,
    ps.status,
    ps.sent_at,
    greatest(0, floor(extract(epoch from (now() - ps.sent_at)) / 86400))::integer,
    -- A first send is called by what it sent; a change by the live program's name.
    case when ps.kind = 'change' then s.name else coalesce(ps.details->>'name', s.name) end,
    ps.details,
    ps.changes_note,
    p.first_name,
    ps.replaces_id,
    (select later.id from public.program_submissions later where later.replaces_id = ps.id limit 1),
    ps.withdrawn_at
  from public.program_submissions ps
  join public.services s on s.id = ps.service_id
  left join public.profiles p on p.id = ps.submitted_by
  where ps.status in ('in_review', 'changes_asked', 'withdrawn')
  order by ps.sent_at desc;
end;
$$;

revoke all on function public.programs_to_check() from public, anon;
grant execute on function public.programs_to_check() to authenticated;

comment on function public.programs_to_check is
  'The programs still to look at, newest first, with the lead''s first name '
  'only. Super admin only, checked inside.';

-- ---------------------------------------------------------------------------
-- 3. A listing that goes live by any path closes its first-time submission.

create or replace function public.close_submission_when_listing_goes_live()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.program_submissions
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), changes_note = null
  where service_id = new.id and kind = 'new' and status in ('in_review', 'changes_asked');
  return new;
end;
$$;

revoke all on function public.close_submission_when_listing_goes_live() from public, anon, authenticated;

create or replace trigger services_close_submission_when_live
  after update of needs_review on public.services
  for each row
  when (old.needs_review and not new.needs_review)
  execute function public.close_submission_when_listing_goes_live();
