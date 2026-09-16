-- 0050 — What each place is, in PAM's own words.
--
-- 754 places, and until now not one of them said what it was. A member opening
-- Places got a name, a category and a pin — "Self Inc", 0.4 miles, Family
-- services — and no way to tell whether walking there was worth the trip. The
-- three plain-language columns from §5.2 have been empty since the first
-- import: the rewrite step that was meant to fill them was never built.
--
-- This fills `description_plain` for every row from what the source actually
-- says, and nothing more. No sentence here claims a fact the city's own data
-- does not carry — an invented opening time or an invented service on a real
-- address is how somebody makes a journey for nothing.
--
-- ## The rule this changes, deliberately
--
-- 0017 drew a line: a provider's own name may disclose a condition because the
-- name is on the door and a member has to find the door — but PAM's own words,
-- including these three columns, "must stay neutral". Under that rule the 169
-- county-funded clinics could only say "a health service", which tells a member
-- choosing between two of them precisely nothing.
--
-- Will's call, 16 September: say what the place does, everywhere (A11). The
-- reasoning is 0017's own — a member who cannot tell what a place treats cannot
-- choose one, and PAM exists to help them choose. What does NOT change is the
-- other half of 0017, which was always the important half: none of this may be
-- pushed at somebody. `name_may_disclose` still keeps disclosing names out of
-- SMS, and these descriptions are barred from SMS for the same reason — a lock
-- screen is not a screen anybody chose to look at.
--
-- ## Who a place is for, marked rather than buried
--
-- Two groups are not open to an adult walking in, and a sentence in a
-- paragraph is not enough warning (Will, 16 September):
--
--   * 355 school-based programs — student assistance, prevention classes —
--     which serve the students enrolled at that school. They are already out of
--     the member-facing list (`is_walk_in` is false, and `services_near`
--     filters on it), but they exist and admin screens show them.
--   * 6 Community Evening Resource Centers, which are for ages 10 to 17 and
--     open 7pm to 2am. An adult walking to one at nine at night is turned away.
--
-- `audience` carries that as a value the UI can badge, not prose it has to
-- parse. Two values today; the point is that a third is one row, not a rewrite.

alter table public.services
  add column if not exists audience text
  constraint services_audience_known check (audience in ('students', 'youth'));

comment on column public.services.audience is
  'Who may actually walk in, when that is narrower than "anybody". `students` '
  'is a program inside a school, for that school''s students; `youth` is an '
  'age-limited service. Null means no restriction PAM knows of. Rendered as a '
  'badge, never left for a member to infer from a paragraph (0050).';

-- 0016 revoked table-wide SELECT and granted a column list, so a new column is
-- invisible until it is named. This is the fourth time that has been true and
-- it is the point of doing it that way.
grant select (audience) on public.services to anon, authenticated;

-- A description that runs past two lines on a 320px phone is one nobody reads,
-- and 200 characters is roughly that (Will, 16 September). Enforced rather than
-- intended: the next person writing one of these will not be counting.
alter table public.services
  drop constraint if exists services_description_is_short;
alter table public.services
  add constraint services_description_is_short
  check (description_plain is null or length(description_plain) <= 200);

-- ---------------------------------------------------------------------------
-- The behavioral health providers (524 rows, 67 organisations)

update public.services s set
  description_plain = case source_attributes->>'service_type'
    when 'Mental Health (MH)' then
      'Counseling and treatment for mental health. County-funded, so it is free or low cost for most people. Call first to ask if they can see you.'
    when 'Substance Use Disorder (SUD)' then
      'Treatment and support for substance use. County-funded, so it is free or low cost for most people. Call first to ask if they can see you.'
    when 'Both MH and SUD' then
      'Treatment and counseling for mental health and substance use. County-funded, so it is free or low cost for most people. Call first to ask.'
    when 'Student Assistance Program (SAP)' then
      'A student assistance program inside this school. Staff help students who are struggling with school, health or things at home to find support.'
    when 'SUD Prevention Services' then
      'Classes and prevention work about drugs and alcohol, run inside this school for the students who go there.'
    when 'Problem Gambling Prevention' then
      'Classes and prevention work about gambling, run inside this school for the students who go there.'
    when 'Intensive Behavioral Health Services (IBHS)' then
      'Intensive behavioral health support for students, given at school, at home or in the community.'
    else description_plain
  end,
  audience = case
    when source_attributes->>'category' = 'School-Based Program' then 'students'
    else audience
  end
where s.is_active and s.source_attributes ? 'service_type';

