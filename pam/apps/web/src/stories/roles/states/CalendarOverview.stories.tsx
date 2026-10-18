import type { Meta, StoryObj } from '@storybook/nextjs';
import { asRole } from '../../journeys/journey';
import { REDESIGN_ROUTES } from '../../prototype/routes';

/**
 * Profile › Calendar when the link's state cannot be read (D-538, a98 plan C). The member who comes back later to a link already made
 * has no story of its own any more: Pam works the address out again, so the page shows it every time (`CalendarLink.stories`, "Linked").
 */
const meta = { title: 'Member/Created/States/Calendar link (overview)' } satisfies Meta;

export default meta;
type Story = StoryObj;

const route = REDESIGN_ROUTES['/calendar/'];
if (!route) throw new Error('No prototype route for /calendar/ — add it to src/stories/prototype/routes.tsx');

/** The status could not be read: the something-went-wrong notice. */
export const CantRead: Story = {
  ...asRole('member', '/calendar/', {}, { calendarError: true }),
  name: 'Cannot be read',
  render: () => <>{route!.render()}</>,
};
