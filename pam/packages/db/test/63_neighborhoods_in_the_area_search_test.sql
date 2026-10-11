-- neighborhoods in the area search (test 63).
--
-- Claimed 2026-10-11 on `claude/places-programs-neighborhoods` with `pnpm claim test`. The files run in name order
-- on one database: choose ids and phone numbers no other file uses (grep this folder),
-- and count only your own rows.

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages to notice;

\echo ''
\echo '--- Neighborhoods in the area search (D-540) ---'

do $$
declare
  n integer;
  r record;
begin
  select count(*) into n from public.areas where kind = 'neighborhood';
  if n <> 159 then
    raise exception 'FAIL  expected 159 neighborhoods, got %', n;
  end if;
  raise notice 'ok    159 neighborhoods are seeded';

  -- Every point is inside the city's own box, so a mistyped coordinate cannot put a neighborhood in the river or in Jersey.
  select count(*) into n from public.areas
  where kind = 'neighborhood'
    and (extensions.st_y(geo::extensions.geometry) not between 39.86 and 40.14
      or extensions.st_x(geo::extensions.geometry) not between -75.29 and -74.95);
  if n <> 0 then
    raise exception 'FAIL  % neighborhood points fall outside Philadelphia', n;
  end if;
  raise notice 'ok    every neighborhood point is inside the city';

  -- The names are real, and the points are where those places are (within about a kilometre).
  for r in
    select * from (values
      ('Fishtown - Lower Kensington', 39.9730, -75.1250),
      ('Rittenhouse', 39.9492, -75.1728),
      ('Chestnut Hill', 40.0716, -75.2106)
    ) as v(label, lat, lon)
  loop
    select count(*) into n from public.areas a
    where a.kind = 'neighborhood' and a.label = r.label
      and extensions.st_distance(a.geo, extensions.st_setsrid(extensions.st_makepoint(r.lon, r.lat), 4326)::extensions.geography) < 1000;
    if n <> 1 then
      raise exception 'FAIL  % is missing or in the wrong place', r.label;
    end if;
  end loop;
  raise notice 'ok    known neighborhoods are where they should be';

  select count(*) into n from public.search_areas('fishtown', 8) where kind = 'neighborhood';
  if n < 1 then
    raise exception 'FAIL  typing "fishtown" found nothing';
  end if;
  raise notice 'ok    "fishtown" finds its neighborhood';

  select count(*) into n from public.search_areas('kens', 25) where kind = 'neighborhood';
  if n < 2 then
    raise exception 'FAIL  typing "kens" found % neighborhoods', n;
  end if;
  raise notice 'ok    part of a name finds the neighborhoods that contain it';

  -- The source's sorted names are found however a resident writes them (the function matches every word, in any order).
  select count(*) into n from public.search_areas('east germantown', 8) where label = 'Germantown, East';
  if n <> 1 then raise exception 'FAIL  "east germantown" did not find "Germantown, East"'; end if;
  select count(*) into n from public.search_areas('old kensington', 8) where label = 'Kensington, Old';
  if n <> 1 then raise exception 'FAIL  "old kensington" did not find "Kensington, Old"'; end if;
  select count(*) into n from public.search_areas('west, mount airy', 8) where label = 'Mount Airy, West';
  if n <> 1 then raise exception 'FAIL  "west, mount airy" did not find "Mount Airy, West"'; end if;
  select count(*) into n from public.search_areas('east germantown nowhere', 8);
  if n <> 0 then raise exception 'FAIL  a word that is nowhere still matched'; end if;
  select count(*) into n from public.search_areas('100%', 8);
  if n <> 0 then raise exception 'FAIL  a percent sign matched everything'; end if;
  raise notice 'ok    every word typed has to match, in any order';

  -- What was there before still answers the same.
  select count(*) into n from public.search_areas('19104', 8) where kind = 'zip';
  if n <> 1 then
    raise exception 'FAIL  a ZIP code no longer resolves';
  end if;
  select count(*) into n from public.search_areas('City Hall', 8) where kind = 'landmark';
  if n <> 1 then
    raise exception 'FAIL  City Hall no longer resolves';
  end if;
  raise notice 'ok    ZIP codes and City Hall still resolve';

  select count(*) into n from public.search_areas('', 8);
  if n <> 8 then
    raise exception 'FAIL  an empty query returned % rows, expected the limit of 8', n;
  end if;
  raise notice 'ok    the limit still holds';
end;
$$;
