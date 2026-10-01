import type { Meta, StoryObj } from '@storybook/nextjs';
import MessageThreadPage from '../../app/messages/thread/page';
import { asRole } from './journey';

/** Two pinned bars and a scrolling middle (D-192). The menu in the corner blocks (D-206). */
const meta = {
  title: 'Journeys/12 A conversation',
  component: MessageThreadPage,
} satisfies Meta<typeof MessageThreadPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/messages/thread/', {'id': '2a9d5e1c-3b7f-4d8e-9a1b-6c5d4e3f2a1b'});
export const CaseManager: Story = asRole('case-manager', '/messages/thread/', {'id': '2a9d5e1c-3b7f-4d8e-9a1b-6c5d4e3f2a1b'});
