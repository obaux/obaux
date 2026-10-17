-- Staff photos that no account uses are swept each night (Lena's privacy guard, D-587; D-345, 0074). Expand only.
--
-- When a staff member changed their photo, the old file stayed in `staff-photos`. When an account was deleted, its
-- photo stayed too. So "ask us to delete it and we will" was not true for photos. The app now removes the old file
-- when a new photo is saved (`apps/web/src/lib/staffPhoto.ts`). This schedules the Edge Function
-- `sweep-staff-photos`, which once a night keeps, in each person's folder, only the file their profile points at.
-- That empties the folder of a deleted account, and catches an old file the phone failed to remove.
--
-- WHY A FUNCTION AND NOT A TRIGGER. An account is deleted by the Pam team, by deleting the profile (with its
-- auth user) when somebody asks. A trigger on that delete could remove the row from `storage.objects`, but not
-- the file the row describes: only the Storage API removes the file. So the database clock calls a function that
-- uses the Storage API, the same way the text dispatcher and the invite emails are called.
--
-- It sends the shared secret from the vault (`dispatch_secret`, 20261010144844), and the function refuses any call
-- without it. Until the function is deployed the call answers 404 and nothing happens.
--
-- To stop it without redeploying:   select cron.unschedule('sweep-staff-photos');
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

  perform cron.unschedule(jobid) from cron.job where jobname = 'sweep-staff-photos';
  perform cron.schedule(
    'sweep-staff-photos',
    '35 4 * * *',
    $cron$
      select net.http_post(
        url := 'https://shobqzuhicoiymtumiaz.supabase.co/functions/v1/sweep-staff-photos',
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
