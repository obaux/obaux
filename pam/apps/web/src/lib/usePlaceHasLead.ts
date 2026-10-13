'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { DUMMY_PROGRAM_LEADS } from '@pam/config/dummy-people';
import { isSavedPlace } from './savedTrips';

/**
 * Whether a place has a program lead on Pam (D-498).
 *
 * Places get into Pam two ways: gathered from public lists, and added by a
 * program lead. Only the second has anybody on Pam to be told about a visit —
 * and nothing tells even them today — so a member planning a visit at the first
 * kind is told the plan is only for them (Will, 10 October 2026).
 *
 * A place in the catalogue (a uuid) is asked of the database once and kept for
 * the page (`service_has_lead`: its organisation has an active provider
 * account). **Until it has answered, and if it cannot, the answer is "no
 * lead"**: the plain wording says less than it could, never more than is true.
 * An example place has a lead when the example people name it, as the place
 * page's "Message the lead" already did.
 */
let known: Readonly<Record<string, boolean>> = {};
const asked = new Set<string>();
const listeners = new Set<() => void>();

function publish(next: Readonly<Record<string, boolean>>): void {
  known = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function load(placeId: string): Promise<void> {
  if (asked.has(placeId)) return;
  asked.add(placeId);
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('service_has_lead', { p_service_id: placeId });
    if (error) throw error;
    publish({ ...known, [placeId]: data === true });
  } catch {
    // Asked again the next time a screen opens it; until then, no lead.
    asked.delete(placeId);
  }
}

/** Whether the example people include a program lead for this place. */
export function exampleHasLead(placeName: string): boolean {
  return DUMMY_PROGRAM_LEADS.some((person) => person.orgName === placeName);
}

/**
 * `true` / `false` once known, `null` while a catalogue place is still being asked about, so a button
 * that depends on it can wait instead of showing and then going (D-541).
 */
export function usePlaceLead(placeId: string | null | undefined, placeName: string | null | undefined): boolean | null {
  const real = useSyncExternalStore(
    subscribe,
    () => known,
    () => known,
  );
  const isReal = placeId != null && isSavedPlace(placeId);
  useEffect(() => {
    if (isReal && placeId) void load(placeId);
  }, [isReal, placeId]);
  if (placeId == null) return false;
  if (!isReal) return placeName != null && exampleHasLead(placeName);
  return placeId in real ? real[placeId] === true : null;
}

export function usePlaceHasLead(placeId: string | null | undefined, placeName: string | null | undefined): boolean {
  return usePlaceLead(placeId, placeName) === true;
}
