'use client';

import { useCallback, useEffect, useState } from 'react';
import { DUMMY_SERVICES, servicesFor, type DummyService } from '@pam/config/dummy-services';

/**
 * A program's services (D-313), and a lead's changes to them.
 *
 * **Example data only, for now**, like the policies (`usePolicies`): there
 * is no table for services yet. A lead's edits — a service added, changed
 * or removed — are kept for the browser session over the example set, so
 * the Program tab, a member's view of the place and booking a trip all
 * agree for the length of a demo.
 */
const KEY = 'pam.services';
const EVENT = 'pam:services';

interface Kept {
  /** Added or edited, by id — an edit of an example one shadows it. */
  readonly changed: Readonly<Record<string, DummyService>>;
  readonly removed: readonly string[];
}

function read(): Kept {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Kept;
  } catch {
    // Storage off: the example set as it is.
  }
  return { changed: {}, removed: [] };
}

function write(kept: Kept): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(kept));
  } catch {
    // Not persisting is survivable in a demo.
  }
  window.dispatchEvent(new Event(EVENT));
}

function current(kept: Kept): readonly DummyService[] {
  const base = DUMMY_SERVICES.map((s) => kept.changed[s.id] ?? s);
  const known = new Set(DUMMY_SERVICES.map((s) => s.id));
  const added = Object.values(kept.changed).filter((s) => !known.has(s.id));
  return [...base, ...added].filter((s) => !kept.removed.includes(s.id));
}

export function useServices(): {
  readonly services: readonly DummyService[];
  readonly forPlace: (placeId: string) => readonly DummyService[];
  readonly save: (service: DummyService) => void;
  readonly remove: (id: string) => void;
} {
  const [services, setServices] = useState<readonly DummyService[]>(DUMMY_SERVICES);

  useEffect(() => {
    const sync = () => setServices(current(read()));
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const save = useCallback((service: DummyService) => {
    const kept = read();
    write({ changed: { ...kept.changed, [service.id]: service }, removed: kept.removed.filter((id) => id !== service.id) });
  }, []);

  const remove = useCallback((id: string) => {
    const kept = read();
    const changed = { ...kept.changed };
    delete changed[id];
    write({ changed, removed: [...kept.removed, id] });
  }, []);

  const forPlace = useCallback((placeId: string) => servicesFor(placeId, services), [services]);

  return { services, forPlace, save, remove };
}
