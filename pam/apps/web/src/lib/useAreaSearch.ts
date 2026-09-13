'use client';

import { useEffect, useState } from 'react';

/**
 * Where the member wants to see places from.
 *
 * Two sources, deliberately layered:
 *
 *   1. `search_areas` in Supabase — the city's ZIP codes and a landmark, about
 *      50 rows. This is the one that always works, and it is what somebody can
 *      answer from memory: §10 already asks for a ZIP at onboarding.
 *
 *   2. The City of Philadelphia's public property API, for a street address.
 *      No key, no account, and it sends `access-control-allow-origin: *`, so
 *      the browser can ask it directly. It is an enhancement: if it is slow,
 *      blocked, or offline, the ZIP list still answers.
 *
 * The typed text goes to the city's public address list and nowhere else. PAM
 * does not log it, does not store it, and does not send it to its own server —
 * where a person is staying is exactly the kind of fact this audience has good
 * reason to guard (D-054).
 */
export interface AreaOption {
  id: string;
  label: string;
  kind: 'zip' | 'neighborhood' | 'landmark' | 'address';
  lat: number;
  lon: number;
}

const CARTO_SQL = 'https://phl.carto.com/api/v2/sql';

/** Looks like the start of a street address: a house number then a letter. */
function looksLikeStreetAddress(query: string): boolean {
  return /^\d+\s+\S/.test(query.trim());
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\b(N|S|E|W|Ne|Nw|Se|Sw)\b/g, (c) => c.toUpperCase());
}

async function searchCityAddresses(query: string, signal: AbortSignal): Promise<AreaOption[]> {
  // Parameterised by escaping the one value we interpolate; the endpoint is
  // read-only and public, but a stray quote should fail closed, not run.
  const safe = query.trim().toUpperCase().replace(/'/g, "''");
  const sql = `select location, zip_code, ST_Y(the_geom) as lat, ST_X(the_geom) as lon
    from opa_properties_public
    where location like '${safe}%' and the_geom is not null
    order by location limit 6`;

  const response = await fetch(`${CARTO_SQL}?q=${encodeURIComponent(sql)}`, { signal });
  if (!response.ok) return [];

  const body = (await response.json()) as {
    rows?: { location: string; zip_code: string | null; lat: number; lon: number }[];
  };

  return (body.rows ?? []).map((row) => ({
    id: `addr:${row.location}`,
    kind: 'address' as const,
    label: row.zip_code
      ? `${titleCase(row.location)}, ${row.zip_code}`
      : titleCase(row.location),
    lat: row.lat,
    lon: row.lon,
  }));
}

export function useAreaSearch(query: string): { options: AreaOption[]; isSearching: boolean } {
  const [options, setOptions] = useState<AreaOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    // A short debounce: this fires on every keystroke, and somebody typing an
    // address on a slow connection should not queue eight requests.
    const timer = setTimeout(() => {
      const run = async () => {
        setIsSearching(true);
        try {
          const { createClient } = await import('./supabase');
          const supabase = createClient();
          const { data } = await supabase.rpc('search_areas', { p_query: query, p_limit: 8 });
          const areas = ((data ?? []) as AreaOption[]).map((row) => ({ ...row, id: String(row.id) }));

          let addresses: AreaOption[] = [];
          if (looksLikeStreetAddress(query)) {
            try {
              addresses = await searchCityAddresses(query, controller.signal);
            } catch {
              // The ZIP list still answers. An address lookup that fails is not
              // worth an error message.
            }
          }

          if (!cancelled) setOptions([...addresses, ...areas]);
        } catch {
          if (!cancelled) setOptions([]);
        } finally {
          if (!cancelled) setIsSearching(false);
        }
      };
      void run();
    }, 200);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return { options, isSearching };
}

/** The starting point, remembered on this device only. */
const STORAGE_KEY = 'pam.origin';

export const CITY_HALL: AreaOption = {
  id: 'landmark:city-hall',
  kind: 'landmark',
  label: 'City Hall',
  lat: 39.9526,
  lon: -75.1652,
};

export function loadOrigin(): AreaOption {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return CITY_HALL;
    const parsed = JSON.parse(raw) as AreaOption;
    if (typeof parsed?.lat === 'number' && typeof parsed?.lon === 'number' && parsed.label) {
      return parsed;
    }
  } catch {
    // Private window, cleared storage, or a shared phone somebody wiped.
  }
  return CITY_HALL;
}

export function saveOrigin(origin: AreaOption): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(origin));
  } catch {
    // Not being able to remember it is a worse session, not a broken one.
  }
}