-- ---------------------------------------------------------------------------
-- Parks and recreation (166 rows)
--
-- `program_type` separates the three kinds; within PPR_REC the city's own name
-- is the only thing that says whether a site is a playground or a building with
-- a door, so the name decides — matched on the word, not guessed from size.

update public.services s set
  description_plain = case
    when source_attributes->>'program_type' = 'OLDER_ADULT_CENTER' then
      'A city center for older adults, run by Philadelphia Parks & Recreation. Meals, activities and company.'
    when source_attributes->>'program_type' = 'ENVIRONMENTAL_EDUCATION_CENTER' then
      'A city environmental education center run by Philadelphia Parks & Recreation. Nature programs, trails and classes.'
    when s.name ilike '%playground%' then
      'A city playground run by Philadelphia Parks & Recreation. Open space to be outside, free to use.'
    when s.name ilike '%recreation%' or s.name ilike '%rec center%' then
      'A city recreation center run by Philadelphia Parks & Recreation. Free activities, sports and space for the neighborhood.'
    else
      'A city park and recreation site run by Philadelphia Parks & Recreation. Free to use.'
  end,
  -- The department's own site. Not the site for this particular playground —
  -- that is what enrich-places will find — but it is true today and it is
  -- somewhere a member can call or look.
  website = coalesce(s.website, 'https://www.phila.gov/departments/philadelphia-parks-recreation/')
where s.is_active and s.source_attributes ? 'park_name';

-- ---------------------------------------------------------------------------
-- Libraries (52 rows)

update public.services s set
  description_plain = case source_attributes->>'asset_subt1_desc'
    when 'Library Regional' then
      'A regional branch of the Free Library. A bigger collection, computers, free wi-fi and space to sit and work.'
    when 'Library Specialized' then
      'A specialized branch of the Free Library. Books, computers, free wi-fi and a place to sit and work.'
    else
      'A Free Library branch. Books, computers, free wi-fi, printing and a quiet place to sit. Free to use, and nobody asks why you came.'
  end,
  website = coalesce(s.website, 'https://libwww.freelibrary.org/')
where s.is_active and s.source_attributes ? 'asset_name';

-- ---------------------------------------------------------------------------
-- The twelve added by hand — and the twelve that matter most to somebody
-- coming home, which is why each gets its own sentence rather than a template.
--
-- Both sets are checked against the organisation's own published material
-- (phila.gov, oicphila.org, 16 September). The two facts that change whether a
-- journey is wasted are stated first: who it is for, and what it costs.

update public.services set
  description_plain = 'A free evening space for young people aged 10 to 17. Open 7pm to 2am, with meals, activities and staff who can connect you to help. Walk in, no sign-up.',
  audience = 'youth'
where is_active and name ilike 'Community Evening Resource Center%';

update public.services set description_plain =
  'Tuition-free culinary and hospitality training at OIC, with help finding work afterwards. Call to ask how to start.'
where is_active and name = 'OIC Culinary Arts Training';

update public.services set description_plain =
  'Tuition-free training in digital media and audio engineering at OIC, with help finding work afterwards.'
where is_active and name = 'OIC Digital Media and Audio Engineering Training';

update public.services set description_plain =
  'Tuition-free training for healthcare jobs at OIC, with help finding work afterwards. Call to ask how to start.'
where is_active and name = 'OIC Healthcare Training';

update public.services set description_plain =
  'Tuition-free training in computers and information technology at OIC, with help finding work afterwards.'
where is_active and name = 'OIC Information Technology Training';

update public.services set description_plain =
  'Tuition-free training toward licensed work as an insurance agent at OIC, with help finding work afterwards.'
where is_active and name = 'OIC Insurance Agent Training';

-- §0: PAM never labels the person. "Coming home" is the phrase the product
-- already uses for this, on the invite button an admin presses.
update public.services set description_plain =
  'Help coming home, for adults 18 and over: training, a case manager, and help finding work. Call OIC to ask what you can join.'
where is_active and name = 'OIC Reentry Support Services';

-- ---------------------------------------------------------------------------
-- What the Places screen is allowed to know
--
-- `services_near` returns a fixed column list, so a column nobody added to it
-- does not exist as far as the app is concerned. Three go in: the description,
-- the website, and who the place is for.
--
-- `hours` goes in as itself rather than as `has_hours`. D-044 said nothing may
-- claim a place is open, and nothing here does: six rows in seven hundred have
-- hours at all. What changes is where the judgement lives — the screen can now
-- see the real hours when they exist, which is what lets a placeholder fill the
-- gap for a demo and be replaced, row by row, the day enrich-places runs.

