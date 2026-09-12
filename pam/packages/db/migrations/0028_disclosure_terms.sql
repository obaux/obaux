-- 0028 — Three more words that give somebody away.
--
-- 0017 built the flag that keeps a disclosing name off a lock screen, and the
-- list of words it looks for was drawn from one source: behavioural health
-- providers. Two new sources bring names that clear that list and disclose just
-- as badly:
--
--   "Community Evening Resource Center at Juvenile Justice Center"
--   "Support for incarcerated parents"
--   "Get help with domestic violence"
--
-- A domestic violence service is the sharpest of these. A notification naming
-- one can reach the person somebody is trying to get away from, and that is a
-- safety question rather than a privacy one.
--
-- The list stays deliberately broad, for the reason 0017 gave: a false positive
-- costs a neutral message, a false negative puts somebody's business on a
-- screen a roommate can read. Plain "justice" is left out — it would catch
-- Justice Bell Park and every civic building — while "juvenile" is in, because
-- nothing neutral is called that.

create or replace function public.name_discloses_condition(p_name text)
returns boolean
language sql
immutable
set search_path = public, extensions, pg_temp
as $$
  select coalesce(p_name, '') ~* (
    'substance|addiction|behavioral health|behavioural health|mental health|'
    || 'psychiatr|detox|rehab|recovery house|methadone|opioid|sober|'
    || 'gambling|crisis|suicide|hiv|aids|std|sti|'
    || 'correction|re-?entry|parole|probation|halfway|'
    || 'juvenile|incarcerat|domestic violence'
  );
$$;

-- Re-flag everything already in the catalogue, whatever its source: the rule
-- changed, so the answers have to be recomputed rather than left at whatever
-- the trigger decided when each row arrived.
update public.services
set name_may_disclose = public.name_discloses_condition(name)
where name_may_disclose is distinct from public.name_discloses_condition(name);
