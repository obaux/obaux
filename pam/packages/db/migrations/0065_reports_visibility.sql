-- 0065 — A reported message is seen by the people D-074 named, and no one else.
--
-- `reports_admin_review` (0007) was `for all using (is_admin())`: every case
-- manager, in every region, could read (and edit) every report — and a super
-- admin, who is not `is_admin()`, could read none. D-074's model, and the
-- promise on the transparency screen ("a message only if someone says it is
-- not safe"), is narrower and different: the case manager responsible for the
-- people involved, plus every super admin.
--
-- This migration makes the policy say that, and gives the moderation screen
-- (`/reports/`, D-178) a function to read from that carries first names for
-- the reporter and the person reported about without a raw `profiles` read —
-- the same fixed-column-list shape as `conversation_partners()` (0061).
--
-- "Responsible for" means an active `admin_assignments` row for the sender OR
-- the reporter of a message report — not the region arm of `admin_covers()`.
-- The reporter's case manager is included on purpose: a member reporting
-- their own program admin's message would otherwise have nobody but a super
-- admin able to see it, and the member's trust relationship (transparency.ts)
-- is with the person who invited them. See D-178.
--
-- Reports about a profile, place or post (target_type <> 'message') carry no
-- quoted text and keep the old audience plus super admins; nothing files them
-- today.

create or replace function public.report_visible_to_me(
  p_target_type text,
  p_target_id   uuid,
  p_reporter_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    public.is_super_admin()
    or (
      public.is_admin()
      and (
        p_target_type <> 'message'
        or exists (
          select 1
          from public.messages m
          join public.admin_assignments a
            on a.admin_id = auth.uid()
           and a.ended_at is null
           and a.member_id in (m.sender_id, p_reporter_id)
          where m.id = p_target_id
        )
      )
    );
$$;

-- Policies evaluate as the caller, so `authenticated` has to be able to run
-- it — the same way is_super_admin() (0033) is granted. It answers only about
-- auth.uid(), so calling it directly tells a caller nothing they could not
-- learn by selecting from reports.
revoke all on function public.report_visible_to_me(text, uuid, uuid) from public, anon;
grant execute on function public.report_visible_to_me(text, uuid, uuid) to authenticated;

drop policy if exists reports_admin_review on public.reports;

create policy reports_select_review on public.reports
  for select using (public.report_visible_to_me(target_type, target_id, reporter_id));

-- Resolving stays possible for the same people (the columns exist since 0005;
-- no screen writes them yet). Nobody but the reporter inserts, and nobody
-- deletes: a report is a record.
create policy reports_update_review on public.reports
  for update
  using (public.report_visible_to_me(target_type, target_id, reporter_id))
  with check (public.report_visible_to_me(target_type, target_id, reporter_id));

-- ---------------------------------------------------------------------------
-- What the moderation screen reads.

create or replace function public.reports_for_review()
returns table (
  id               uuid,
  target_type      text,
  target_id        uuid,
  reason           text,
  target_excerpt   text,
  created_at       timestamptz,
  resolved_at      timestamptz,
  resolution       text,
  reporter_id      uuid,
  reporter_name    text,
  reporter_role    public.user_role,
  about_id         uuid,
  about_name       text,
  about_role       public.user_role
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    r.id, r.target_type, r.target_id, r.reason, r.target_excerpt,
    r.created_at, r.resolved_at, r.resolution,
    r.reporter_id, rp.first_name, rp.role,
    m.sender_id, sp.first_name, sp.role
  from public.reports r
  join public.profiles rp on rp.id = r.reporter_id
  left join public.messages m on r.target_type = 'message' and m.id = r.target_id
  left join public.profiles sp on sp.id = m.sender_id
  where public.report_visible_to_me(r.target_type, r.target_id, r.reporter_id)
  order by (r.resolved_at is null) desc, r.created_at desc;
$$;

comment on function public.reports_for_review is
  'The reports the caller may review (report_visible_to_me), with first names '
  'and roles for the reporter and the person reported about — the only '
  'columns the screen needs, never a profiles row. The excerpt is the one '
  'piece of message text that ever reaches a case manager (0034, D-074).';

revoke all on function public.reports_for_review() from public, anon;
grant execute on function public.reports_for_review() to authenticated;
