-- 0013 — PA 211 is cleared for use (Will, 2026-09-12).
--
-- The data-sharing question on the PA 211 Southeast source is settled: Will has
-- permission. That removes the *licence* blocker, which was the reason this row
-- carried an ASK WILL note.
--
-- It stays `is_active = false`, for a different and still-unresolved reason: no
-- endpoint has been verified. The build environment's egress proxy blocks the
-- host, so the concrete HSDS export URL is still unknown. Activating a source
-- whose endpoint is a guess would make the nightly importer look configured
-- while fetching nothing.
--
-- Flipping is_active is a one-line change once someone with network access
-- confirms the export URL and its shape (§5.2 step 1 supports HSDS / Open
-- Referral out of the box).

update public.service_imports
set errors = '[{"status":"unverified","licence":"cleared 2026-09-12 — Will confirmed permission to use 211","note":"Endpoint still unconfirmed: resolve the HSDS/Open Referral export URL, then set is_active = true. 211 is the widest source of family services in the region."}]'::jsonb
where source_name = 'PA 211 Southeast — HSDS export';
