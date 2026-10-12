'use client';

/**
 * "I'm here" and "I went" (D-535): a member marks their own visit.
 *
 * "I'm here" asks the phone where it is ONCE, when the person taps, and hands the
 * position straight to the database, which compares it with the place and keeps
 * only that they were there. The position is never held in a variable that outlives
 * the call, never in storage and never logged. "I went" sends no position at all.
 */
export const HERE_METERS = 150;

/** From two hours before the visit to four hours after it starts (the database checks the real end). */
export function inMarkWindow(startsAt: string, now: number = Date.now()): boolean {
  const start = new Date(startsAt).getTime();
  return now >= start - 2 * 3_600_000 && now <= start + 4 * 3_600_000;
}

export type HereResult =
  | { readonly kind: 'there'; readonly points: number }
  | { readonly kind: 'not-yet' }
  /** No position to compare: said no, no signal, or the place has no stored location. */
  | { readonly kind: 'no-location' }
  | { readonly kind: 'too-late' }
  | { readonly kind: 'error' };

export type WentResult =
  | { readonly kind: 'went'; readonly points: number }
  | { readonly kind: 'limit' }
  | { readonly kind: 'too-late' }
  | { readonly kind: 'error' };

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
    const { data, error } = await createClient().rpc('i_am_here', {
      p_appointment_id: visitId,
      p_lat: position.lat,
      p_lon: position.lon,
    });
    if (error) {
      const why = refusalOf(error.message);
      return why === 'too-late' || why === 'no-location' ? { kind: why } : { kind: 'error' };
    }
    const row = (Array.isArray(data) ? data[0] : data) as { there?: boolean; points?: number } | undefined;
    return row?.there ? { kind: 'there', points: row.points ?? 0 } : { kind: 'not-yet' };
  } catch {
    return { kind: 'error' };
  }
}

export async function markWent(visitId: string): Promise<WentResult> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('i_went', { p_appointment_id: visitId });
    if (error) {
      const why = refusalOf(error.message);
      return why === 'too-late' || why === 'limit' ? { kind: why } : { kind: 'error' };
    }
    const row = (Array.isArray(data) ? data[0] : data) as { points?: number } | undefined;
    return { kind: 'went', points: row?.points ?? 0 };
  } catch {
    return { kind: 'error' };
  }
}
