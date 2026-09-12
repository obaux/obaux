-- 0009 — Runtime settings, and the Philadelphia pilot region.

-- ---------------------------------------------------------------------------
-- app_settings — values that must change without a deploy.
--
-- The support phone is the first of these. It appears in the HelpBar on every
-- screen (§2.4) and in SMS copy, and Will has said it will change over time.
-- A rebuild-and-redeploy to change a phone number is the kind of friction that
-- ends with the wrong number live for a week, so it is a row, not a constant.
-- ---------------------------------------------------------------------------

create table public.app_settings (
  key         text primary key,
  value       text not null,
  description text,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

comment on table public.app_settings is
  'Operational values changeable at runtime. Not secrets — everything here is '
  'world-readable by design (the support number is printed on every screen).';

insert into public.app_settings (key, value, description) values
  ('support_phone', '+12673095265',
   'PAM support line, shown in the HelpBar on every screen. E.164.'),
  ('crisis_line', '988',
   'Surfaced in-app to the sender when moderation flags self-harm (§11).');

alter table public.app_settings enable row level security;
alter table public.app_settings force row level security;

-- Readable by everyone, including anon: a member who cannot sign in still has
-- to be able to reach help (§0 "never dead-end").
create policy app_settings_read_all on public.app_settings
  for select using (true);

create policy app_settings_admin_write on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());

create trigger app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Philadelphia — the first pilot city (Will, 2026-09-12).
-- ---------------------------------------------------------------------------

insert into public.regions (id, name, center_geo, admin_org_name) values (
  '0195b1c0-0000-4000-8000-000000000001',
  'Philadelphia',
  -- City Hall, the conventional centroid for the city.
  extensions.st_setsrid(extensions.st_makepoint(-75.1652, 39.9526), 4326)::extensions.geography,
  null
);

-- ---------------------------------------------------------------------------
-- Import source registry (§5.2 step 1).
--
-- IMPORTANT: every row below is `is_active = false`. The build environment
-- cannot reach these hosts (the egress proxy blocks them), so the concrete API
-- endpoints could NOT be verified. `source_url` therefore points at the
-- catalogue page for each dataset — a page a human can open — rather than an
-- invented FeatureServer URL. Resolving the real endpoint and flipping
-- is_active is the first task of the Phase 1 importer, and it should fail loudly
-- rather than guess.
--
-- Philadelphia publishes through two systems worth knowing about:
--   * OpenDataPhilly — the regional catalogue, the city's official repository
--   * the City's ArcGIS Online org (CityGeo) — feature services behind it,
--     which is why 'arcgis' is the expected format for most of these
-- ---------------------------------------------------------------------------

insert into public.service_imports
  (source_name, source_url, source_format, region_id, is_active, errors)
values
  ('OpenDataPhilly — Health & Human Services catalogue',
   'https://opendataphilly.org/categories/health-human-services/',
   'arcgis',
   '0195b1c0-0000-4000-8000-000000000001',
   false,
   '[{"status":"unverified","note":"Catalogue page. Resolve the per-dataset FeatureServer endpoints before first run."}]'::jsonb),

  ('OpenDataPhilly — Health Centers',
   'https://opendataphilly.org/datasets/health-centers/',
   'arcgis',
   '0195b1c0-0000-4000-8000-000000000001',
   false,
   '[{"status":"unverified","note":"City primary care health centers. Maps to family_services / health_counseling."}]'::jsonb),

  ('City of Philadelphia Open Data Portal (ArcGIS)',
   'https://data-phl.opendata.arcgis.com/datasets/',
   'arcgis',
   '0195b1c0-0000-4000-8000-000000000001',
   false,
   '[{"status":"unverified","note":"CityGeo ArcGIS Online org. Serves GeoJSON/CSV per dataset."}]'::jsonb),

  ('PA 211 Southeast — HSDS export',
   'https://www.pa211.org/',
   'hsds',
   '0195b1c0-0000-4000-8000-000000000001',
   false,
   '[{"status":"unverified","note":"211 covers the widest set of family services. Needs a data-sharing agreement before use — ASK WILL."}]'::jsonb);

comment on column public.service_imports.is_active is
  'False until a human has confirmed the endpoint and the licence. The nightly '
  'job skips inactive sources.';
