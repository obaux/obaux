import type { Meta, StoryObj } from '@storybook/nextjs';
import NotificationsPage from '../../app/notifications/page';
import { asRole } from './journey';

/** What happened, said with a name. */
const meta = {
  title: 'Journeys/10 Notifications',
  component: NotificationsPage,
} satisfies Meta<typeof NotificationsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/notifications/');
export const ProgramManager: Story = asRole('provider', '/notifications/');
export const CaseManager: Story = asRole('case-manager', '/notifications/');
export const SuperAdmin: Story = asRole('super-admin', '/notifications/');
