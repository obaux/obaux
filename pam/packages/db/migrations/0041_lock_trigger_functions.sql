-- 0041 — The two notification triggers are not part of the public interface.
--
-- Every function in `public` is published as an endpoint. A trigger function
-- called that way errors out, so this is not a hole — but it is a name on the
-- list of things the outside world is invited to try, and a function that fires
-- on a flag should not be on it. Caught by the Supabase security advisor after
-- 0038, which is a check worth running after every schema change.

revoke all on function public.notify_on_report() from public, anon, authenticated;
revoke all on function public.notify_on_service_flag() from public, anon, authenticated;
