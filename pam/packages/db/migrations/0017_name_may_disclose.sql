-- 0017 — Flag providers whose own name discloses a condition.
--
-- Importing the real DBHIDS feed surfaced something the fixture could not: six
-- organisations are legally named for what they treat.
--
--   Addiction Medicine & Health Advocates, Inc.
--   Fairmount Behavioral Health System
--   John F. Kennedy Behavioral Health Center
--   Mental Health Partnerships
--   The Behavioral Wellness Center At Girard/Catch
--   West Philadelphia Community Mental Health Consortium, Inc.
--
-- §0 says never display health details. Taken literally that would mean
-- renaming these, and renaming them would be worse than the disclosure: the
-- name is on the building, on the door, on the letterhead, and on what the
-- receptionist answers the phone with. A member sent to "a health service on
-- Girard Ave" cannot find the door. PAM's entire job is getting someone to the
-- right door.
--
-- So the rule is drawn where PAM actually has a choice:
--
--   * PAM must never ADD a condition label. `subcategory`, and the three
--     plain-language columns, are PAM's own words and must stay neutral. The
--     `service_type` from the source is withheld by column GRANT (0016).
--   * A provider's own name is theirs, and is shown as it is.
--   * But a name that discloses must never be pushed somewhere the member did
--     not choose to look — above all into an SMS, which lands on a lock screen
--     a roommate can read (§9).
--
-- This flag is what makes that last rule enforceable rather than a hope. The
-- reminder dispatcher consults it, the review queue sorts by it, and the
-- Phase 1 map can offer a member the option to hide these pins.

alter table public.services
  add column if not exists name_may_disclose boolean not null default false;

comment on column public.services.name_may_disclose is
  'True when the provider''s own name reveals a health or justice condition. '
  'The name is still shown — a member has to be able to find the door — but it '
  'must never be interpolated into an SMS or a push notification (SOP §9).';

-- Deliberately broad. A false positive costs a neutral message; a false
-- negative puts "Substance Abuse" on somebody's lock screen.
create or replace function public.name_discloses_condition(p_name text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_name, '') ~* (
    'substance|addiction|behavioral health|behavioural health|mental health|'
    || 'psychiatr|detox|rehab|recovery house|methadone|opioid|sober|'
    || 'gambling|crisis|suicide|hiv|aids|std|sti|'
    || 'correction|re-?entry|parole|probation|halfway'
  );
$$;

update public.services
set name_may_disclose = public.name_discloses_condition(name)
where source = 'city_import';

-- Keep the flag true on every later import without the caller remembering.
create or replace function public.set_name_may_disclose()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.name_may_disclose := public.name_discloses_condition(new.name);
  return new;
end;
$$;

create trigger services_flag_disclosing_name
  before insert or update of name on public.services
  for each row execute function public.set_name_may_disclose();

-- The withheld column list has to be restated whenever a column is added, or
-- the new one is silently unreadable.
grant select (
  id, org_id, name, category, subcategory,
  description_plain, eligibility_plain, how_to_enroll_plain,
  address, geo, place_id, phone, email, website, contact_name, hours,
  source, source_ref, provider_edited_fields, needs_review,
  last_verified_at, is_active, is_walk_in, name_may_disclose,
  created_at, updated_at
) on public.services to anon, authenticated;
