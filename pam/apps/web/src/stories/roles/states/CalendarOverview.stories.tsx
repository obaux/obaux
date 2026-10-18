import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * Profile › Calendar (D-538) in the two states `CalendarLink.stories` does not reach without a tap: the link is on and the member
 * has come back later (Pam shows the link only once, so the page cannot show it again), and the status could not be read. These
 * are the "before" of the calendar redesign (card a98, 17 October); the other states are in that file.
 */
const meta = { title: 'Member/Created/States/Calendar link (overview)' } satisfies Meta;

export default meta;
type Story = StoryObj;

const route = REDESIGN_ROUTES['/calendar/'];
if (!route) throw new Error('No prototype route for /calendar/ — add it to src/stories/prototype/routes.tsx');

/** On, coming back later: no link to show, "Pam can't show your link again". */
export const ComingBack: Story = {
  ...asRole('member', '/calendar/', {}, { calendarOn: true }),
  name: 'Coming back later',
  render: () => <>{route!.render()}</>,
};

/** The status could not be read: the something-went-wrong notice. */
export const CantRead: Story = {
  ...asRole('member', '/calendar/', {}, { calendarError: true }),
  name: 'Cannot be read',
  render: () => <>{route!.render()}</>,
};
