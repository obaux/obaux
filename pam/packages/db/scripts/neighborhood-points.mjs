#!/usr/bin/env node
/**
 * Philadelphia's neighborhoods, one named point each, for Pam's area search (D-540).
 *
 *   node packages/db/scripts/neighborhood-points.mjs <philadelphia-neighborhoods.geojson> > migration.sql
 *
 * SOURCE (pinned): https://github.com/azavea/geo-data/blob/5c4538b5f4d2a26a81b7fab2d0006d327a39e3d0/philadelphia-neighborhoods/philadelphia-neighborhoods.geojson
 *   azavea/geo-data, folder philadelphia-neighborhoods, commit 5c4538b5f4d2a26a81b7fab2d0006d327a39e3d0 (5 December 2025).
 *   The repository's README says the data was "released to the public on OpenDataPhilly".
 * SHA-256 of the GeoJSON this script reads (checked before anything is computed): see GEOJSON_SHA256 below.
 * LICENCE, as the source's license.txt states it, word for word:
 *   "This data is released under the Creative Commons 4.0 Attribution license. \n\nPlease refer to
 *    https://creativecommons.org/licenses/by/4.0/ and attribute the data to Abaca Labs."
 *   (There is a space after "license." and a blank line before "Please".) Pam credits Abaca Labs on the Legal screen.
 *
 * WHAT IT KEEPS: a name (the source's LISTNAME) and ONE point per neighborhood. Never the boundaries.
 * THE POINT: the area-weighted centre of the neighborhood's largest part (holes taken out). If that centre falls outside
 * the shape (a plain centre does, for a crescent or an L) the point is a point on the surface instead: the middle of the
 * widest stretch of a horizontal line through the shape, as PostGIS's ST_PointOnSurface does. Every point is then checked
 * to lie inside its OWN shape, after rounding to five decimals (about a metre); if one does not, the script stops.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const SOURCE_COMMIT = '5c4538b5f4d2a26a81b7fab2d0006d327a39e3d0';
export const GEOJSON_SHA256 = '69c189df692a95d21385e13515c514bebd9e2d3c32ef8a265159d3be7f3f6bab';
export const REGION_ID = '0195b1c0-0000-4000-8000-000000000001';
export const LICENCE_QUOTE =
  'This data is released under the Creative Commons 4.0 Attribution license. \n\nPlease refer to https://creativecommons.org/licenses/by/4.0/ and attribute the data to Abaca Labs.';

/** Signed area and centroid of a closed ring of [x, y]. */
export function ringAreaCentroid(ring) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const c = x0 * y1 - x1 * y0;
    a += c;
    cx += (x0 + x1) * c;
    cy += (y0 + y1) * c;
  }
  a /= 2;
  return a === 0 ? { area: 0, x: ring[0][0], y: ring[0][1] } : { area: a, x: cx / (6 * a), y: cy / (6 * a) };
}

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    if (y0 > y !== y1 > y && x < ((x1 - x0) * (y - y0)) / (y1 - y0) + x0) inside = !inside;
  }
  return inside;
}

/** Inside the outer ring and outside every hole. A polygon is [outer, ...holes]. */
export function inPolygon(point, polygon) {
  return inRing(point, polygon[0]) && !polygon.slice(1).some((hole) => inRing(point, hole));
}

export const polygonsOf = (geometry) => (geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]);
const inShape = (point, geometry) => polygonsOf(geometry).some((polygon) => inPolygon(point, polygon));

/** Area and centre of a polygon with its holes taken out. */
export function polygonAreaCentroid(polygon) {
  const outer = ringAreaCentroid(polygon[0]);
  let area = Math.abs(outer.area);
  let x = outer.x * area;
  let y = outer.y * area;
  for (const hole of polygon.slice(1)) {
    const h = ringAreaCentroid(hole);
    const ha = Math.abs(h.area);
    area -= ha;
    x -= h.x * ha;
    y -= h.y * ha;
  }
  return { area, x: x / area, y: y / area };
}

