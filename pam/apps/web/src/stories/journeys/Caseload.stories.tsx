import type { Meta, StoryObj } from '@storybook/nextjs';
import AdminPage from '../../app/admin/page';
import { asRole } from './journey';

/** A case manager's people. Everybody else meets a closed door, which is a screen too. */
const meta = {
  title: 'Journeys/13 Caseload',
  component: AdminPage,
} satisfies Meta<typeof AdminPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CaseManager: Story = asRole('case-manager', '/admin/');
export const SuperAdmin: Story = asRole('super-admin', '/admin/');
export const Member: Story = asRole('member', '/admin/');
