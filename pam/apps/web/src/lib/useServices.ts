'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { DUMMY_SERVICES, servicesFor, type DummyService } from '@pam/config/dummy-services';
import { PROGRAM_SERVICE_COLUMNS, serviceColumns, serviceFromRow, type ProgramServiceRow } from './programServices';
import { isSavedPlace } from './savedTrips';

/**
 * A program's services (D-313), and a lead's changes to them.
 *
 * **A real program's services are in the database** (`program_services`,
 * D-462): a program that is a listing in the catalogue (its id is a uuid) has
 * its services read from there and its lead's edits written there, so the
 * Program tab, a member's view of the place and booking a trip all show the
 * same ones on any phone. An **example program** (a `dummy-place-…` id) keeps
 * its services in the tab, as it always did: a lead's edits are kept for the
 * browser session over the example set, so a demo agrees with itself.
 *
 * Policies are still the example set's for everybody (D-313's second step), so
 * a real service names none and every policy is the program's.
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

/*
 * The real programs' services, read on demand: the first time a screen asks
 * for a real program's (`forPlace(uuid)`), they are fetched once and kept for
 * the page, and read again after this page saves or removes one.
 */
const NONE: readonly DummyService[] = [];
let real: Readonly<Record<string, readonly DummyService[]>> = {};
const asked = new Set<string>();
const loading = new Set<string>();
const listeners = new Set<() => void>();

function publish(next: Readonly<Record<string, readonly DummyService[]>>): void {
  real = next;
  listeners.forEach((listener) => listener());
}

async function loadProgram(programId: string): Promise<void> {
  if (loading.has(programId)) return;
  loading.add(programId);
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient()
      .from('program_services')
      .select(PROGRAM_SERVICE_COLUMNS)
      .eq('service_id', programId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    publish({ ...real, [programId]: ((data ?? []) as ProgramServiceRow[]).map(serviceFromRow) });
  } catch {
    // Show none rather than a wrong list; a program with no services reads as it always has.
    if (!(programId in real)) publish({ ...real, [programId]: NONE });
  } finally {
    loading.delete(programId);
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useServices(): {
  readonly services: readonly DummyService[];
  readonly forPlace: (placeId: string) => readonly DummyService[];
  /** Resolves false when a real program's service could not be saved. */
  readonly save: (service: DummyService) => Promise<boolean>;
  /** Resolves false when a real program's service could not be removed. */
  readonly remove: (id: string) => Promise<boolean>;
} {
  const [local, setLocal] = useState<readonly DummyService[]>(DUMMY_SERVICES);
  const realNow = useSyncExternalStore(
    subscribe,
    () => real,
    () => real,
  );

  useEffect(() => {
    const sync = () => setLocal(current(read()));
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  // Every real program a screen has asked about is read once.
  useEffect(() => {
    for (const programId of asked) if (!(programId in real)) void loadProgram(programId);
  });

  const services = useMemo(() => [...local, ...Object.values(realNow).flat()], [local, realNow]);

  const save = useCallback(async (service: DummyService): Promise<boolean> => {
    if (!isSavedPlace(service.placeId)) {
      const kept = read();
      write({ changed: { ...kept.changed, [service.id]: service }, removed: kept.removed.filter((id) => id !== service.id) });
      return true;
    }
    try {
      const { createClient } = await import('./supabase');
      const supabase = createClient();
      const columns = serviceColumns(service);
      const { error } = isSavedPlace(service.id)
        ? await supabase.from('program_services').update({ ...columns, service_id: undefined }).eq('id', service.id)
        : await supabase.from('program_services').insert({ ...columns, sort_order: (real[service.placeId] ?? NONE).length });
      if (error) return false;
      loading.delete(service.placeId);
      await loadProgram(service.placeId);
      return true;
    } catch {
      return false;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const programId = Object.keys(real).find((key) => (real[key] ?? NONE).some((s) => s.id === id));
    if (programId === undefined) {
      const kept = read();
      const changed = { ...kept.changed };
      delete changed[id];
      write({ changed, removed: [...kept.removed, id] });
      return true;
    }
    try {
      const { createClient } = await import('./supabase');
      const { error } = await createClient().from('program_services').delete().eq('id', id);
      if (error) return false;
      await loadProgram(programId);
      return true;
    } catch {
      return false;
    }
  }, []);

  const forPlace = useCallback(
    (placeId: string): readonly DummyService[] => {
      if (!isSavedPlace(placeId)) return servicesFor(placeId, local);
      // A real program's: asked for once (the effect above reads it), answered
      // from what has been read.
      asked.add(placeId);
      return realNow[placeId] ?? NONE;
    },
    [local, realNow],
  );

  return { services, forPlace, save, remove };
}
