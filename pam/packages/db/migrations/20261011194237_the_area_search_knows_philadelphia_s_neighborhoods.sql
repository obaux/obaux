-- The area search knows Philadelphia's neighborhoods (D-540).
--
-- 159 rows into `public.areas` (kind 'neighborhood'): a name and ONE point each, nothing else. Pam never holds
-- a boundary. `search_areas` already matches any part of a label, so typing "fishtown" or "kens" finds them with no
-- change to the function; the search is a POST to Pam alone, so this adds no promise to Privacy.
--
-- ## Where the names and points come from (also in packages/db/scripts/neighborhood-points.mjs, which made this file)
--
-- Source, pinned: https://github.com/azavea/geo-data/blob/5c4538b5f4d2a26a81b7fab2d0006d327a39e3d0/philadelphia-neighborhoods/philadelphia-neighborhoods.geojson
--   (azavea/geo-data, folder philadelphia-neighborhoods, commit 5c4538b, 5 December 2025; its README: data
--   "released to the public on OpenDataPhilly").
-- SHA-256 of the GeoJSON the script read: 69c189df692a95d21385e13515c514bebd9e2d3c32ef8a265159d3be7f3f6bab
-- Licence, as the source's license.txt states it, word for word:
--   "This data is released under the Creative Commons 4.0 Attribution license.
--
--   Please refer to https://creativecommons.org/licenses/by/4.0/ and attribute the data to Abaca Labs."
-- Pam credits Abaca Labs under "Data sources" on the Legal screen, says where it came from, and says it was changed:
-- one point is kept for each neighborhood, and no boundaries.
--
-- The point is the area-weighted centre of the neighborhood's largest part; where that falls outside the shape, a point on
-- the surface (the middle of its widest stretch); every point was checked to lie inside its OWN shape, after rounding to
-- five decimals. Names are the source's LISTNAME.
--
-- ## A correction to 0026, which is applied history and is not edited
--
-- 0026 says a street address is "looked up live against the same city API from the browser". That has not been true since
-- D-536: the browser no longer calls the City, and the area search finds ZIP codes, City Hall and, with this, neighborhoods.
-- 0026 also says Pam holds no list of places someone might be staying. This list is acceptable because it is a published,
-- widely used list of the city's neighborhood names, not anything about a person, and Pam keeps a name and one point for each,
-- never boundaries. Nobody's choice of area is written here.
--
-- EXPAND ONLY: rows, and a comment.

insert into public.areas (region_id, kind, label, geo)
select '0195b1c0-0000-4000-8000-000000000001', 'neighborhood', v.label,
       extensions.st_setsrid(extensions.st_makepoint(v.lon, v.lat), 4326)::extensions.geography
