import type { Meta, StoryObj } from '@storybook/nextjs';
import { DUMMY_APPOINTMENTS } from '@pam/config/dummy-appointments';
import { ScheduleView, type Appointment } from '../../../screens/ScheduleView';
import { HeaderActions } from '../../../screens/HeaderActions';
import { InviteFloating } from '../../../screens/HomeScreen';
import { asRole } from '../../journeys/journey';

/**
 * A program lead's Home (D-218): who is coming in — Day, Week or Month — with
 * search by name, day or time, and Invite someone floating above the bar.
 */
const KIND: Record<string, string> = { intake: 'First visit', class: 'Class', checkin: 'Check-in', tour: 'Tour' };
const appointments: Appointment[] = DUMMY_APPOINTMENTS.map((a) => ({
  id: a.id,
  personId: a.personId,
  firstName: a.firstName,
  startsAt: a.startsAt,
  minutes: a.minutes,
  kindLabel: KIND[a.kind] ?? a.kind,
  href: `/person/?id=${a.personId}`,
}));

const meta = {
  title: 'Program lead/States/Home',
  component: ScheduleView,
  args: {
    appointments,
    actions: <HeaderActions role="provider" />,
    floating: <InviteFloating />,
  },
} satisfies Meta<typeof ScheduleView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Day: Story = { ...asRole('provider', '/'), name: 'Day' };
export const Week: Story = { ...asRole('provider', '/'), name: 'Week', args: { initialView: 'week' } };
export const Month: Story = { ...asRole('provider', '/'), name: 'Month', args: { initialView: 'month' } };
export const NobodyBooked: Story = {
  ...asRole('provider', '/'),
  name: 'Nobody booked',
  args: { appointments: [] },
};
export const Spanish: Story = { ...Day, name: 'Spanish', globals: { locale: 'es' } };
