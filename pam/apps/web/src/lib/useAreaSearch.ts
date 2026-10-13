'use client';

import { useEffect, useState } from 'react';

/**
 * Where the member wants to see places from.
 *
 * One source: `search_areas` in Supabase — the city's ZIP codes and a landmark
 * (City Hall), about 50 rows; it matches labels only, so a neighbourhood name finds
 * nothing yet. It always works, and it is what somebody can
 * answer from memory: §10 already asks for a ZIP at onboarding.
 *
 * The typed text goes to Pam's `search_areas` as the body of a POST, which neither
 * the API gateway nor Postgres logs, and Pam stores none of it. It goes nowhere
 * else (D-536). Until 11 October the browser also asked the City of Philadelphia's
 * public property API about anything that began like a street address, so the
 * City's server got the part-typed address and the phone's IP address on every
 * pause in typing; D-054's "does not go to Pam's server" was also not true of the
 * ZIP list. Where a person is staying is exactly the kind of fact this audience
 * has good reason to guard.
 */
export interface AreaOption {
  id: string;
  label: string;
  kind: 'zip' | 'neighborhood' | 'landmark' | 'address';
  lat: number;
  lon: number;
}

export function useAreaSearch(query: string): { options: AreaOption[]; isSearching: boolean; answered: string | null } {
  const [options, setOptions] = useState<AreaOption[]>([]);
  // The text the options below answer, so a caller can tell a fresh answer from one left over from the letters before (D-552).
  const [answered, setAnswered] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // A short debounce: this fires on every keystroke, and somebody typing on a
    // slow connection should not queue eight requests.
    const timer = setTimeout(() => {
      const run = async () => {
        setIsSearching(true);
        try {
          const { createClient } = await import('./supabase');
          const supabase = createClient();
          const { data } = await supabase.rpc('search_areas', { p_query: query, p_limit: 8 });
          const areas = ((data ?? []) as AreaOption[]).map((row) => ({ ...row, id: String(row.id) }));

          if (!cancelled) {
            setOptions(areas);
            setAnswered(query);
          }
        } catch {
          if (!cancelled) {
            setOptions([]);
            setAnswered(query);
          }
        } finally {
          if (!cancelled) setIsSearching(false);
        }
      };
      void run();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { options, isSearching, answered };
}

/** The id prefix of a place picked from Google's street suggestions (D-552). It is for this search only and never kept, like the phone's position. */
export const GOOGLE_PICK = 'google:';

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
    // A phone's own position kept by an earlier version is thrown away, and the next visit
    // starts from City Hall (D-536); so is a street address picked from Google's suggestions (D-552).
    if (parsed?.id === 'here' || String(parsed?.id).startsWith(GOOGLE_PICK)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return CITY_HALL;
    }
    if (typeof parsed?.lat === 'number' && typeof parsed?.lon === 'number' && parsed.label) {
      return parsed;
    }
  } catch {
    // Private window, cleared storage, or a shared phone somebody wiped.
  }
  return CITY_HALL;
}

export function saveOrigin(origin: AreaOption): void {
  // "Use my current location" is for this search only (D-536): the phone's position is never
  // written down, so the next visit starts from the last area chosen, or City Hall.
  // A street address picked from Google's suggestions is the same (D-552): it is often somebody's home, so it is used for this search only,
  // not written to this phone, not sent to Pam's server, and not put in a URL. The next visit starts from the last Pam area, or City Hall.
  if (origin.id === 'here' || origin.id.startsWith(GOOGLE_PICK)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(origin));
  } catch {
    // Not being able to remember it is a worse session, not a broken one.
  }
}
