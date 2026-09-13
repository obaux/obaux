-- 0029 — The city's Community Evening Resource Centers.
--
-- Will's second source was the Department of Human Services' "For families"
-- page. Most of what is on it is citywide programmes with no address — housing
-- help, parenting classes, support for incarcerated parents — and PAM's whole
-- model is "a place you can walk into", so those cannot be cards yet without
-- pretending they are somewhere. That gap is written up in STATUS.
--
-- What IS place-based is the Community Evening Resource Centers: six sites,
-- one per part of the city, open in the evening as an alternative to a young
-- person being taken into custody. For this product's audience — parents who
-- have just come home — that is the difference between a phone call at 10pm and
-- a court date, and it is exactly the kind of thing PAM exists to put within
-- reach.
--
-- Curated by hand from the department's page, so `source = 'manual'`. The
-- coordinates come from the city's own property list: four of the six are
-- tax-exempt and therefore missing from it, so those use the nearest numbered
-- property on the same block, which puts the pin on the right building face.
-- Directions are built from the point (D-050), so a few metres is the whole
-- error.
--
-- Two are hosted at a Juvenile Justice Center, which is the host's name and is
-- shown as such — a member has to be able to find the door — while 0028 makes
-- sure it never leaves the app in a notification.

do $$
declare
  v_region uuid := '0195b1c0-0000-4000-8000-000000000001';
begin
  insert into public.services as s (
    name, lookup_name, category, subcategory,
    address, geo, phone, website,
    source, source_ref, needs_review, is_active, is_walk_in
  )
  select
    c.name, c.host, 'family_services'::public.service_category, null,
    c.address,
    extensions.st_setsrid(extensions.st_makepoint(c.lon, c.lat), 4326)::extensions.geography,
    c.phone,
    'https://www.phila.gov/programs/community-evening-resource-centers/',
    'manual'::public.service_source, c.ref, false, true, true
  from (values
    ('cerc:northwest', 'Community Evening Resource Center at Juvenile Justice Center',
     'Juvenile Justice Center', '100 W Coulter St, Philadelphia, PA 19144',
     '+12158492112', 40.030981, -75.172502),
    ('cerc:south', 'Community Evening Resource Center at Greater Philadelphia Community Alliance',
     'Greater Philadelphia Community Alliance', '1920 S 20th St, Philadelphia, PA 19145',
     '+12153363511', 39.927418, -75.178651),
    ('cerc:southwest', 'Community Evening Resource Center at Community of Compassion',
     'Community of Compassion, Inc.', '6150 Cedar Ave, Philadelphia, PA 19143',
     '+12152396820', 39.952670, -75.246576),
    ('cerc:east', 'Community Evening Resource Center at Xiente',
     'Xiente', '2036 N Mascher St, Philadelphia, PA 19122',
     '+12154268734', 39.981295, -75.134808),
    ('cerc:northeast', 'Community Evening Resource Center at Unique Dreams',
     'Unique Dreams', '4704 Leiper St, Philadelphia, PA 19124',
     '+12672352115', 40.018368, -75.086578),
    ('cerc:central', 'Community Evening Resource Center at Juvenile Justice Center of Philadelphia',
     'Juvenile Justice Center of Philadelphia', '1632 N 16th St, Philadelphia, PA 19121',
     '+12158492112', 39.978557, -75.161521)
  ) as c(ref, name, host, address, phone, lat, lon)
  on conflict (source, source_ref) where source_ref is not null
  do update set
    name = case when 'name' = any (s.provider_edited_fields) then s.name else excluded.name end,
    address = excluded.address,
    geo = excluded.geo,
    phone = excluded.phone,
    website = excluded.website,
    lookup_name = excluded.lookup_name,
    last_verified_at = now();
end;
$$;

-- Curated sources belong in the same bookkeeping as machine imports: the next
-- person asking "did anyone look at DHS?" looks here, and the answer should not
-- depend on whether a robot did the reading.
alter table public.service_imports
  drop constraint if exists service_imports_format_known;
alter table public.service_imports
  add constraint service_imports_format_known check (
    source_format in ('csv', 'json', 'geojson', 'socrata', 'arcgis', 'hsds', 'manual')
  );

insert into public.service_imports
  (source_name, source_url, source_format, region_id, is_active, errors)
values
  ('Philadelphia DHS — For families',
   'https://www.phila.gov/departments/department-of-human-services/for-families/',
   'manual',
   '0195b1c0-0000-4000-8000-000000000001',
   false,
   '[{"status":"partially_usable","checked_at":"2026-09-12","note":"Six Community Evening Resource Centers have addresses and phone numbers and are entered by hand. The rest of the page is citywide programmes with no location — housing, parenting education, support for incarcerated parents, domestic violence help — which PAM cannot show until it can list a service that is not a place."}]'::jsonb)
on conflict do nothing;
