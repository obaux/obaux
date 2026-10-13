-- A visit nobody marked becomes "missed" a day after it ends (D-526, attendance part C).
--
-- `sweep_missed_visits()` runs nightly. A visit that is still `scheduled` 24 hours
-- after it ended (its `ends_at`, or an hour after it started when it has none)
-- becomes `missed`, but ONLY at a service whose program has a lead on Pam (an
-- organisation with an active provider, the same test as `service_has_lead`, D-498):
-- at a place nobody runs on Pam there is nobody to mark anyone as there, so
-- "missed" would be a claim with no one behind it.
--
-- It never touches an attended or cancelled visit. It pays nothing and takes
-- nothing: points are not involved at all (Will: missed visits pay nothing and
-- take nothing), and nobody is texted.
--
-- The lead can still mark the person as there for 14 days after the visit
-- (`check_in_visit` accepts a missed visit), which turns it to attended and pays
-- the 100 points as usual. Undo returns an attended visit to scheduled, and the
-- next night's sweep would call it missed again if its day has passed: that is
-- right, since nobody has it marked.
--
-- The function is for the scheduler and the service role only. It writes one
-- audit row with the count, never a name.
--
-- EXPAND ONLY: one new function and a nightly schedule where pg_cron exists.

create or replace function public.sweep_missed_visits()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  marked integer;
begin
  update public.appointments a
  set status = 'missed'
  where a.status = 'scheduled'
    and coalesce(a.ends_at, a.starts_at + interval '1 hour') < now() - interval '24 hours'
    and exists (
      select 1
      from public.services s
      join public.profiles p on p.org_id = s.org_id
      join public.profile_roles r on r.profile_id = p.id and r.role = 'provider'
      where s.id = a.service_id
        and s.org_id is not null
        and p.access_status = 'active'
    );
  get diagnostics marked = row_count;
  if marked > 0 then
    insert into public.audit_log (actor_id, action, target_type, target_id, meta)
    values (null, 'visit.sweep_missed', 'appointment', null, jsonb_build_object('count', marked));
  end if;
  return marked;
end;
$$;

revoke all on function public.sweep_missed_visits() from public, anon, authenticated;
grant execute on function public.sweep_missed_visits() to service_role;

comment on function public.sweep_missed_visits is
  'Nightly: a scheduled visit at a program with a lead on Pam, 24 hours after it ended, becomes missed. Pays and takes nothing (D-526).';

do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'sweep-missed-visits';
    perform cron.schedule('sweep-missed-visits', '20 4 * * *', 'select public.sweep_missed_visits()');
  else
    raise notice 'pg_cron is not installed here; skipping the missed-visit sweep schedule';
  end if;
end;
$do$;
