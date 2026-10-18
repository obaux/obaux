import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * What a person types never travels in a URL (a66, Piper's log check, 11 October 2026).
 *
 * The gateway in front of the database logs the whole URL of every GET, query string included, and
 * keeps it for as long as the plan keeps logs. So a filter on a GET (`.eq('name', typed)`) would put
 * what somebody typed into a log the Privacy page says holds only "when, what it asked for, which
 * account, the IP address, and the kind of phone or browser". Everything a person types — search
 * words, messages, a location — goes in the body of a POST (`.rpc(…)`, `.insert(…)`), which is not
 * logged. Today every filter in the app is on an id, a state or a setting; this test keeps it so.
 *
 * It fails when a new filter column appears (add it to ALLOWED only if its value is an id, a state,
 * a role or a setting that nobody typed) and whenever a text-search method is used on a table.
 */
const SRC = fileURLToPath(new URL('../../../apps/web/src/', import.meta.url));

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'stories' ? [] : sources(path);
    return /\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$|\.d\.ts$/.test(name) ? [path] : [];
  });
}

/** Columns the app filters a GET on, each holding an id, a state, a role, or a setting's name. */
const ALLOWED = new Set([
  'id',
  'service_id',
  'profile_id',
  'conversation_id',
  // Who wrote a message and when: an id and a time, never words. A failed send looks for its own earlier try by these (D-605).
  'sender_id',
  'created_at',
  'member_id',
  'subject_id',
  'user_id',
  'org_id',
  'archived_at',
  'read_at',
  'decision',
  'status',
  'role',
  'key',
  'is_active',
  'allowed',
]);

const FILTER = /\.(eq|neq|gt|gte|lt|lte|in|is|contains|containedBy|overlaps)\(\s*(['"`])([A-Za-z_.]+)\2/g;
const TEXT_SEARCH = /\.(ilike|like|textSearch|imatch|or)\(/;

describe('typed text never goes in a URL the API logs keep (a66)', () => {
  const files = sources(SRC).map((path) => ({ path: path.slice(SRC.length), text: readFileSync(path, 'utf8') }));

  it('finds the app’s sources', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('filters a GET only on an id, a state or a setting', () => {
    const unknown = files.flatMap(({ path, text }) =>
      [...text.matchAll(FILTER)].filter((m) => !ALLOWED.has(m[3]!)).map((m) => `${path}: ${m[0]}…)`),
    );
    expect(
      unknown,
      'A GET filter on a new column puts its value in a log. If the value is something a person types, send it in a POST body (an rpc) instead; if it is an id, a state or a setting, add the column to ALLOWED.',
    ).toEqual([]);
  });

  it('never searches a table by typed text with a GET filter', () => {
    const used = files.filter(({ text }) => TEXT_SEARCH.test(text)).map(({ path }) => path);
    expect(used, 'Search by typed words goes through an rpc (a POST), like services_search and search_areas.').toEqual([]);
  });
});
