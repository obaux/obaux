import type { Meta, StoryObj } from '@storybook/nextjs';
import DirectoryPage from '../../app/directory/page';
import { asRole } from './journey';

/** Every account, for the person running PAM. */
const meta = {
  title: 'Journeys/14 Everyone',
  component: DirectoryPage,
} satisfies Meta<typeof DirectoryPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SuperAdmin: Story = asRole('super-admin', '/directory/');
export const CaseManager: Story = asRole('case-manager', '/directory/');
