import { addTrip, moveTrip, setSavedTrips, readAddedTrips, type AddedTrip } from './addedTrips';
import type { SessionState } from './useSession';

/**
 * A member's trips, saved for real (D-454): the part that talks to the
 * database. `book_trip`, `move_trip` and `my_trips()` are migration
 * 20261010074045; the day-before reminder is queued by the database when a
 * trip is saved, and only for somebody who turned reminders on — nothing here
 * decides that.
 *
 * What is saved and what stays on the device:
 * - a trip to a **real place** (an id from the catalogue), by a signed-in
 *   member who is not a demo account: saved;
 * - a trip to an **example place** (`dummy-place-…`), a program booking for a
 *   member (D-316), and anything on a demo account: kept in this tab as before.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A place from the catalogue, not one of the examples. */
export const isSavedPlace = (placeId: string): boolean => UUID.test(placeId);

/** A signed-in member who is not a demo account: the only one whose trips are saved. Their id, or null. */
export function asksForSavedTrips(session: SessionState): string | null {
  if (session.status !== 'signed-in') return null;
  if (session.session.role !== 'member' || session.session.isDemo) return null;
  return session.session.userId;
}

/** A row of `my_trips()`. */
export interface TripRow {
  readonly id: string;
  readonly service_id: string | null;
  readonly place_name: string | null;
  readonly category: string | null;
  readonly address: string | null;
  readonly lat: number | null;
  readonly lon: number | null;
  readonly starts_at: string;
  readonly note: string | null;
  readonly status: string;
}

/** A row of `my_trip_services()` (D-470): which program service a saved trip is for. */
export interface TripServiceRow {
  readonly appointment_id: string;
  readonly program_service_id: string;
  readonly service_name: string;
}

/** A saved trip, in the shape every trips screen already reads. Only scheduled ones. */
export function tripsFromRows(rows: readonly TripRow[], services: readonly TripServiceRow[] = []): AddedTrip[] {
  const serviceOf = new Map(services.map((s) => [s.appointment_id, s]));
  return rows
    .filter((row) => row.status === 'scheduled' && row.service_id !== null)
    .map((row) => ({
      id: row.id,
      placeId: row.service_id as string,
      placeName: row.place_name ?? '',
      category: row.category ?? 'family_services',
      lat: row.lat ?? 0,
      lon: row.lon ?? 0,
      startsAt: row.starts_at,
      note: row.note ?? '',
      ...(serviceOf.has(row.id)
        ? { serviceId: serviceOf.get(row.id)!.program_service_id, serviceName: serviceOf.get(row.id)!.service_name }
        : {}),
    }));
}

/** Read the member's saved trips and hand them to every screen that lists trips. */
export async function loadSavedTrips(): Promise<void> {
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const { data, error } = await supabase.rpc('my_trips');
    if (error) throw error;
    // Which service each is for (D-470): a failed read leaves the trips without it, not hidden.
    const named = await supabase.rpc('my_trip_services');
    const services = named.error ? [] : ((named.data ?? []) as TripServiceRow[]);
    setSavedTrips(tripsFromRows((data ?? []) as TripRow[], services));
  } catch {
    // Keep what is shown; the screens do not need to know the read failed.
    setSavedTrips(readSaved(), 'error');
  }
}

function readSaved(): AddedTrip[] {
  return readAddedTrips().filter((trip) => isSavedPlace(trip.id));
}

/** The member's time zone, so "10:00 AM" in the reminder is the time where they are. */
function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

export type NewTrip = Omit<AddedTrip, 'id'>;

/**
 * Plan a trip: saved when it can be, kept in this tab when not. Resolves the
 * trip with its id, or null when it could not be saved (nothing is shown as
 * booked then).
 */
export async function bookTrip(session: SessionState, trip: NewTrip): Promise<AddedTrip | null> {
  const userId = asksForSavedTrips(session);
  if (userId !== null && isSavedPlace(trip.placeId) && !trip.forMemberId) {
    try {
      const { createClient } = await import('./supabase');
      const note = trip.note.trim() === '' ? null : trip.note;
      // A service of a real program (a uuid) is named to the database (D-470); an example one stays on the phone.
      const { data, error } =
        trip.serviceId !== undefined && isSavedPlace(trip.serviceId)
          ? await createClient().rpc('book_trip_at_service', {
              p_service_id: trip.placeId,
              p_starts_at: trip.startsAt,
              p_program_service_id: trip.serviceId,
              p_note: note,
              p_timezone: localTimeZone(),
            })
          : await createClient().rpc('book_trip', {
              p_service_id: trip.placeId,
              p_starts_at: trip.startsAt,
              p_note: note,
              p_timezone: localTimeZone(),
            });
      if (error || !data) return null;
      const row = data as { id: string; starts_at: string };
      await loadSavedTrips();
      // As the database holds it — with the place's real coordinates — when it has been read back.
      return readAddedTrips().find((saved) => saved.id === row.id) ?? { ...trip, id: row.id, startsAt: row.starts_at };
    } catch {
      return null;
    }
  }
  const local = { ...trip, id: `added-${Date.now()}` };
  addTrip(local);
  return local;
}

/** Move a trip: in the database when it is a saved one, in this tab when not. Resolves false when it could not be moved. */
export async function moveSavedOrLocalTrip(id: string, startsAt: string): Promise<boolean> {
  if (!isSavedPlace(id)) {
    moveTrip(id, startsAt);
    return true;
  }
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('move_trip', { p_id: id, p_starts_at: startsAt });
    if (error) return false;
    await loadSavedTrips();
    return true;
  } catch {
    return false;
  }
}
