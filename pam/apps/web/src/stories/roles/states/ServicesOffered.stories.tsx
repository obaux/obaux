import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { SAVED_PLACE } from '../../journeys/mockSupabase';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * The services a program offers, kept for real (D-313, D-462). A program that is
 * a listing in the catalogue has its services in the database: the lead adds,
 * edits and removes them from the Program tab, and a member sees them as cards on
 * the program's page, on any phone. An example program keeps its services in the
 * tab, as it always did. Policies per service are the next step, so the editor
 * does not offer the example policies for a real program.
 *
 * - **A lead adds a service** — the editor on a program that is on file.
 * - **A member reads them** — a place's page, with its services as cards.
 */
const meta = { title: 'Program lead/States/Program — services' } satisfies Meta;

export default meta;
type Story = StoryObj;

function onRoute(
  name: string,
  role: 'provider' | 'member',
  pathname: string,
  query: Record<string, string>,
  options: Parameters<typeof asRole>[3],
): Story {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  return { ...asRole(role, pathname, query, options), name, render: () => <>{route.render()}</> };
}

export const AddAService: Story = onRoute('A lead adds a service', 'provider', '/program/service/', {}, { ownProgram: 'live' });
export const TheProgramTab: Story = onRoute('The Program tab lists them', 'provider', '/program/', {}, { ownProgram: 'live' });
export const AMemberReadsThem: Story = onRoute(
  'A member reads a program\'s services',
  'member',
  '/place/',
  { id: SAVED_PLACE.id },
  { placeServices: true },
);
export const AMemberReadsThemSpanish: Story = { ...AMemberReadsThem, name: 'A member reads them — Spanish', globals: { locale: 'es' } };
