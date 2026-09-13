-- 0040 — The clock that runs the dispatcher.
--
-- Every five minutes the database calls the dispatch-sms function, which asks
-- for the messages that are due and sends them. Five minutes because a reminder
-- that is a few minutes late is fine and a schedule that fires constantly is a
-- bill; the queue carries the exact send time, so nothing arrives early.
--
-- Nothing goes out while the copy is unreviewed: the dispatcher refuses a
-- template with no human recorded against it, records the refusal on the row,
-- and moves on. This schedule can therefore be switched on long before PAM is
-- allowed to text anybody, which is the safer order to do it in.
--
-- The URL and the publishable key are the pilot project's. Both are public
-- values — the key is the one the app ships with, and the function checks who
-- is calling. The secret one (the service role key) is injected into the
-- function by Supabase and never appears here.
--
-- To stop the clock without redeploying anything:
--   select cron.unschedule('dispatch-sms');

-- Wrapped in a guard because the throwaway database the test suite stands up has
-- no scheduler extension. Skipping it there costs nothing: a schedule is a
-- property of a running project, not of the schema, and there is nothing about
-- it for the penetration suite to attack.
do $do$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    raise notice 'pg_cron is unavailable here; skipping the dispatcher schedule';
    return;
  end if;

  create extension if not exists pg_cron with schema extensions;

  perform cron.unschedule(jobid) from cron.job where jobname = 'dispatch-sms';

  perform cron.schedule(
    'dispatch-sms',
    '*/5 * * * *',
    $cron$
      select net.http_post(
        url := 'https://shobqzuhicoiymtumiaz.supabase.co/functions/v1/dispatch-sms',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer sb_publishable_-Wl4FRkeoRtyQ6OeKnT9Xw_V0vzicKJ'),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000);
    $cron$
  );
end;
$do$;
