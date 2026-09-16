import type { Category, Role } from './index.js';

/**
 * The places a demo account has saved.
 *
 * Split out from the people data (`dummy-people.ts`): `useSavedPlaces` needs
 * only this, and it is imported from Home, Places, the place screen and Saved
 * — Home is what §12's bundle budget measures, so this file stays as small as
 * the thing it actually has to answer, the same reasoning behind
 * `dummy-notifications.ts` sitting apart from it too.
 *
 * Saved places belong to one account, never to a role someone is only
 * previewing (Will, 16 September: "if I saved a place as a case manager, when
 * I go to member view, that place should not be saved"). A super admin's real
 * `saved_places` rows are their own real account's, and stay theirs no matter
 * which role's screen they are looking at — showing them while "Viewing as
 * Member" would be the opposite of what the preview is for. So while a
 * preview is active, Save is demo-only and local: it reads and writes one of
 * the lists below, keyed by the previewed role, and never touches the real
 * database. See `useSavedPlaces`'s `demoRole` parameter.
 */
export interface DummySavedPlace {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly address: string;
  readonly phone: string | null;
  readonly lat: number;
  readonly lon: number;
  readonly description: string;
}

const EXAMPLE_LEARNING_CENTER: DummySavedPlace = {
  id: 'dummy-place-learning',
  name: 'Example Learning Center',
  category: 'education',
  address: '123 Main St, Philadelphia, PA 19104',
  phone: '+12155550100',
  lat: 39.9526,
  lon: -75.1652,
  description: 'Free classes, a computer room and help getting a GED. Walk in and ask at the front desk.',
};

const EXAMPLE_FOOD_PANTRY: DummySavedPlace = {
  id: 'dummy-place-food',
  name: 'Example Food Pantry',
  category: 'family_services',
  address: '789 Broad St, Philadelphia, PA 19147',
  phone: '+12155550111',
  lat: 39.9612,
  lon: -75.1583,
  description: 'Groceries to take home, no appointment. Bring a bag if you have one.',
};

const EXAMPLE_WORKFORCE_CENTER: DummySavedPlace = {
  id: 'dummy-place-workforce',
  name: 'Example Workforce Center',
  category: 'workforce',
  address: '456 Market St, Philadelphia, PA 19106',
  phone: null,
  lat: 39.9515,
  lon: -75.1605,
  description: 'Job training, help with a resume and openings posted every week.',
};

/** What a member previewing "Member" sees on Saved and the Home strip. */
export const DUMMY_SAVED_BY_ROLE: Partial<Record<Role, readonly DummySavedPlace[]>> = {
  member: [EXAMPLE_LEARNING_CENTER, EXAMPLE_FOOD_PANTRY],
};

/**
 * What a specific dummy *person* saved — for their profile, where a case
 * manager or a program looks at one member rather than at their own account.
 * Keyed by a `DummyPerson.id` from `dummy-people.ts` (kept as a plain string
 * here, not an import, so this file does not pull that one in).
 */
export const DUMMY_SAVED_BY_PERSON: Readonly<Record<string, readonly DummySavedPlace[]>> = {
  'dummy-m1': [EXAMPLE_LEARNING_CENTER, EXAMPLE_FOOD_PANTRY],
  'dummy-m2': [EXAMPLE_WORKFORCE_CENTER],
  'dummy-m4': [EXAMPLE_LEARNING_CENTER],
};

/**
 * Every example place, by its own id — for `/place/?id=…` when the id is one
 * of these (`dummy-place-…`) rather than a real row in `services`.
 *
 * Before this, tapping "Example Food Pantry" from a member's saved-places
 * card on `/person/` sent a real `service_detail` lookup for an id that does
 * not exist in the database — Supabase answered "not found", and the screen
 * showed an error rather than the place it was already looking at the words
 * for. A dummy id never reaches the network now; see `isDummyPlaceId`.
 */
export const DUMMY_PLACES_BY_ID: Readonly<Record<string, DummySavedPlace>> = Object.fromEntries(
  [EXAMPLE_LEARNING_CENTER, EXAMPLE_FOOD_PANTRY, EXAMPLE_WORKFORCE_CENTER].map((place) => [
    place.id,
    place,
  ]),
);

export function isDummyPlaceId(id: string): boolean {
  return id.startsWith('dummy-place-');
}
