'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MIN_CHARS, PAUSE_MS, askChoose, askSuggest, newToken, wantsGoogle, type Suggestion } from './streetSearch';
import { GOOGLE_PICK, type AreaOption } from './useAreaSearch';

/**
 * Street addresses and corners in the area search, from Google through Pam's `places-search` function (D-552). The phone never calls
 * Google. Off until the function says it has a key; then the area search is exactly what it was.
 */
let off = false;

async function invoke(name: string, options: { body: Record<string, unknown> }) {
  const { createClient } = await import('./supabase');
  return createClient().functions.invoke(name, options);
}

export function useStreetSearch(
  query: string,
  pam: { readonly matches: number; readonly settled: boolean },
): {
  suggestions: Suggestion[];
  isSearching: boolean;
  choose: (suggestion: Suggestion) => Promise<AreaOption | null>;
} {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const token = useRef(newToken());
  const latest = useRef(0);

  useEffect(() => {
    const text = query.trim();
    // A new search starts when the box is emptied: Google bills a session from its first letter to the pick.
    if (text === '') token.current = newToken();
    if (off || !pam.settled || !wantsGoogle(text, pam.matches)) {
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
    }, PAUSE_MS);
    return () => clearTimeout(timer);
  }, [query, pam.matches, pam.settled]);

  const choose = useCallback(async (suggestion: Suggestion): Promise<AreaOption | null> => {
    try {
      const place = await askChoose(invoke, suggestion.placeId, token.current);
      // The pick ends Google's session; the next search is a new one.
      token.current = newToken();
      if (!place) return null;
      return { id: `${GOOGLE_PICK}${suggestion.placeId}`, kind: 'address', label: place.label || suggestion.label, lat: place.lat, lon: place.lon };
    } catch {
      return null;
    }
  }, []);

  return { suggestions, isSearching, choose };
}

export { MIN_CHARS };
