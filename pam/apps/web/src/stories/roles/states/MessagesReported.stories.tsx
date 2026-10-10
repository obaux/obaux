import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import type { JourneyRole } from '../../journeys/fixtures';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * Reported, inside the redesigned Messages (D-464): a case manager and a super
 * admin see "Conversations | Reported" under the title, and the second is the
 * messages somebody said were not safe — the cards of D-178/D-184, shown as the
 * example set here. The bell's "a message was reported" opens
 * `/messages/?show=reported`, which lands on it.
 */
const meta = { title: 'Case manager/States/Messages — Reported' } satisfies Meta;

export default meta;
type Story = StoryObj;

function messages(name: string, role: JourneyRole, query: Record<string, string> = {}): Story {
  const route = REDESIGN_ROUTES['/messages/'];
  if (!route) throw new Error('No prototype route for /messages/');
  return { ...asRole(role, '/messages/', query), name, render: () => <>{route.render()}</> };
}

export const Conversations: Story = messages('Case manager — Conversations', 'case-manager');
export const Reported: Story = messages('Case manager — Reported (from the bell)', 'case-manager', { show: 'reported' });
export const SuperAdminReported: Story = messages('Super admin — Reported (from the bell)', 'super-admin', { show: 'reported' });
