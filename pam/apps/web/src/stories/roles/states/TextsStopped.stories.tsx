import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * Somebody who replied STOP (D-453). The privacy page promises "Reply STOP any
 * time and the texts stop. Nothing in the app can turn them back on", so Text
 * reminders and Text alerts say so instead of asking a question, and offer no
 * switch and no "Agree to receive texts" — and the database refuses to clear
 * the stop from the app as well (a stored STOP cannot be cleared from the app).
 */
const meta = { title: 'Member/Created/States/Texts stopped' } satisfies Meta;

export default meta;
type Story = StoryObj;

function stopped(name: string, pathname: string): Story {
  const route = REDESIGN_ROUTES[pathname];
  if (!route) throw new Error(`No prototype route for ${pathname} — add it to src/stories/prototype/routes.tsx`);
  return { ...asRole('member', pathname, {}, { textsStopped: true }), name, render: () => <>{route.render()}</> };
}

export const Reminders: Story = stopped('Text reminders', '/reminders/');
export const Alerts: Story = stopped('Text alerts', '/alerts/');
