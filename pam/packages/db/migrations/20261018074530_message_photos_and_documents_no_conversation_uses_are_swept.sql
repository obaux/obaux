-- message_photos_and_documents_no_conversation_uses_are_swept — the nightly clock for `sweep-message-files` (D-607). Expand only.
--
-- Claimed 2026-10-18 07:45:30 UTC on `claude/messages-sweep-message-files` with `pnpm claim migration`.
--
-- `privacy.s.how-long.p1` says "We keep your account, and your messages, photos and documents, while you use Pam. Ask us to delete it
-- and we will." Erasing a person cascades through the database to their messages, but nothing in the database can remove a FILE from
-- Storage, so a photo, a document or a link picture would stay. The Edge Function `sweep-message-files` (supabase/functions) is the
-- one thing that can; this schedules it, once a night, the way `sweep-staff-photos` is (D-590). It keeps, in `message-photos`,
-- `message-files` and `link-previews`, only the files a message still points at in a conversation that still exists. Live on the day
-- of writing: 0 files in the first two buckets, so nothing is orphaned yet (the merge desk counted it).
--
-- WHY A FUNCTION AND NOT A TRIGGER: see `20261016150353` (a trigger can remove the row from `storage.objects`, not the file).
--
-- It sends the shared secret from the vault (`dispatch_secret`, 20261010144844), and the function refuses any call without it. Until
-- the function is deployed the call answers 404 and nothing happens.
--
-- To stop it without redeploying:   select cron.unschedule('sweep-message-files');
--
-- Wrapped in guards because the throwaway test database has neither the scheduler nor the vault.

do $do$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is unavailable here; skipping the sweep clock';
    return;
  end if;
  if not exists (select 1 from pg_available_extensions where name = 'supabase_vault') then
    raise notice 'supabase_vault is unavailable here; skipping the sweep clock';
    return;
  end if;

  create extension if not exists pg_cron with schema extensions;
  create extension if not exists supabase_vault;

  perform cron.unschedule(jobid) from cron.job where jobname = 'sweep-message-files';
  perform cron.schedule(
    'sweep-message-files',
    '50 4 * * *',
    $cron$
      select net.http_post(
        url := 'https://shobqzuhicoiymtumiaz.supabase.co/functions/v1/sweep-message-files',
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
