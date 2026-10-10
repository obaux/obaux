import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { SAVED_PLACE } from '../../journeys/mockSupabase';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * A member's trips, saved for real (D-454). A trip to a place in the catalogue
 * is written to the database (`book_trip`) and read back (`my_trips`), so it is
 * on any phone and its reminder can be sent; a trip to an example place stays in
 * the tab, as it always did. The pretend database answers both, so each can be
 * walked through here.
 *
 * - **Plan to a real place** — Plan a visit from the place's page: pick a day
 *   and time, Check, Add this trip. It lands on Trips.
 * - **One trip already saved** — Trips as a member sees it on a new phone.
 * - **Move a saved trip** — "Change appointment" on that trip: a new day and
 *   time, saved in the database, and its reminder follows.
 */
const meta = { title: 'Member/Created/States/Saved trips' } satisfies Meta;

export default meta;
type Story = StoryObj;

function onRoute(
  name: string,
  pathname: string,
  query: Record<string, string>,
  options: { readonly savedTrip?: boolean } = {},
): Story {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  return { ...asRole('member', pathname, query, options), name, render: () => <>{route.render()}</> };
}

export const PlanToARealPlace: Story = onRoute('Plan a visit to a place in the catalogue', '/trips/new/', {
  place: SAVED_PLACE.id,
  name: SAVED_PLACE.name,
  category: SAVED_PLACE.category,
  address: SAVED_PLACE.address,
});
export const OneTripSaved: Story = onRoute('One trip already saved', '/trips/', {}, { savedTrip: true });
export const MoveASavedTrip: Story = onRoute(
  'Change the time of a saved trip',
  '/trips/new/',
  {
    place: SAVED_PLACE.id,
    name: SAVED_PLACE.name,
    category: SAVED_PLACE.category,
    address: SAVED_PLACE.address,
    change: '7a1f0f3c-2b11-4c0f-8b64-000000000001',
  },
  { savedTrip: true },
);
export const OneTripSavedSpanish: Story = { ...OneTripSaved, name: 'One trip already saved — Spanish', globals: { locale: 'es' } };
