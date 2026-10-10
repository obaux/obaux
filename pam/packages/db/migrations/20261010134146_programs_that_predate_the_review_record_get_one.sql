-- Programs that predate the review record get one (D-462, part 6; the CTO's
-- answers of 10 October 2026).
--
-- `program_submissions` (20261010083715) records each send from then on. A
-- program that was put on file before it has a listing and nothing else, so the
-- review list and the lead's own screen have nothing to read for it. This writes
-- the one row each is missing, and nothing more:
--
--   * only listings that belong to an organisation (a program a lead put on file)
--     and have no submission at all;
--   * kind 'new'; status 'approved' when the listing is live, 'in_review' when it
--     is still waiting (and active); an inactive listing waiting for review is
--     left alone (nobody is waiting on it);
--   * `details` built from the listing, `sent_at` its creation time;
--   * `submitted_by` the one profile that belongs to the organisation, or none
--     when there are several (never a guess);
--   * no `reviewed_by` or `reviewed_at`: nobody recorded who approved it.
--
-- Also closes any first-time submission left open for a listing that is already
-- live (approved by hand before the closing trigger existed).
--
-- Idempotent: running it twice writes nothing the second time. EXPAND ONLY; no
-- phone number or email is read or copied.

-- 1. Open, but already live.
update public.program_submissions ps
set status = 'approved', reviewed_at = coalesce(ps.reviewed_at, now())
from public.services s
where s.id = ps.service_id
  and ps.kind = 'new'
  and ps.status in ('in_review', 'changes_asked')
  and not s.needs_review;

-- 2. A listing with an organisation and no record.
insert into public.program_submissions (service_id, org_id, region_id, submitted_by, kind, details, sent_at, status)
select
  s.id,
  s.org_id,
  o.region_id,
  (select p.id from public.profiles p where p.org_id = s.org_id
    and (select count(*) from public.profiles p2 where p2.org_id = s.org_id) = 1),
  'new',
  jsonb_build_object(
    'name', s.name,
    'category', s.category,
    'subcategory', s.subcategory,
    'description', s.description_plain,
    'address', s.address,
    'phone', s.phone,
    'website', s.website
  ),
  s.created_at,
  case when s.needs_review then 'in_review' else 'approved' end
from public.services s
join public.orgs o on o.id = s.org_id
where s.org_id is not null
  and (not s.needs_review or s.is_active)
  and not exists (select 1 from public.program_submissions ps where ps.service_id = s.id);
