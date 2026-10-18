-- pam_has_a_switch_and_hours — two settings for Message Pam (D-605).
--
-- Claimed 2026-10-18 07:15:53 UTC on `claude/messages-pam-s0-s1a` with `pnpm claim migration`.
--
-- EXPAND: two rows in `app_settings` (readable by everyone, 0009; the app treats a missing or unreadable row as off).
--
--   pam_messaging_live  'off'. While it is off, nothing is created and nothing is shown: no Pam conversation, no
--                       Pam row, no always-on Messages tab, no "Write to Pam". Contact Pam and Help behave as today.
--                       The merge desk turns it on ONLY after Will has signed the rewritten Privacy and Terms lines and
--                       they are live (D-413):
--                         on:  update public.app_settings set value = 'on'  where key = 'pam_messaging_live';
--                         off: update public.app_settings set value = 'off' where key = 'pam_messaging_live';
--
--   pam_hours           When Pam is here. JSON: `tz` (an IANA zone), `days` (ISO weekdays, 1 = Monday), `open` and
--                       `close` (24-hour local times). Default Monday to Friday, 9:00 to 17:00, America/New_York, until
--                       Will says otherwise (D-605). The super admin edits it through `pam_set_hours()` (a later
--                       migration); the out-of-hours reply and the app's "Pam is here ..." line read it.

insert into public.app_settings (key, value, description) values
  ('pam_messaging_live', 'off',
   'Whether people can message Pam inside the app (D-605). Only ''on'' shows it. Switched on by the merge desk after Will signs the '
   'rewritten Privacy and Terms lines and they are live (D-413).'),
  ('pam_hours', '{"tz":"America/New_York","days":[1,2,3,4,5],"open":"09:00","close":"17:00"}',
   'When Pam is here, as JSON: tz, days (ISO weekdays, 1 is Monday), open and close (24-hour local times). A message outside it gets one '
   'automatic reply saying when Pam is next here (D-605).')
on conflict (key) do nothing;
