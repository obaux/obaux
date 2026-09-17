-- 0059 — Covering indexes for staff_requests' foreign keys.
--
-- `mcp__Supabase__get_advisors` flagged both `staff_requests_region_id_fkey`
-- (0054, this week) and `staff_requests_reviewed_by_fkey` (0046, always
-- unindexed) as foreign keys with no covering index — the standard case
-- where a delete or update on `regions`/`profiles` has to scan this whole
-- table to check for references. Small table, low volume, but the fix is
-- one line each; there is no reason to leave it for later.

create index if not exists staff_requests_region_idx on public.staff_requests (region_id);
create index if not exists staff_requests_reviewed_by_idx on public.staff_requests (reviewed_by);
