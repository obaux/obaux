'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The people a case manager has starred (D-218, Will, 2 October: "case
 * managers can star people, like members can star places").
 *
 * **Example data only, for now.** There is no table for it yet: a case
 * manager's starred list is new information about members, and storing it
 * is a schema change (and a line in `transparency.ts`, since a member may
 * reasonably ask who has flagged them) for Will to approve. Until then this
 * keeps the list in the browser session, seeded with two example people, the
 * same way `savedPlacesDemo` keeps a previewed role's saved places.
 */
const KEY = 'pam.starred-people';
const EVENT = 'pam:starred-people';
const SEED = ['dummy-m1', 'dummy-m3'];

function read(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // Storage off: the seed below.
  }
  return SEED;
}

function write(ids: readonly string[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Not persisting is survivable in a demo.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useStarredPeople(): {
  readonly ids: ReadonlySet<string>;
  readonly toggle: (id: string) => void;
} {
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set(SEED));

  useEffect(() => {
    const sync = () => setIds(new Set(read()));
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const toggle = useCallback((id: string) => {
    const now = read();
    write(now.includes(id) ? now.filter((x) => x !== id) : [...now, id]);
  }, []);

  return { ids, toggle };
}
