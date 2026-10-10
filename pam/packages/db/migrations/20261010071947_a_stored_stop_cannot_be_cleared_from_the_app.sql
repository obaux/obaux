-- A STOP that Pam has stored cannot be cleared from the app (D-453, Will,
-- 10 October 2026, through Mira: "Make the app respect a stored STOP everywhere,
-- test it, and keep the wording true").
--
-- The privacy page says: "Reply STOP any time and the texts stop. Nothing in the
-- app can turn them back on." (privacy.s.texts.p2). The dispatcher already keeps
-- that promise: a message for somebody with `sms_stopped_at` set is cancelled
-- (0039, 0055). What was not true is "nothing in the app": the policy on
-- `notification_preferences` is `for all` on the person's own row, and the table
-- was fully granted to `authenticated`, so a signed-in person's own client could
-- UPDATE `sms_stopped_at` back to null, or DELETE the row and insert a new one —
-- which is the same thing — through the API, whatever the screens offer.
--
-- This takes that away, at the layer that cannot be walked around:
--
--   * `authenticated` may read its own row (RLS, unchanged), insert and update
--     the choices (texts on or off, push, quiet hours), and nothing else. The
--     column `sms_stopped_at` is not among the columns it may write.
--   * `authenticated` may not delete the row. (A deleted account still takes its
--     preferences with it: that is a cascade from the profile, run by the
--     database, not by the person's grant.)
--
-- The service role keeps everything, so whatever records a STOP — or, one day,
-- a START a person has asked for through Pam — still can. Nothing the live app
-- does is affected: it writes `member_id` and `sms_enabled`, and reads
-- `sms_enabled`.
--
-- This only tightens what a client may do; it adds and removes no table,
-- column or function, so it is not a "contract" change. Run twice it changes
-- nothing the second time.

revoke all on public.notification_preferences from authenticated;
revoke all on public.notification_preferences from anon;

grant select on public.notification_preferences to authenticated;

-- `member_id` is in both lists because an upsert names it (PostgREST writes
-- every column in the body in the ON CONFLICT clause). Row-level security still
-- holds it to the person's own id.
grant insert (member_id, sms_enabled, push_enabled, buddy_sms_enabled, quiet_hours_start, quiet_hours_end)
  on public.notification_preferences to authenticated;
grant update (member_id, sms_enabled, push_enabled, buddy_sms_enabled, quiet_hours_start, quiet_hours_end, updated_at)
  on public.notification_preferences to authenticated;

comment on column public.notification_preferences.sms_stopped_at is
  'Set when the person replied STOP. Honoured immediately by the dispatcher (0039, '
  '0055) and not writable by a client role at all (D-453): nothing in the app can '
  'clear it. Only the service role can.';
