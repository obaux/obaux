-- 0026 — Somewhere to start from, that a member can change.
--
-- The places screen was hardcoded to City Hall, and a returning citizen is
-- rarely staying at City Hall. §10 already asks "Where are you staying now?"
-- at onboarding; this is the table that question resolves against, and the one
-- the places screen uses before there is any onboarding at all.
--
-- ## Why ZIP codes
--
-- They are the one location a person reliably knows and can type from memory,
-- they are what the onboarding step already asks for, and they need no
-- geocoder. Neighbourhood names would be friendlier and PAM has no authoritative
-- list of them, so inventing one would mean inventing boundaries.
--
-- The centroid is the mean of the city's own property points in that ZIP, not
-- the centre of the polygon: it is where people actually live, which is the
-- right centre for "what is near me". Source: the City of Philadelphia's
-- `opa_properties_public`, via its public SQL API. ZIPs with fewer than 200
-- properties are omitted — they are industrial, institutional, or PO-box-only
-- and nobody is staying there.
--
-- A member can also type a street address; that is looked up live against the
-- same city API from the browser, and never stored here. See D-054.

create table if not exists public.areas (
  id         uuid primary key default gen_random_uuid(),
  region_id  uuid references public.regions (id) on delete cascade,
  kind       text not null default 'zip',
  label      text not null,
  geo        extensions.geography(Point, 4326) not null,
  created_at timestamptz not null default now(),
  constraint areas_kind_known check (kind in ('zip', 'neighborhood', 'landmark'))
);

create unique index if not exists areas_label_uniq on public.areas (region_id, kind, label);
create index if not exists areas_geo_idx on public.areas using gist (geo);

comment on table public.areas is
  'Starting points a member can choose on the places screen. Public reference '
  'data, no personal data: which area a given member picked is never written '
  'here (it stays on their device until there is an account).';

alter table public.areas enable row level security;
alter table public.areas force row level security;

drop policy if exists areas_select_all on public.areas;
create policy areas_select_all on public.areas for select using (true);

drop policy if exists areas_admin_write on public.areas;
create policy areas_admin_write on public.areas
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.areas to anon, authenticated;
grant insert, update, delete on public.areas to authenticated;

insert into public.areas (region_id, kind, label, geo)
select '0195b1c0-0000-4000-8000-000000000001', 'zip', v.zip,
       extensions.st_setsrid(extensions.st_makepoint(v.lon, v.lat), 4326)::extensions.geography
from (values
  ('19102', 39.949287, -75.166136),
  ('19103', 39.951000, -75.174322),
  ('19104', 39.963788, -75.202914),
  ('19106', 39.949373, -75.146360),
  ('19107', 39.949954, -75.159157),
  ('19111', 40.057767, -75.080269),
  ('19114', 40.062681, -74.997974),
  ('19115', 40.092189, -75.040334),
  ('19116', 40.117879, -75.017927),
  ('19118', 40.073033, -75.205303),
  ('19119', 40.055251, -75.186409),
  ('19120', 40.034383, -75.120787),
  ('19121', 39.981402, -75.174593),
  ('19122', 39.977653, -75.143016),
  ('19123', 39.964563, -75.146418),
  ('19124', 40.017395, -75.088780),
  ('19125', 39.978083, -75.125922),
  ('19126', 40.055537, -75.139970),
  ('19127', 40.027626, -75.224167),
  ('19128', 40.038862, -75.222365),
  ('19129', 40.011972, -75.188020),
  ('19130', 39.968381, -75.173140),
  ('19131', 39.981819, -75.228211),
  ('19132', 39.995343, -75.169783),
  ('19133', 39.992242, -75.141352),
  ('19134', 39.992338, -75.112401),
  ('19135', 40.025125, -75.051044),
  ('19136', 40.042236, -75.027869),
  ('19137', 40.000911, -75.073163),
  ('19138', 40.056450, -75.156881),
  ('19139', 39.961813, -75.231197),
  ('19140', 40.011801, -75.145762),
  ('19141', 40.037195, -75.145486),
  ('19142', 39.922696, -75.233069),
  ('19143', 39.945055, -75.229033),
  ('19144', 40.034386, -75.171768),
  ('19145', 39.923836, -75.179726),
  ('19146', 39.938724, -75.179671),
  ('19147', 39.936627, -75.155307),
  ('19148', 39.921360, -75.159378),
  ('19149', 40.037267, -75.065804),
  ('19150', 40.072777, -75.170564),
  ('19151', 39.975722, -75.251549),
  ('19152', 40.060878, -75.046990),
  ('19153', 39.906840, -75.242706),
  ('19154', 40.090145, -74.977666)
) as v(zip, lat, lon)
on conflict (region_id, kind, label) do update set geo = excluded.geo;

-- A landmark to fall back on, and the one the screen starts at. Named, so the
-- screen can say where it is showing places from rather than implying it knows
-- where the member is.
insert into public.areas (region_id, kind, label, geo)
values ('0195b1c0-0000-4000-8000-000000000001', 'landmark', 'City Hall',
        extensions.st_setsrid(extensions.st_makepoint(-75.1652, 39.9526), 4326)::extensions.geography)
on conflict (region_id, kind, label) do update set geo = excluded.geo;

-- ---------------------------------------------------------------------------
-- What the picker queries.
--
-- `security invoker`, like services_near: this is public reference data and RLS
-- says so, but the app gets no special path to it either.

create or replace function public.search_areas(p_query text, p_limit integer default 8)
returns table (id uuid, kind text, label text, lat double precision, lon double precision)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select a.id, a.kind, a.label,
         extensions.st_y(a.geo::extensions.geometry),
         extensions.st_x(a.geo::extensions.geometry)
  from public.areas a
  where btrim(coalesce(p_query, '')) = ''
     or a.label ilike '%' || btrim(p_query) || '%'
  order by
    -- An exact or leading match first: somebody typing "191" wants 19102 before
    -- a landmark that happens to contain the digits.
    (a.label ilike btrim(coalesce(p_query, '')) || '%') desc,
    a.kind = 'landmark' desc,
    a.label
  limit least(greatest(coalesce(p_limit, 8), 1), 25);
$$;

comment on function public.search_areas is
  'Type-ahead over the starting points on the places screen. Public reference '
  'data; the query is not logged and the choice is not stored server-side.';

revoke all on function public.search_areas(text, integer) from public;
grant execute on function public.search_areas(text, integer) to anon, authenticated;
