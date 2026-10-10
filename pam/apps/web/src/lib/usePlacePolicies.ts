'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { placeAsksForPolicies, type DummyPolicy } from '@pam/config/dummy-policies';
import { POLICY_COLUMNS, policiesFromRows, type PolicyRow } from './programPolicies';
import { isSavedPlace } from './savedTrips';
import { usePolicies } from './usePolicies';

/**
 * The policies a member is asked to sign at a place (D-270, D-485).
 *
 * A place in the catalogue (a uuid) asks for exactly what its program has put in
 * the database — the CURRENT policies of a live program, which any signed-in
 * person can read — and for nothing when the program has put none: a real place
 * never borrows the example program's rules. An example place keeps the example
 * set, as it always did, so Storybook shows a program with policies.
 *
 * Read on demand: the first time a screen asks about a real place its policies
 * are fetched once and kept for the page. `forPlace` answers at once from what
 * has been read.
 */
const NONE: readonly DummyPolicy[] = [];
let real: Readonly<Record<string, readonly DummyPolicy[]>> = {};
const asked = new Set<string>();
const listeners = new Set<() => void>();

function publish(next: Readonly<Record<string, readonly DummyPolicy[]>>): void {
  real = next;
  listeners.forEach((listener) => listener());
}

async function load(placeId: string): Promise<void> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient()
      .from('program_policies')
      .select(POLICY_COLUMNS)
      .eq('service_id', placeId)
      .is('archived_at', null);
    if (error) throw error;
    publish({ ...real, [placeId]: policiesFromRows((data ?? []) as PolicyRow[]) });
  } catch {
    // None rather than a wrong list: a place we could not read asks for nothing.
    publish({ ...real, [placeId]: NONE });
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Forget what was read (after signing a new version, say). */
export function refreshPlacePolicies(placeId: string): void {
  asked.delete(placeId);
  void load(placeId);
}

export interface PlacePolicies {
  /** Whether this place asks its members to sign anything. */
  readonly asks: boolean;
  readonly policies: readonly DummyPolicy[];
  /** A real place's policies are still being read. */
  readonly isLoading: boolean;
}

export function usePlacePolicies(): { readonly forPlace: (placeId: string) => PlacePolicies } {
  const { policies: example } = usePolicies();
  const realNow = useSyncExternalStore(
    subscribe,
    () => real,
    () => real,
  );
  const forPlace = useCallback(
    (placeId: string): PlacePolicies => {
      if (placeId === '') return { asks: false, policies: NONE, isLoading: false };
      if (!isSavedPlace(placeId)) return { asks: placeAsksForPolicies(placeId), policies: example, isLoading: false };
      if (!asked.has(placeId)) {
        asked.add(placeId);
        void load(placeId);
      }
      const mine = realNow[placeId];
      return { asks: (mine?.length ?? 0) > 0, policies: mine ?? NONE, isLoading: mine === undefined };
    },
    [example, realNow],
  );
  return { forPlace };
}
