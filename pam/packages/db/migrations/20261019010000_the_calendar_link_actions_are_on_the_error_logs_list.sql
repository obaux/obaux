-- The two actions of a98 plan C's Calendar screen join the app error log's closed list (D-616, D-604).
--
-- `app_error_actions` (20261018211942) is the list of things the app may tell the team went wrong; the log refuses any action that is not on
-- it. Plan C's Calendar screen reports two: `calendar.link` (making a link, or a new one) and `calendar.link.off` (turning the link off).
-- They ship with plan C, after the log is live, so they have a migration of their own rather than a place in the first seed.
-- EXPAND ONLY: two rows, nothing dropped or changed. `packages/config/test/app-errors.test.ts` holds the union of every such insert equal to
-- APP_ERROR_ACTIONS.

insert into public.app_error_actions (action) values
  ('calendar.link'),
  ('calendar.link.off')
on conflict do nothing;
