'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MIN_CHARS, PAUSE_MS, askChoose, askStatus, askSuggest, newToken, wantsGoogle, zipOf, type Suggestion } from './streetSearch';
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

export function useStreetSearch(
  query: string,
  pam: { readonly matches: number; readonly settled: boolean },
  isOpen = true,
): {
  /** The function has a key: the field's label and hint can say an address works. False until it says so. */
  enabled: boolean;
  suggestions: Suggestion[];
  isSearching: boolean;
  choose: (suggestion: Suggestion) => Promise<AreaOption | null>;
} {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [enabled, setEnabled] = useState(known === true);
  const token = useRef(newToken());
  const latest = useRef(0);

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
    if (off || !enabled || !pam.settled || !wantsGoogle(text, pam.matches)) {
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
  }, [query, pam.matches, pam.settled, enabled]);

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

  return { enabled, suggestions, isSearching, choose };
}

export { MIN_CHARS };
