import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * A program's policies for participants, kept for real (D-261, Will's card a25).
 * A lead with a program on file adds, reads and takes off policies in the
 * database: each is a PDF or a photo of each page, up to five files of 10 MB,
 * kept privately. A policy is never edited — a new version replaces it and
 * people are asked to sign again; what they signed before stays on record.
 * Signing is the next part; until then nobody has signed anything.
 */
const meta = { title: 'Program lead/States/Program — policies' } satisfies Meta;

export default meta;
type Story = StoryObj;

function onRoute(name: string, pathname: string, query: Record<string, string> = {}): Story {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  return {
    ...asRole('provider', pathname, query, { ownProgram: 'live', ownPolicies: true }),
    name,
    render: () => <>{route.render()}</>,
  };
}

export const ThePolicies: Story = onRoute('Policies for participants', '/program/policies/');
export const OnePolicy: Story = onRoute('A policy: its version, its pages, and Replace', '/program/policies/view/', { id: 'policy-1' });
export const ThePoliciesSpanish: Story = { ...ThePolicies, name: 'Policies — Spanish', globals: { locale: 'es' } };
