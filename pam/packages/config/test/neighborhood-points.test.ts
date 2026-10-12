import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script, no types
import * as np from '../../db/scripts/neighborhood-points.mjs';

/**
 * Philadelphia's neighborhoods in the area search (D-540): where each point comes from, and that each sits inside its OWN shape.
 *
 * The GeoJSON is not committed. To check the real thing, point NEIGHBORHOODS_GEOJSON at the pinned file (the script says which);
 * without it the shape checks run on small synthetic shapes and the migration is checked against its own provenance.
 */
const MIGRATIONS = fileURLToPath(new URL('../../db/migrations/', import.meta.url));
const file = readdirSync(MIGRATIONS).find((f) => f.endsWith('_the_area_search_knows_philadelphia_s_neighborhoods.sql'))!;
const migration = readFileSync(MIGRATIONS + file, 'utf8');

const square = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]];
// A "U": its centre of mass sits in the gap, outside the shape.
const u = [[[0, 0], [9, 0], [9, 9], [6, 9], [6, 3], [3, 3], [3, 9], [0, 9], [0, 0]]];
const donut = [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], [[2, 2], [2, 8], [8, 8], [8, 2], [2, 2]]];

describe('the points are inside their own shapes', () => {
  it('uses the centre of a plain shape', () => {
    const p = np.pointFor({ type: 'Polygon', coordinates: square });
    expect([p.lon, p.lat]).toEqual([2, 2]);
    expect(p.method).toBe('centre');
  });

  it('falls back to a point on the surface where the centre is outside (a concave U)', () => {
    expect(np.inPolygon([4.5, 3.9], u)).toBe(false);
    const p = np.pointFor({ type: 'Polygon', coordinates: u });
    expect(p.method).toBe('surface');
    expect(np.inPolygon([p.lon, p.lat], u)).toBe(true);
  });

  it('keeps a point out of a hole', () => {
    const p = np.pointFor({ type: 'Polygon', coordinates: donut });
    expect(np.inPolygon([p.lon, p.lat], donut)).toBe(true);
  });

  it('uses the largest part of a multipolygon', () => {
    const small = [[[20, 20], [21, 20], [21, 21], [20, 21], [20, 20]]];
    const p = np.pointFor({ type: 'MultiPolygon', coordinates: [small, square] });
    expect(np.inPolygon([p.lon, p.lat], square)).toBe(true);
  });

  it('refuses an empty or repeated name', () => {
    const f = (name: string) => ({ properties: { LISTNAME: name }, geometry: { type: 'Polygon', coordinates: square } });
    expect(() => np.buildRows({ features: [f('A'), f('A')] })).toThrow();
    expect(() => np.buildRows({ features: [f(' ')] })).toThrow();
  });
});

describe('the migration', () => {
  it('carries its provenance: pinned source, checksum, exact licence, and the 0026 correction', () => {
    expect(migration).toContain(`blob/${np.SOURCE_COMMIT}/philadelphia-neighborhoods/philadelphia-neighborhoods.geojson`);
    expect(migration).toContain(np.GEOJSON_SHA256);
    for (const line of np.LICENCE_QUOTE.split('\n')) if (line.trim()) expect(migration).toContain(line.trim());
    expect(migration).toContain('A correction to 0026');
  });

  it('holds 159 distinct names, each with one point inside the city, and nothing else', () => {
    const rows = [...migration.matchAll(/^ {2}\('((?:[^']|'')+)', (-?\d+\.\d{5}), (-?\d+\.\d{5})\),?$/gm)];
    expect(rows).toHaveLength(159);
    expect(new Set(rows.map((r) => r[1])).size).toBe(159);
    for (const r of rows) {
      expect(Number(r[2])).toBeGreaterThan(39.86);
      expect(Number(r[2])).toBeLessThan(40.14);
      expect(Number(r[3])).toBeGreaterThan(-75.29);
      expect(Number(r[3])).toBeLessThan(-74.95);
    }
    expect(migration).not.toMatch(/polygon|multipolygon|st_geomfromgeojson/i);
  });

  it('is expand-only', () => {
    expect(migration).not.toMatch(/^\s*(drop|alter table .* (drop|rename))/im);
  });
});

const real = process.env.NEIGHBORHOODS_GEOJSON;
describe.skipIf(!real || !existsSync(real))('against the real file', () => {
  it('is the pinned file, and the migration is exactly what the script makes of it', () => {
    const raw = readFileSync(real!);
    expect(createHash('sha256').update(raw).digest('hex')).toBe(np.GEOJSON_SHA256);
    const collection = JSON.parse(raw.toString('utf8'));
    expect(collection.features).toHaveLength(159);
    for (const f of collection.features) {
      const { lon, lat } = np.pointFor(f.geometry);
      const inside = np.polygonsOf(f.geometry).some((poly: unknown) => np.inPolygon([lon, lat], poly));
      expect(inside, f.properties.LISTNAME).toBe(true);
    }
    expect(np.migrationSql(np.buildRows(collection))).toBe(migration);
  });
});
