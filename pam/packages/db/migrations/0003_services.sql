-- 0003 — Services, the subcategory registry, and the city-import bookkeeping.

-- §2.5: "Subcategory list is editable by admins in the admin panel; changes
-- require a migration entry, not a code change." So subcategories are rows,
-- not an enum — an admin edit is a DML write the panel performs, and the seed
-- set below is the compile-time union mirrored in @pam/config/categories.
create table public.service_subcategories (
  key        text primary key,
  category   public.service_category not null,
  label_key  text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.service_subcategories (key, category, label_key, sort_order) values
  ('ged_high_school',       'education',       'category.sub.ged_high_school',       10),
  ('college',               'education',       'category.sub.college',               20),
  ('trade_certification',   'education',       'category.sub.trade_certification',   30),
  ('literacy_esl',          'education',       'category.sub.literacy_esl',          40),
  ('computer_skills',       'education',       'category.sub.computer_skills',       50),
  ('job_openings',          'workforce',       'category.sub.job_openings',          10),
  ('job_training',          'workforce',       'category.sub.job_training',          20),
  ('resume_interview_help', 'workforce',       'category.sub.resume_interview_help', 30),
  ('apprenticeships',       'workforce',       'category.sub.apprenticeships',       40),
  ('start_a_business',      'workforce',       'category.sub.start_a_business',      50),
  ('benefits_income',       'workforce',       'category.sub.benefits_income',       60),
  ('housing',               'family_services', 'category.sub.housing',               10),
  ('food',                  'family_services', 'category.sub.food',                  20),
  ('health_counseling',     'family_services', 'category.sub.health_counseling',     30),
  ('kids_parenting',        'family_services', 'category.sub.kids_parenting',        40),
  ('id_documents',          'family_services', 'category.sub.id_documents',          50),
  ('legal_help',            'family_services', 'category.sub.legal_help',            60),
  ('transportation',        'family_services', 'category.sub.transportation',        70);

create table public.services (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid references public.orgs (id) on delete cascade,
  name                text not null,
  category            public.service_category not null,
  subcategory         text references public.service_subcategories (key) on delete set null,

  -- The *_plain columns are the 5th-grade rewrites from §5.2 step 6, capped at
  -- 60 words each by the rewriter. They are what a member actually reads.
  description_plain   text,
  eligibility_plain   text,
  how_to_enroll_plain text,

  address             text,
  geo                 extensions.geography(Point, 4326),
  place_id            text,
  phone               text,
  email               text,
  website             text,
  contact_name        text,
  hours               jsonb,

  source              public.service_source not null default 'manual',
  source_ref          text,
  -- §5.2 step 4: "import never overwrites human edits." The importer consults
  -- this array and skips any column named here.
  provider_edited_fields text[] not null default '{}',
  -- §5.2 steps 2 and 6: unmapped category, or an un-approved plain-language
  -- rewrite, lands in the admin import review queue rather than in front of a
  -- member.
  needs_review        boolean not null default false,
  last_verified_at    timestamptz,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint services_phone_e164 check (phone is null or phone ~ '^\+[1-9]\d{7,14}$'),
  -- Subcategory, when set, must belong to this service's category. Enforced by
  -- trigger below since a composite FK would need a redundant column.
  constraint services_source_ref_present check (source = 'manual' or source_ref is not null)
);

create unique index services_source_ref_uniq
  on public.services (source, source_ref) where source_ref is not null;
create index services_category_idx on public.services (category) where is_active;
create index services_subcategory_idx on public.services (subcategory) where is_active;
create index services_geo_idx on public.services using gist (geo) where is_active;
create index services_review_idx on public.services (needs_review) where needs_review;
create index services_org_idx on public.services (org_id);

create or replace function public.enforce_subcategory_matches_category()
returns trigger
language plpgsql
as $$
declare
  sub_category public.service_category;
begin
  if new.subcategory is null then
    return new;
  end if;

  select category into sub_category
  from public.service_subcategories
  where key = new.subcategory;

  if sub_category is null then
    raise exception 'Unknown subcategory "%"', new.subcategory;
  end if;

  if sub_category <> new.category then
    raise exception 'Subcategory "%" belongs to category "%", not "%"',
      new.subcategory, sub_category, new.category;
  end if;

  return new;
end;
$$;

create trigger services_subcategory_matches_category
  before insert or update of category, subcategory on public.services
  for each row execute function public.enforce_subcategory_matches_category();

-- ---------------------------------------------------------------------------
-- Import bookkeeping (§5.2).
-- ---------------------------------------------------------------------------

create table public.service_imports (
  id           uuid primary key default gen_random_uuid(),
  source_name  text not null,
  source_url   text,
  -- csv | json | geojson | socrata | arcgis | hsds  (§5.2 step 1)
  source_format text not null default 'csv',
  region_id    uuid references public.regions (id) on delete set null,
  last_run_at  timestamptz,
  rows_in      integer not null default 0,
  rows_upserted integer not null default 0,
  rows_geocoded integer not null default 0,
  errors       jsonb not null default '[]'::jsonb,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),

  constraint service_imports_format_known check (
    source_format in ('csv', 'json', 'geojson', 'socrata', 'arcgis', 'hsds')
  )
);

-- §5.2 step 3: geocoding results are cached so an unchanged address is never
-- re-geocoded. This is a cost control as much as a latency one.
create table public.geocode_cache (
  address_hash text primary key,
  address      text not null,
  geo          extensions.geography(Point, 4326),
  place_id     text,
  geocoded_at  timestamptz not null default now()
);

-- §5.1: places a member saved. Worth 5 points (§8), and readable offline (§12).
create table public.saved_places (
  member_id  uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  saved_at   timestamptz not null default now(),
  primary key (member_id, service_id)
);
