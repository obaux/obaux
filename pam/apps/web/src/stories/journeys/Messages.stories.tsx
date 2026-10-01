import type { Meta, StoryObj } from '@storybook/nextjs';
import MessagesPage from '../../app/messages/page';
import { asRole } from './journey';

/** Conversations, and one New message button. */
const meta = {
  title: 'Journeys/11 Messages',
  component: MessagesPage,
} satisfies Meta<typeof MessagesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/messages/');
export const ProgramManager: Story = asRole('provider', '/messages/');
export const CaseManager: Story = asRole('case-manager', '/messages/');
export const SuperAdmin: Story = asRole('super-admin', '/messages/');
