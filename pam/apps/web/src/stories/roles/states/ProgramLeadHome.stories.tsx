import type { Meta, StoryObj } from '@storybook/nextjs';
import { DUMMY_APPOINTMENTS } from '@pam/config/dummy-appointments';
import { ScheduleView, type Appointment } from '../../../screens/ScheduleView';
import { HeaderActions } from '../../../screens/HeaderActions';
import { AddMenu } from '../../../screens/AddMenu';
import { asRole } from '../../journeys/journey';

/**
 * A program lead's Home (D-218): who is coming in — Day, Week or Month — the
 * title centred with the range under it, search past ten visits, and Invite
 * someone in the + menu (D-221, D-352). The month's busy days scroll sideways.
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
    actions: (
      <>
        <HeaderActions role="provider" hasHelp={false} />
        <AddMenu />
      </>
    ),
  },
} satisfies Meta<typeof ScheduleView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Week: Story = { ...asRole('provider', '/'), name: 'Week' };
export const Day: Story = { ...asRole('provider', '/'), name: 'Day', args: { initialView: 'day' } };
export const Month: Story = { ...asRole('provider', '/'), name: 'Month', args: { initialView: 'month' } };
/** Folded (D-352): while a getting-started card is still to do, the top of the calendar, with a button to see it all. */
export const Folded: Story = { ...asRole('provider', '/'), name: 'Folded', args: { isCollapsed: true } };
/** The calendar alone, as the preview page draws it (D-352). */
export const Embedded: Story = { ...asRole('provider', '/'), name: 'Embedded', args: { isEmbedded: true } };
export const NobodyBooked: Story = {
  ...asRole('provider', '/'),
  name: 'Nobody booked',
  args: { appointments: [] },
};
export const Spanish: Story = { ...Day, name: 'Spanish', globals: { locale: 'es' } };
