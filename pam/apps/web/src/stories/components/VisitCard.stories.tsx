import type { Meta, StoryObj } from '@storybook/nextjs';
import { VisitCard } from '@pam/ui/VisitCard';

/** A place opened from a trip: the booked visit as a small hero, with a way to move it (D-281). */
const meta = {
  title: 'Components/Cards/VisitCard',
  tags: ['autodocs'],
  component: VisitCard,
  args: {
    eyebrow: 'Your next visit',
    day: 'Wednesday, October 7',
    time: '10:00 AM',
    changeLabel: 'Change appointment',
    changeHref: '/trips/new/?place=dummy-place-learning&change=dummy-trip-1',
  },
} satisfies Meta<typeof VisitCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** A visit already past: no link to change it. */
export const Past: Story = { args: { eyebrow: 'Your visit', changeLabel: undefined, changeHref: null } };

/** A visit for one of the program's services: the service follows the time (D-332). */
export const WithService: Story = { args: { service: 'GED classes' } };

/** How soon, under the time (D-337). */
export const WithCountdown: Story = { args: { service: 'GED classes', countdown: 'In 2 days' } };

/** "Your trip is booked": named for the program, with how soon and Change (D-337). */
export const Booked: Story = {
  args: { eyebrow: 'Example Learning Center', day: 'Friday, October 9', service: 'GED classes', countdown: 'In 2 days' },
};
