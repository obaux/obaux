'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MIN_CHARS,
  PAUSE_MS,
  askChoose,
  askStatus,
  askSuggest,
  newToken,
  wantsGoogle,
  wantsGoogleFromBox,
  zipOf,
  type ProgramsAnswer,
  type Suggestion,
} from './streetSearch';
import { GOOGLE_PICK, type AreaOption } from './useAreaSearch';

/**
 * Street addresses and corners in the area search, from Google through Pam's `places-search` function (D-552). The phone never calls
 * Google. Off until the function says it has a key; then the area search is exactly what it was.
 */
let off = false;
/** What the function said about having a key, once this session (null: not asked, or could not be told). */
let known: boolean | null = null;
let asking: Promise<void> | null = null;

async function invoke(name: string, options: { body: Record<string, unknown> }) {
  const { createClient } = await import('./supabase');
  return createClient().functions.invoke(name, options);
}

/** What the hook is told about the other searches: the drawer knows Pam's areas; the one search box also knows the programs (D-573). */
export type StreetContext =
  | { readonly matches: number; readonly settled: boolean }
  | { readonly box: true; readonly programs: ProgramsAnswer };

export function useStreetSearch(
  query: string,
  pam: StreetContext,
  isOpen = true,
): {
  /** The function has a key: the field's label and hint can say an address works. False until it says so. */
  enabled: boolean;
  suggestions: Suggestion[];
  isSearching: boolean;
  choose: (suggestion: Suggestion) => Promise<AreaOption | null>;
  /** The person tapped "Search addresses" for these very words (the one search box only): Google is asked, once, for exactly them. */
  searchAddresses: () => void;
  /** They have tapped it for the words now in the box. */
  askedByTap: boolean;
} {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [enabled, setEnabled] = useState(known === true);
  const token = useRef(newToken());
  const latest = useRef(0);
  // The words the person asked Google about by tapping; a different text is no longer asked for (D-573).
  const [tapped, setTapped] = useState<string | null>(null);
  const box = 'box' in pam ? pam.programs : null;
  const area = 'box' in pam ? null : pam;
  const isBox = box !== null;

  // Asked once when the area sheet opens, and not again this session: no Google call is made to find out.
  useEffect(() => {
    if (!isOpen || off) return;
    if (known !== null) {
      setEnabled(known);
      return;
    }
    asking ??= (async () => {
      try {
        const answer = await askStatus(invoke);
        if (answer !== null) known = answer;
        if (answer === false) off = true;
      } catch {
        // Could not be told: the old wording stays, and the next opening asks again.
      } finally {
        asking = null;
      }
    })();
    let cancelled = false;
    void asking.then(() => {
      if (!cancelled) setEnabled(known === true);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    const text = query.trim();
    // A new search starts when the box is emptied: Google bills a session from its first letter to the pick.
    if (text === '') token.current = newToken();
    // Nothing about what was typed is sent to the function until it has said there is a key (status), so with the status unreadable or off
    // the area search is exactly Pam's own.
    const byTap = isBox && tapped !== null && tapped === text && text.length >= MIN_CHARS;
    const wants = box ? byTap || wantsGoogleFromBox(text, box) : Boolean(area?.settled) && wantsGoogle(text, area?.matches ?? 0);
    if (off || !enabled || !wants) {
      latest.current += 1;
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    const mine = (latest.current += 1);
    const timer = setTimeout(() => {
      setIsSearching(true);
      void (async () => {
        try {
          const answer = await askSuggest(invoke, text, token.current);
          if (mine !== latest.current) return;
          if (answer.kind === 'off') off = true;
          setSuggestions(answer.kind === 'ok' ? answer.value : []);
        } catch {
          if (mine === latest.current) setSuggestions([]);
        } finally {
          if (mine === latest.current) setIsSearching(false);
        }
      })();
    }, byTap ? 0 : PAUSE_MS);
    return () => clearTimeout(timer);
  }, [query, isBox, box?.matches, box?.settled, box?.ok, area?.matches, area?.settled, enabled, tapped]);

  const choose = useCallback(async (suggestion: Suggestion): Promise<AreaOption | null> => {
    try {
      const place = await askChoose(invoke, suggestion.placeId, token.current);
      // The pick ends Google's session; the next search is a new one.
      token.current = newToken();
      if (!place) return null;
      return { id: `${GOOGLE_PICK}${suggestion.placeId}`, kind: 'address', // Only its ZIP on the chip (Will, 13 October); the picked point still orders the places.
      label: zipOf(place.label || suggestion.label), lat: place.lat, lon: place.lon };
    } catch {
      return null;
    }
  }, []);

  const searchAddresses = useCallback(() => setTapped(query.trim()), [query]);
  const askedByTap = tapped !== null && tapped === query.trim();

  return { enabled, suggestions, isSearching, choose, searchAddresses, askedByTap };
}

export { MIN_CHARS };
