import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * A program lead who runs more than one program (D-318). The Program tab shows
 * one and has a "Your programs" row; that page ticks the one shown, switches to
 * another, and ends with Add another program (waiting while Pam checks one).
 *
 * - **The Program tab** — with the way to the others.
 * - **Your programs** — two programs, one ticked.
 */
const meta = { title: 'Program lead/States/Program — more than one' } satisfies Meta;

export default meta;
type Story = StoryObj;

function onRoute(name: string, pathname: string): Story {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  return {
    ...asRole('provider', pathname, {}, { ownProgram: 'live', secondProgram: true }),
    name,
    render: () => <>{route.render()}</>,
  };
}

export const TheProgramTab: Story = onRoute('The Program tab, with the way to the others', '/program/');
export const YourPrograms: Story = onRoute('Your programs — switch or add another', '/program/switch/');
export const YourProgramsSpanish: Story = { ...YourPrograms, name: 'Your programs — Spanish', globals: { locale: 'es' } };
