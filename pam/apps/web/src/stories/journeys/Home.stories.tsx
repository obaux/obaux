import type { Meta, StoryObj } from '@storybook/nextjs';
import HomePage from '../../app/page';
import { asRole } from './journey';

/** A menu, and only a menu. Role decides the tiles. */
const meta = {
  title: 'Journeys/04 Home',
  component: HomePage,
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/');
export const ProgramManager: Story = asRole('provider', '/');
export const CaseManager: Story = asRole('case-manager', '/');
export const SuperAdmin: Story = asRole('super-admin', '/');
