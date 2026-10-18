import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * The agree screen as somebody reaches it from a Text alerts switch (D-615). Nothing on Text alerts is a first
 * agreement: with no yes on file a switch records nothing and opens this screen for the person's own role,
 * `/reminders/?next=alerts&kind=<kind>`, and "Agree to receive texts" brings them back to Text alerts with that
 * switch on ("Not now" brings them back with it off). Staff see the staff list of texts, not a member's.
 * Return is not drawn here: the prototype has no address bar to bring anyone back with.
 */
const meta = { title: 'Case manager/Created/States/Text alerts: agree first' } satisfies Meta;

export default meta;
type Story = StoryObj;

function agree(role: 'case-manager' | 'provider', name: string): Story {
  const route = REDESIGN_ROUTES['/reminders/'];
  if (!route) throw new Error('No prototype route for /reminders/ — add it to src/stories/prototype/routes.tsx');
  return { ...asRole(role, '/reminders/', { next: 'alerts', kind: 'message' }), name, render: () => <>{route.render()}</> };
}

export const CaseManager: Story = agree('case-manager', 'Case manager');
export const ProgramLead: Story = agree('provider', 'Program lead');
