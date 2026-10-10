-- The clocks send the shared secret, read from the vault at run time, and the invite email
-- clock is set (D-484, the merge desk for Will, 10 October 2026). Expand only.
--
-- THE TRAP THIS REMOVES. Edge function secrets are project-wide. `send-invite-emails` will not run
-- without `DISPATCH_SECRET`, and `dispatch-sms` also reads `DISPATCH_SECRET` and refuses any call
-- without a matching `x-dispatch-secret` header. The dispatcher's clock (0040) sent no header, so
-- the moment the secret was set for the invite emails every text dispatch would have got a 401 —
-- sign-in codes included. So both clocks now send the header.
--
-- WHERE THE SECRET LIVES. In Supabase Vault, as `dispatch_secret`, made here in the database from
-- random bytes. Its value never appears in this repository, a log or any session: nothing selects
-- it except the clock, at the moment it runs. The person setting up the function copies it once
-- from the dashboard (Vault) into the function secret `DISPATCH_SECRET` (docs/email-setup.md).
--
-- WHAT THIS DOES, in this order, each step safe to re-run:
--   1. If no vault secret is named `dispatch_secret`, create one. An existing one is kept.
--   2. Reschedule `dispatch-sms` exactly as 0040, plus the `x-dispatch-secret` header. Harmless
--      while the function has no `DISPATCH_SECRET`: it checks the header only when one is set.
--   3. Schedule `send-invite-emails` every five minutes in the same shape. Until the function is
--      deployed it answers 404, and until `INVITE_EMAILS=on` it answers `{enabled:false}`; either
--      way it touches nothing.
--
-- Order matters when the function secret is set: the clock's header first (this migration), then
-- `DISPATCH_SECRET`, or texts are refused until it is.
--
-- To stop either clock without redeploying:
--   select cron.unschedule('dispatch-sms');   select cron.unschedule('send-invite-emails');
--
-- Wrapped in guards because the throwaway test database has neither the scheduler nor the vault.
-- A schedule and a secret are properties of a running project, not of the schema.

do $do$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is unavailable here; skipping the clocks';
    return;
  end if;
  if not exists (select 1 from pg_available_extensions where name = 'supabase_vault') then
    raise notice 'supabase_vault is unavailable here; skipping the clocks';
    return;
  end if;

  create extension if not exists pg_cron with schema extensions;
  create extension if not exists supabase_vault;

  -- 1. The shared secret, made here, never seen by anyone who writes code.
  if not exists (select 1 from vault.secrets where name = 'dispatch_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'dispatch_secret',
      'Shared secret the database clocks send as x-dispatch-secret to dispatch-sms and send-invite-emails. '
      'Copy it once into the function secret DISPATCH_SECRET (docs/email-setup.md). Made in the database.'
    );
  end if;

  -- 2. The text dispatcher: 0040, plus the header.
  perform cron.unschedule(jobid) from cron.job where jobname = 'dispatch-sms';
  perform cron.schedule(
    'dispatch-sms',
    '*/5 * * * *',
    $cron$
      select net.http_post(
        url := 'https://shobqzuhicoiymtumiaz.supabase.co/functions/v1/dispatch-sms',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer sb_publishable_-Wl4FRkeoRtyQ6OeKnT9Xw_V0vzicKJ',
          'x-dispatch-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_secret')),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000);
    $cron$
  );

  -- 3. The invite emails, the same shape.
  perform cron.unschedule(jobid) from cron.job where jobname = 'send-invite-emails';
  perform cron.schedule(
    'send-invite-emails',
    '*/5 * * * *',
    $cron$
      select net.http_post(
        url := 'https://shobqzuhicoiymtumiaz.supabase.co/functions/v1/send-invite-emails',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer sb_publishable_-Wl4FRkeoRtyQ6OeKnT9Xw_V0vzicKJ',
          'x-dispatch-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'dispatch_secret')),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000);
    $cron$
  );
end;
$do$;
