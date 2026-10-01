import type { Meta, StoryObj } from '@storybook/nextjs';
import RemindersPage from '../../app/reminders/page';
import { asRole } from './journey';

/** The consent screen the carrier registration points at: nothing pre-selected. */
const meta = {
  title: 'Journeys/03 Text reminders',
  component: RemindersPage,
} satisfies Meta<typeof RemindersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/reminders/');
