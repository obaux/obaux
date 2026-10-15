-- invite_emails_have_a_live_switch_the_app_reads — the expired-link page offers "Email me a new link"
-- only while invite emails really go out (Sage, 13 October, signing the W6 words; D-563).
--
-- Claimed 2026-10-13 07:05:05 UTC on `claude/pam-join-first-time-wording` with `pnpm claim migration`.
--
-- Expand: one row in `app_settings`, readable by everyone, anon included (0009), which this needs: the
-- expired-link page is read by somebody who cannot sign in. The app treats a missing or unreadable row
-- as off.
--
-- Seeded 'on' because it matches the live sender: `send-invite-emails` has sent live under its
-- `INVITE_EMAILS` secret since 10 October (the merge desk, 13 October: two staff invites sent
-- 19:16–19:20 UTC, none waiting), and the expired-link resend uses the same switch. Seeding 'off' would
-- hide an offer that works.
--
-- The row and the INVITE_EMAILS secret are switched together, both ways:
--   off: update public.app_settings set value = 'off' where key = 'invite_emails_live'; and INVITE_EMAILS=off
--   on:  update public.app_settings set value = 'on'  where key = 'invite_emails_live'; and INVITE_EMAILS=on
-- With the row off, the page says the link ran out and offers Contact Pam (the help desk).

insert into public.app_settings (key, value, description) values
  ('invite_emails_live', 'on',
   'Whether the expired-link page offers to email a new link. Only ''on'' shows the offer (D-563). '
   'Switched together with the INVITE_EMAILS secret on send-invite-emails, both ways; on since 10 October.')
on conflict (key) do nothing;
