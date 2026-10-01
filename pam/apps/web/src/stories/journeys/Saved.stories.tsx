import type { Meta, StoryObj } from '@storybook/nextjs';
import SavedPage from '../../app/saved/page';
import { asRole } from './journey';

/** Everything a member kept. */
const meta = {
  title: 'Journeys/07 Saved',
  component: SavedPage,
} satisfies Meta<typeof SavedPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/saved/');