/** The middle of the widest stretch inside the polygon along several horizontal lines (as ST_PointOnSurface). */
export function pointOnSurface(polygon) {
  const ys = polygon[0].map((p) => p[1]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  let best = null;
  for (let k = 1; k < 20; k += 1) {
    const y = lo + ((hi - lo) * k) / 20;
    const xs = [];
    for (const ring of polygon) {
      for (let i = 0; i < ring.length - 1; i += 1) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[i + 1];
        if (y0 > y !== y1 > y) xs.push(((x1 - x0) * (y - y0)) / (y1 - y0) + x0);
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const width = xs[i + 1] - xs[i];
      if (!best || width > best.width) best = { width, x: (xs[i] + xs[i + 1]) / 2, y };
    }
  }
  if (!best) throw new Error('no point on the surface');
  return [best.x, best.y];
}

export const round5 = (n) => Math.round(n * 1e5) / 1e5;

/** [lon, lat], inside its own shape. */
export function pointFor(geometry) {
  const parts = polygonsOf(geometry);
  const biggest = parts.map((polygon) => ({ polygon, ...polygonAreaCentroid(polygon) })).sort((a, b) => b.area - a.area)[0];
  let point = [biggest.x, biggest.y];
  let method = 'centre';
  if (!inPolygon(point, biggest.polygon)) {
    point = pointOnSurface(biggest.polygon);
    method = 'surface';
  }
  point = [round5(point[0]), round5(point[1])];
  if (!inShape(point, geometry)) throw new Error('a point fell outside its own shape');
  return { lon: point[0], lat: point[1], method };
}

const sql = (text) => `'${text.replace(/'/g, "''")}'`;

export function buildRows(collection) {
  const rows = collection.features.map((f) => ({ label: String(f.properties.LISTNAME).trim(), ...pointFor(f.geometry) }));
  const labels = new Set();
  for (const row of rows) {
    if (!row.label || labels.has(row.label)) throw new Error(`a neighborhood name is empty or repeated: ${row.label}`);
    labels.add(row.label);
  }
  return rows.sort((a, b) => a.label.localeCompare(b.label));
}

export function migrationSql(rows, stamp) {
  const lines = rows.map((r) => `  (${sql(r.label)}, ${r.lat.toFixed(5)}, ${r.lon.toFixed(5)})`).join(',\n');
  return `-- The area search knows Philadelphia's neighborhoods (D-540).
--
-- ${rows.length} rows into \`public.areas\` (kind 'neighborhood'): a name and ONE point each, nothing else. Pam never holds
-- a boundary. \`search_areas\` already matches any part of a label, so typing "fishtown" or "kens" finds them with no
-- change to the function; the search is a POST to Pam alone, so this adds no promise to Privacy.
--
-- ## Where the names and points come from (also in packages/db/scripts/neighborhood-points.mjs, which made this file)
--
-- Source, pinned: https://github.com/azavea/geo-data/blob/${SOURCE_COMMIT}/philadelphia-neighborhoods/philadelphia-neighborhoods.geojson
--   (azavea/geo-data, folder philadelphia-neighborhoods, commit ${SOURCE_COMMIT.slice(0, 7)}, 5 December 2025; its README: data
--   "released to the public on OpenDataPhilly").
-- SHA-256 of the GeoJSON the script read: ${GEOJSON_SHA256}
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
select '${REGION_ID}', 'neighborhood', v.label,
       extensions.st_setsrid(extensions.st_makepoint(v.lon, v.lat), 4326)::extensions.geography
from (values
${lines}
) as v(label, lat, lon)
on conflict (region_id, kind, label) do nothing;

comment on table public.areas is
  'Starting points a member can choose on the places screen: ZIP codes, City Hall and Philadelphia neighborhoods '
  '(a name and one point each, from azavea/geo-data, CC BY 4.0, Abaca Labs; D-540). Public reference data, no personal '
  'data: which area a given member picked is never written here.';
`;
}

function main() {
  const path = process.argv[2];
  if (!path) throw new Error('usage: neighborhood-points.mjs <philadelphia-neighborhoods.geojson>');
  const raw = readFileSync(path);
  const sum = createHash('sha256').update(raw).digest('hex');
  if (sum !== GEOJSON_SHA256) throw new Error(`the GeoJSON is not the pinned one: sha256 ${sum}`);
  process.stdout.write(migrationSql(buildRows(JSON.parse(raw.toString('utf8')))));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
