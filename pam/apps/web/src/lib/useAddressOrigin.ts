'use client';

import { useEffect, useRef, useState } from 'react';
import { searchPlacesChecked } from './usePlaces';
import { looksLikeAddress, type ProgramsAnswer } from './streetSearch';
import { useStreetSearch } from './useStreetSearch';
import type { AreaOption } from './useAreaSearch';

/**
 * The main search on Explore, for a typed ADDRESS (D-573, Will 14 October 2026): "only show what we have in database, mapped to Google".
 *
 * When the words read as an address or a corner and no program matches them, Pam's server (`places-search`) turns them into a point:
 * autocomplete, then the details of the first suggestion, the same two calls and the same host as the area drawer. The list is then Pam's
 * own programs nearest that point, closest first. Nothing from Google is shown but its mark. The point lives in this hook's memory only:
 * never in localStorage, the profile, a URL, or any request to Pam's server (the list is asked for with it as a POST body, like "near you").
 *
 * Program words never go to Google: `wantsGoogleFromBox` needs the programs search (every category, not the chip's) to have answered
 * successfully with nothing. A slow or failed programs search sends nothing.
 */
export interface AddressOrigin {
  /** The point to measure from, or null (not an address, or a program matched, or Google is off or could not say). */
  readonly origin: AreaOption | null;
  /** The words are an address no program matches and Google is being asked: the list should wait, not say "nothing". */
  readonly resolving: boolean;
}

export function useAddressOrigin(text: string, near: { readonly lat: number; readonly lon: number }): AddressOrigin {
  const [programs, setPrograms] = useState<ProgramsAnswer & { readonly text: string }>({ text: '', matches: 0, settled: false, ok: true });
  const latest = useRef(0);
  // Whether any program, of any kind, matches these words: the check that keeps program words away from Google.
  useEffect(() => {
    if (!looksLikeAddress(text)) {
      latest.current += 1;
      setPrograms({ text, matches: 0, settled: false, ok: true });
      return;
    }
    const mine = (latest.current += 1);
    void searchPlacesChecked(text, { lat: near.lat, lon: near.lon, limit: 1 }).then((answer) => {
      if (mine === latest.current) setPrograms({ text, matches: answer.places.length, settled: true, ok: answer.ok });
    });
  }, [text, near.lat, near.lon]);

  const answered = programs.text === text && programs.settled;
  const street = useStreetSearch(text, { box: true, programs: { matches: programs.matches, settled: answered, ok: programs.ok } }, looksLikeAddress(text));

  const [origin, setOrigin] = useState<{ readonly text: string; readonly option: AreaOption } | null>(null);
  const [choosing, setChoosing] = useState(false);
  const first = street.suggestions[0];
  useEffect(() => {
    if (!first || (origin && origin.text === text)) return;
    let cancelled = false;
    setChoosing(true);
    void street.choose(first).then((option) => {
      if (cancelled) return;
      setChoosing(false);
      if (option) setOrigin({ text, option });
    });
    return () => {
      cancelled = true;
      setChoosing(false);
    };
    // `street.choose` is stable; the first suggestion for these words is what is chosen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first?.placeId, text]);

  const current = origin && origin.text === text ? origin.option : null;
  const resolving =
    current === null && answered && programs.ok && programs.matches === 0 && street.enabled && (street.isSearching || choosing || street.suggestions.length > 0);
  return { origin: current, resolving };
}
