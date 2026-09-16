/**
 * The demo half of `useSavedPlaces` — read and write a per-role saved list
 * that never touches Supabase. Split into its own module and dynamically
 * imported, not because the logic is large, but because `useSavedPlaces.ts`
 * itself is a static import on Home, Places, the place screen and Saved, and
 * only a super admin actively previewing a role ever takes this path at all;
 * see that file's own comment, and `HeaderBell`'s identical trade on the
 * notifications side, for what shipping this statically cost before.
 */
import type { Role } from '@pam/config';
import { DUMMY_SAVED_BY_ROLE, type DummySavedPlace } from '@pam/config/dummy-places';
import type { SavedPlace } from './useSavedPlaces';

function fromDummy(place: DummySavedPlace): SavedPlace {
  return {
    id: place.id,
    name: place.name,
    lookupName: place.name,
    category: place.category,
    address: place.address,
    phone: place.phone,
    placeId: null,
    lat: place.lat,
    lon: place.lon,
    description: place.description,
    audience: null,
    hours: null,
  };
}

const demoKey = (role: Role) => `pam.dummy-saved.${role}`;

export function readDemoSaved(role: Role): SavedPlace[] {
  try {
    const raw = sessionStorage.getItem(demoKey(role));
    if (raw) return JSON.parse(raw) as SavedPlace[];
  } catch {
    // Private mode, or storage turned off — start from the seed below instead.
  }
  return (DUMMY_SAVED_BY_ROLE[role] ?? []).map(fromDummy);
}

export function writeDemoSaved(role: Role, places: readonly SavedPlace[]): void {
  try {
    sessionStorage.setItem(demoKey(role), JSON.stringify(places));
  } catch {
    // Not persisting is survivable in a demo; not switching would not be.
  }
}
