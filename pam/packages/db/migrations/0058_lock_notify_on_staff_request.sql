-- 0058 — Locking down a trigger function that was left callable directly.
--
-- `notify_on_staff_request` (0054) is a trigger body — it reads `NEW`/`OLD`,
-- which only exist when Postgres itself invokes it around an insert or
-- update on `staff_requests`. Called directly it does nothing useful and
-- errors immediately, but `mcp__Supabase__get_advisors` still flagged it as
-- executable by `anon`/`authenticated` via PostgREST, because nothing had
-- revoked that. Its two siblings from 0038, `notify_on_service_flag` and
-- `notify_on_report`, were never explicitly revoked either and the advisor
-- does not flag them — 0011's schema-level default-privileges change reached
-- them because they were created in the same migration run that set it, and
-- did not reach this one. Revoking here closes the same door explicitly
-- rather than depending on which session created the function.

revoke all on function public.notify_on_staff_request() from public, anon, authenticated;
