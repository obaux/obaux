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
 *   phone and website at once; a new name or address is asked of Pam and waits
 *   beside the live one (D-447, D-462).
 * - **Live, with a change waiting** — "Waiting for Pam", what was asked, and a
 *   way to cancel it; members still see the program as it was.
 * - **Delete and start over** — from "Sent to Pam" › What you sent: the send is
 *   withdrawn and the tab is Add a program again.
 *
 * Same pretend database as every other story (`ownProgram` in the mock).
 */
const meta = { title: 'Program lead/States/Program — on file' } satisfies Meta;

export default meta;
type Story = StoryObj;

function onFile(name: string, ownProgram: 'review' | 'live', pendingChange = false, pathname = '/program/'): Story {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  return { ...asRole('provider', pathname, {}, { ownProgram, pendingChange }), name, render: () => <>{route.render()}</> };
}

export const WaitingForReview: Story = onFile('Waiting for review', 'review');
export const Live: Story = onFile('Live', 'live');
export const LiveWithAChangeWaiting: Story = onFile('Live, a new name and address waiting for Pam', 'live', true);
export const WhatYouSent: Story = onFile('What you sent, with Delete and start over', 'review', false, '/program/sent/');
export const LiveSpanish: Story = { ...Live, name: 'Live — Spanish', globals: { locale: 'es' } };