from (values
  ('Academy Gardens', 40.06119, -75.00310),
  ('Airport', 39.88310, -75.21830),
  ('Allegheny West', 40.00386, -75.17911),
  ('Andorra', 40.07163, -75.23373),
  ('Aston-Woodbridge', 40.06345, -75.01370),
  ('Bartram Village', 39.93286, -75.21327),
  ('Bella Vista', 39.93916, -75.15612),
  ('Belmont', 39.96907, -75.20708),
  ('Blue Bell Hill', 40.03161, -75.19297),
  ('Brewerytown', 39.97945, -75.18100),
  ('Bridesburg', 39.99728, -75.06936),
  ('Burholme', 40.06738, -75.08967),
  ('Bustleton', 40.09339, -75.04223),
  ('Byberry', 40.11301, -74.98575),
  ('Callowhill', 39.95951, -75.15531),
  ('Carroll Park', 39.97363, -75.23304),
  ('Cedar Park', 39.94774, -75.21990),
  ('Cedarbrook', 40.07494, -75.17596),
  ('Center City East', 39.95423, -75.16018),
  ('Chestnut Hill', 40.07156, -75.21057),
  ('Chinatown', 39.95551, -75.15608),
  ('Clearview', 39.90970, -75.24729),
  ('Cobbs Creek', 39.95378, -75.23903),
  ('Crescentville', 40.03709, -75.09598),
  ('Crestmont Farms', 40.06984, -74.97922),
  ('Dearnley Park', 40.04459, -75.24191),
  ('Dickinson Narrows', 39.92996, -75.15423),
  ('Dunlap', 39.96186, -75.22203),
  ('East Falls', 40.01741, -75.18988),
  ('East Kensington', 39.98446, -75.12756),
  ('East Oak Lane', 40.05261, -75.13311),
  ('East Park', 39.98226, -75.19210),
  ('East Parkside', 39.97397, -75.20640),
  ('East Passyunk', 39.92696, -75.16367),
  ('East Poplar', 39.96594, -75.14963),
  ('Eastwick', 39.89328, -75.24592),
  ('Elmwood', 39.91970, -75.23046),
  ('Fairhill', 39.99802, -75.13780),
  ('Fairmount', 39.97090, -75.17794),
  ('Feltonville', 40.01951, -75.12196),
  ('Fern Rock', 40.04239, -75.13934),
  ('Fishtown - Lower Kensington', 39.97289, -75.12471),
  ('Fitler Square', 39.94694, -75.18283),
  ('Fox Chase', 40.07225, -75.07662),
  ('Francisville', 39.96980, -75.16565),
  ('Frankford', 40.01249, -75.08213),
  ('Franklin Mills', 40.08711, -74.96287),
  ('Franklinville', 40.00415, -75.14517),
  ('Garden Court', 39.95257, -75.22035),
  ('Germantown, East', 40.04679, -75.16428),
  ('Germantown, Morton', 40.04367, -75.17432),
  ('Germantown, Penn Knox', 40.03143, -75.17285),
  ('Germantown, Southwest', 40.02359, -75.16737),
  ('Germantown, West Central', 40.03632, -75.18301),
  ('Germantown, Westside', 40.02685, -75.17746),
  ('Germany Hill', 40.03612, -75.23044),
  ('Girard Estates', 39.91812, -75.17998),
  ('Glenwood', 39.99890, -75.16056),
  ('Graduate Hospital', 39.94210, -75.17813),
  ('Grays Ferry', 39.93375, -75.19450),
  ('Greenwich', 39.92399, -75.15713),
  ('Haddington', 39.96630, -75.23580),
  ('Harrowgate', 39.99746, -75.10211),
  ('Hartranft', 39.98949, -75.14887),
  ('Haverford North', 39.96460, -75.20794),
  ('Hawthorne', 39.94032, -75.16274),
  ('Holmesburg', 40.03371, -75.01936),
  ('Hunting Park', 40.01192, -75.13288),
  ('Industrial', 39.91099, -75.20863),
  ('Juniata Park', 40.01029, -75.10360),
  ('Kensington, Old', 39.97305, -75.14059),
  ('Kensington, West', 39.98435, -75.13752),
  ('Kingsessing', 39.93984, -75.23160),
  ('Lawndale', 40.04397, -75.10137),
  ('Lexington Park', 40.05520, -75.04398),
  ('Logan', 40.02935, -75.14887),
  ('Logan Square', 39.95881, -75.17161),
  ('Lower Moyamensing', 39.91974, -75.16395),
  ('Ludlow', 39.97460, -75.14794),
  ('Manayunk', 40.02864, -75.22443),
  ('Mantua', 39.96739, -75.19492),
  ('Mayfair', 40.03554, -75.05842),
  ('McGuire', 39.99317, -75.13205),
  ('Mechanicsville', 40.10774, -74.96634),
  ('Melrose Park Gardens', 40.04742, -75.11795),
  ('Mill Creek', 39.96684, -75.21753),
  ('Millbrook', 40.07867, -74.97254),
  ('Modena', 40.08307, -74.98228),
  ('Morrell Park', 40.07066, -74.99129),
  ('Mount Airy, East', 40.05946, -75.18112),
  ('Mount Airy, West', 40.04898, -75.19647),
  ('Navy Yard', 39.88964, -75.16956),
  ('Newbold', 39.92659, -75.17245),
  ('Nicetown', 40.01743, -75.15674),
  ('Normandy Village', 40.10198, -74.99417),
  ('North Central', 39.98009, -75.16548),
  ('Northeast Phila Airport', 40.08672, -75.00631),
  ('Northern Liberties', 39.96311, -75.13946),
  ('Northwood', 40.02303, -75.09711),
  ('Ogontz', 40.04580, -75.15148),
  ('Old City', 39.95233, -75.14791),
  ('Olney', 40.03446, -75.12565),
  ('Overbrook', 39.97866, -75.25348),
  ('Oxford Circle', 40.04489, -75.07509),
  ('Packer Park', 39.90567, -75.18328),
  ('Parkwood Manor', 40.10027, -74.97293),
  ('Paschall', 39.92552, -75.23725),
  ('Passyunk Square', 39.93335, -75.16193),
  ('Pennsport', 39.92780, -75.14957),
  ('Pennypack', 40.06912, -75.02738),
  ('Pennypack Park', 40.07932, -75.05636),
  ('Pennypack Woods', 40.05454, -75.01747),
  ('Penrose', 39.91004, -75.23731),
  ('Point Breeze', 39.93452, -75.17738),
  ('Port Richmond', 39.97526, -75.10635),
  ('Powelton', 39.96039, -75.19180),
  ('Queen Village', 39.93772, -75.14875),
  ('Rhawnhurst', 40.06127, -75.05655),
  ('Richmond', 39.98584, -75.09524),
  ('Rittenhouse', 39.94918, -75.17277),
  ('Riverfront', 39.91981, -75.13964),
  ('Roxborough', 40.03090, -75.21348),
  ('Roxborough Park', 40.03949, -75.23471),
  ('Sharswood', 39.97564, -75.17300),
  ('Society Hill', 39.94452, -75.14916),
  ('Somerton', 40.11645, -75.01689),
  ('Southwest Schuylkill', 39.93864, -75.21601),
  ('Spring Garden', 39.96533, -75.16878),
  ('Spruce Hill', 39.95278, -75.21001),
  ('Stadium District', 39.90595, -75.16158),
  ('Stanton', 39.98959, -75.16240),
  ('Strawberry Mansion', 39.99107, -75.17925),
  ('Summerdale', 40.03134, -75.09137),
  ('Tacony', 40.02249, -75.04294),
  ('Tioga', 40.01068, -75.16286),
  ('Torresdale', 40.04827, -74.99352),
  ('University City', 39.95221, -75.19331),
  ('Upper Kensington', 39.99882, -75.12456),
  ('Upper Roxborough', 40.05529, -75.24164),
  ('Walnut Hill', 39.95656, -75.21951),
  ('Washington Square West', 39.94735, -75.15954),
  ('West Oak Lane', 40.06298, -75.15566),
  ('West Park', 39.99062, -75.20714),
  ('West Parkside', 39.97679, -75.21925),
  ('West Passyunk', 39.92639, -75.18137),
  ('West Poplar', 39.96631, -75.15616),
  ('West Powelton', 39.96020, -75.20598),
  ('West Torresdale', 40.06910, -75.00059),
  ('Whitman', 39.91819, -75.15274),
  ('Winchester Park', 40.05400, -75.02976),
  ('Wissahickon', 40.01963, -75.20967),
  ('Wissahickon Hills', 40.04024, -75.21909),
  ('Wissahickon Park', 40.04996, -75.21449),
  ('Wissinoming', 40.01677, -75.06197),
  ('Wister', 40.03370, -75.16396),
  ('Woodland Terrace', 39.94835, -75.20707),
  ('Wynnefield', 39.98928, -75.22984),
  ('Wynnefield Heights', 40.00255, -75.21172),
  ('Yorktown', 39.97530, -75.15423)
) as v(label, lat, lon)
on conflict (region_id, kind, label) do nothing;

comment on table public.areas is
  'Starting points a member can choose on the places screen: ZIP codes, City Hall and Philadelphia neighborhoods '
  '(a name and one point each, from azavea/geo-data, CC BY 4.0, Abaca Labs; D-540). Public reference data, no personal '
  'data: which area a given member picked is never written here.';
