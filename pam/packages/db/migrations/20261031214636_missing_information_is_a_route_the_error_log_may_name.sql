-- Missing information is a route the error log may name (D-623).
--
-- HELD: apply only after 20261018211942_app_errors_a_log_of_what_broke_without_who, and with it. That migration creates
-- `app_error_routes` and is waiting for Will; this one inserts into it and fails on a database without it. Mira, 31 October
-- 21:42: split out of 20261031203225 so that the counts can go live now and this waits with the error log.
--
-- `/places/missing/` (D-623) is a screen made after the error log's closed list of routes was written, so it is added here,
-- not by editing that file. packages/config/test/app-errors.test.ts reads routes added by later migrations as well.

insert into public.app_error_routes (route) values
  ('/places/missing/')
on conflict do nothing;
