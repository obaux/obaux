'use client';

import { settleWithin } from './settle';

/**
 * "I'm here" and "I went" (D-535): a member marks their own visit.
 *
 * "I'm here" asks the phone where it is ONCE, when the person taps, and hands the
 * position straight to the database, which compares it with the place and keeps
 * only that they were there. The position is never held in a variable that outlives
 * the call, never in storage and never logged. "I went" sends no position at all.
 */
export const HERE_METERS = 150;

/**
 * From two hours before the visit starts to three hours after it ends, as the database has it (`i_am_here` and `i_went`, migration
 * 20261011145930). The trip a member reads carries no end, so the visit is taken to last an hour, which is what the database does for one
 * with no end; `minutes` is for a visit whose length is known.
 */
export function inMarkWindow(startsAt: string, now: number = Date.now(), minutes: number = 60): boolean {
  const start = new Date(startsAt).getTime();
  const end = start + (minutes > 0 ? minutes : 60) * 60_000;
  return now >= start - 2 * 3_600_000 && now <= end + 3 * 3_600_000;
}

export type HereResult =
  | { readonly kind: 'there'; readonly points: number }
  | { readonly kind: 'not-yet' }
  /** No position to compare: said no, no signal, or the place has no stored location. */
  | { readonly kind: 'no-location' }
  | { readonly kind: 'too-late' }
  /** The save did not go through, or had no answer in 15 seconds (`late` settles when it finally does: read the visit again then). */
  | { readonly kind: 'error'; readonly error: unknown; readonly late?: Promise<void> };

export type WentResult =
  | { readonly kind: 'went'; readonly points: number }
  | { readonly kind: 'limit' }
  | { readonly kind: 'too-late' }
  | { readonly kind: 'error'; readonly error: unknown; readonly late?: Promise<void> };

/** The database's refusals, as the screen tells them. */
export function refusalOf(message: string | undefined): 'too-late' | 'limit' | 'no-location' | 'error' {
  if (!message) return 'error';
  if (message.includes('PLANNED_TOO_LATE')) return 'too-late';
  if (message.includes('SELF_REPORT_LIMIT')) return 'limit';
  if (message.includes('NO_PLACE_LOCATION')) return 'no-location';
  return 'error';
}

type Position = { readonly lat: number; readonly lon: number };

/** One ask of the phone's location, now. Null when it is not given. */
function askPosition(): Promise<Position | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  });
}

export async function markHere(visitId: string): Promise<HereResult> {
  const position = await askPosition();
  if (!position) return { kind: 'no-location' };
  try {
    const { createClient } = await import('./supabase');
    const settled = await settleWithin(
      Promise.resolve(createClient().rpc('i_am_here', { p_appointment_id: visitId, p_lat: position.lat, p_lon: position.lon })),
    );
    if (settled.status === 'timeout') return { kind: 'error', error: settled.error, late: settled.late };
    if (settled.status === 'failed') return { kind: 'error', error: settled.error };
    const { data, error } = settled.value;
    if (error) {
      const why = refusalOf(error.message);
      return why === 'too-late' || why === 'no-location' ? { kind: why } : { kind: 'error', error };
    }
    const row = (Array.isArray(data) ? data[0] : data) as { there?: boolean; points?: number } | undefined;
    return row?.there ? { kind: 'there', points: row.points ?? 0 } : { kind: 'not-yet' };
  } catch (error) {
    return { kind: 'error', error };
  }
}

export async function markWent(visitId: string): Promise<WentResult> {
  try {
    const { createClient } = await import('./supabase');
    const settled = await settleWithin(Promise.resolve(createClient().rpc('i_went', { p_appointment_id: visitId })));
    if (settled.status === 'timeout') return { kind: 'error', error: settled.error, late: settled.late };
    if (settled.status === 'failed') return { kind: 'error', error: settled.error };
    const { data, error } = settled.value;
    if (error) {
      const why = refusalOf(error.message);
      return why === 'too-late' || why === 'limit' ? { kind: why } : { kind: 'error', error };
    }
    const row = (Array.isArray(data) ? data[0] : data) as { points?: number } | undefined;
    return { kind: 'went', points: row?.points ?? 0 };
  } catch (error) {
    return { kind: 'error', error };
  }
}