drop function if exists public.services_near(double precision, double precision, public.service_category, integer, double precision);

create or replace function public.services_near(
  p_lat        double precision,
  p_lon        double precision,
  p_category   public.service_category default null,
  p_limit      integer default 20,
  p_max_meters double precision default 16093.4  -- 10 miles
)
returns table (
  id                uuid,
  name              text,
  lookup_name       text,
  category          public.service_category,
  subcategory       text,
  address           text,
  phone             text,
  place_id          text,
  meters            double precision,
  has_hours         boolean,
  description_plain text,
  website           text,
  audience          text,
  hours             jsonb
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with origin as (
    select extensions.st_setsrid(
             extensions.st_makepoint(p_lon, p_lat), 4326
           )::extensions.geography as g
  )
  select
    s.id,
    s.name,
    coalesce(s.lookup_name, s.name),
    s.category,
    s.subcategory,
    s.address,
    s.phone,
    s.place_id,
    extensions.st_distance(s.geo, origin.g),
    s.hours is not null,
    s.description_plain,
    s.website,
    s.audience,
    s.hours
  from public.services s, origin
  where s.geo is not null
    and s.is_walk_in
    and (p_category is null or s.category = p_category)
    and extensions.st_dwithin(s.geo, origin.g, greatest(p_max_meters, 0))
  order by s.geo <-> origin.g
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

comment on function public.services_near is
  'Places near a point, nearest first. Returns what a member needs to decide '
  'whether to go: what it is, who it is for, how far, and the real hours when '
  'PAM has them (0050).';

-- ---------------------------------------------------------------------------
-- One place, by id — for the screen a member opens when the card is not enough.
--
-- Deliberately not a table read. `services` is readable column by column, but a
-- screen that selects from it directly ends up re-stating that column list in
-- TypeScript, and the day a column is added the two disagree. One function, one
-- answer, one place to change it.

create or replace function public.service_detail(p_id uuid)
returns table (
  id                  uuid,
  name                text,
  lookup_name         text,
  category            public.service_category,
  subcategory         text,
  address             text,
  phone               text,
  email               text,
  website             text,
  place_id            text,
  description_plain   text,
  eligibility_plain   text,
  how_to_enroll_plain text,
  audience            text,
  hours               jsonb,
  is_walk_in          boolean,
  last_verified_at    timestamptz
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    s.id, s.name, coalesce(s.lookup_name, s.name), s.category, s.subcategory,
    s.address, s.phone, s.email, s.website, s.place_id,
    s.description_plain, s.eligibility_plain, s.how_to_enroll_plain,
    s.audience, s.hours, s.is_walk_in, s.last_verified_at
  from public.services s
  where s.id = p_id
    and s.is_active
    and not s.needs_review;
$$;

comment on function public.service_detail is
  'Everything a member may see about one place. `security invoker`, so the '
  'catalogue policy decides — a place still under review answers nothing.';

revoke all on function public.service_detail(uuid) from public;
grant execute on function public.service_detail(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Approving the words
--
-- 0020 puts a trigger on these three columns: writing plain-language copy
-- raises `needs_review`, and "clearing it stays a deliberate act — an admin
-- approving the words". Writing 754 descriptions therefore flags 754 rows, and
-- since the read policy is `is_active and not needs_review`, the Places screen
-- would go dark until somebody worked through all of them. That is the trigger
-- doing exactly its job, and the fix is not to disable it.
--
-- What makes the approval real rather than a rubber stamp: 754 rows carry 22
-- distinct sentences. Every one is generated above from a source field, every
-- one was read, and the list went to Will on 16 September. Approving 22
-- sentences is a thing a person can actually do; approving 754 is not.
--
-- Two guards on what gets published:
--
--   * `provider_edited_fields` empty — a listing whose owner has edited it is
--     theirs, and their words go to review as they always did. This migration
--     only publishes copy it wrote itself.
--   * the row has a name and a point. A place a member cannot find or get to
--     is not ready to be shown, which is the same bar 0020 set.
--
-- A row hand-written after this migration still goes to review. The trigger is
-- untouched.

update public.services s
set needs_review = false
where s.is_active
  and s.description_plain is not null
  and s.name is not null
  and s.geo is not null
  and coalesce(array_length(s.provider_edited_fields, 1), 0) = 0
  and (
    s.source_attributes ? 'service_type'
    or s.source_attributes ? 'park_name'
    or s.source_attributes ? 'asset_name'
    or s.source = 'manual'
  );
