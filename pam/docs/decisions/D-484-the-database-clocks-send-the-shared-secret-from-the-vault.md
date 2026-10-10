# D-484 — The database clocks send the shared secret from the vault

**Date:** 2026-10-10 · **Branch:** `claude/messages-invite-email-clock`

**The trap.** Edge function secrets are project-wide. `send-invite-emails` will not run without
`DISPATCH_SECRET`; `dispatch-sms` also reads `DISPATCH_SECRET` and refuses any call without a matching
`x-dispatch-secret`; and its clock (0040) sent no header. Setting the secret for the invite emails would have
made every text dispatch fail with a 401 — sign-in codes included.

**The fix**, one migration (`20261010144844_the_clocks_send_the_shared_secret_from_the_vault_and_the.sql`,
expand only, guarded for a database with no pg_cron or no supabase_vault, re-runnable):
- a vault secret `dispatch_secret`, made in the database from 32 random bytes if it does not exist. Its value is
  never in the repository, a log or a session; nothing selects it except the clock, at run time;
- `dispatch-sms` rescheduled as in 0040 plus the header (harmless while the function has no
  `DISPATCH_SECRET`: it checks the header only when one is set);
- `send-invite-emails` scheduled every five minutes in the same shape (404 until deployed, `{enabled:false}`
  until `INVITE_EMAILS=on`: touches nothing either way).

**Order, written into both runbooks:** the clock's header first, then the function secret, or texts are refused.
The person setting up the function copies `dispatch_secret` once from the dashboard (Vault) into
`DISPATCH_SECRET`; the steps are in `docs/email-setup.md`. The earlier "do not set DISPATCH_SECRET" warning is gone.

**Tests.** No DB test: the test database has neither pg_cron nor the vault, so a database test would test the guard
and nothing else (the migration does run in the suite and takes that path). Instead
`packages/config/test/database-clocks.test.ts` holds the migration's text to its promises: guards present, the
secret made from random bytes and never a literal, both jobs unscheduled by name then scheduled every five
minutes with the header read from the vault at run time, a timeout under the five minutes, only the publishable
key as a bearer.

Reverse with `select cron.unschedule('send-invite-emails');` and re-running 0040's schedule.
