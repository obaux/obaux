import type { Meta, StoryObj } from '@storybook/nextjs';
import HelpPage from '../../app/help/page';
import { asRole } from './journey';

/** The one screen that must never fail. */
const meta = {
  title: 'Journeys/17 Help',
  component: HelpPage,
} satisfies Meta<typeof HelpPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = asRole('signed-out', '/help/');
export const Member: Story = asRole('member', '/help/');
