-- invite_emails_have_a_live_switch_the_app_reads_off — the expired-link page offers "Email me a new
-- link" only while invite emails really go out (Sage, 13 October, signing the W6 words; D-563).
--
-- Claimed 2026-10-13 07:05:05 UTC on `claude/pam-join-first-time-wording` with `pnpm claim migration`.
--
-- Expand: one row in `app_settings`, inserted as 'off' and never overwritten. `app_settings` is
-- readable by everyone, anon included (0009), which this needs: the expired-link page is read by
-- somebody who cannot sign in. Nothing reads the row until the app that does is live, and that app
-- treats a missing row as off.
--
-- The sender has its own switch, the `INVITE_EMAILS` secret on `send-invite-emails`. Turn both on
-- together, on the day Will says invite emails go:
--   update public.app_settings set value = 'on' where key = 'invite_emails_live';
-- and set INVITE_EMAILS=on. Off again: set the row back to 'off' (the page stops offering at once).

insert into public.app_settings (key, value, description) values
  ('invite_emails_live', 'off',
   'Whether the expired-link page offers to email a new link. Only ''on'' shows the offer (D-563); '
   'turn it on with the INVITE_EMAILS secret on send-invite-emails, the day Will says invite emails go.')
on conflict (key) do nothing;
