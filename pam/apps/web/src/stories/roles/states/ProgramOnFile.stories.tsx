import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * A program lead whose program is on file (D-447; before-launch, "Load a
 * program lead's own program"). The Program tab reads the lead's own program
 * from the database, so it is the same on any phone, whatever this tab
 * remembers:
 *
 * - **Waiting for review** — "Sent to Pam", from the row's `needs_review`.
 * - **Live** — the program as members see it. Edit changes the description,
 *   phone and website at once; the name, address and kind of help show but stay
 *   still, with a line saying Pam checks them (D-447).
 *
 * Same pretend database as every other story (`ownProgram` in the mock).
 */
const meta = { title: 'Program lead/States/Program — on file' } satisfies Meta;

export default meta;
type Story = StoryObj;

function onFile(name: string, ownProgram: 'review' | 'live'): Story {
  const route = REDESIGN_ROUTES['/program/'];
  if (!route) throw new Error('No prototype route for /program/ — add it to src/stories/prototype/routes.tsx');
  return { ...asRole('provider', '/program/', {}, { ownProgram }), name, render: () => <>{route.render()}</> };
}

export const WaitingForReview: Story = onFile('Waiting for review', 'review');
export const Live: Story = onFile('Live', 'live');
export const LiveSpanish: Story = { ...Live, name: 'Live — Spanish', globals: { locale: 'es' } };
