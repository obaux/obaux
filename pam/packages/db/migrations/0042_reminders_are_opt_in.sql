-- 0042 — Reminders are off until somebody asks for them.
--
-- The carrier rejected PAM's campaign with 30925: "opt-in must be unchecked by
-- default; active consent required." They were right, and the fix is not
-- wording.
--
-- Two kinds of message, and they are not the same promise:
--
--   * The sign-in code. PAM has no passwords, so asking for a code IS asking to
--     be texted one. Nobody can use PAM without it and nobody is surprised by
--     it. That stays.
--   * Reminders and notices. These arrive days later, unprompted, on a phone
--     somebody else may be holding. Wanting help finding a food pantry is not
--     the same as agreeing to be texted about it next Tuesday.
--
-- So `sms_enabled` now starts false. A member turns it on by ticking a box that
-- starts unticked, and sign-in works either way — which also answers 30923,
-- "message consent cannot be required for service use". Somebody who never
-- ticks it still gets every code they ask for and never gets anything else.
--
-- The dispatcher already honours this: a queued message for a member with
-- sms_enabled = false is cancelled with the reason recorded, so nothing needed
-- to change there (0039).

alter table public.notification_preferences
  alter column sms_enabled set default false;

comment on column public.notification_preferences.sms_enabled is
  'Reminders and notices. Starts false: a person turns it on deliberately. The '
  'sign-in code is not covered by this — asking for a code is asking to be '
  'texted one — and never asking for reminders never blocks anybody from using '
  'PAM.';

-- Anybody already in the table predates the tick box and never agreed to
-- anything, so they are switched off too rather than grandfathered in.
update public.notification_preferences set sms_enabled = false where sms_enabled;
