import type { Meta, StoryObj } from '@storybook/nextjs';
import PointsPage from '../../app/points/page';
import { asRole } from './journey';

/** Points and badges. */
const meta = {
  title: 'Journeys/09 Points',
  component: PointsPage,
} satisfies Meta<typeof PointsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/points/');
