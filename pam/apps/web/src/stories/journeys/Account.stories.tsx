import type { Meta, StoryObj } from '@storybook/nextjs';
import AccountPage from '../../app/account/page';
import { asRole } from './journey';

/** Language, the way out, and what others can see. */
const meta = {
  title: 'Journeys/16 Account',
  component: AccountPage,
} satisfies Meta<typeof AccountPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/account/');
export const ProgramManager: Story = asRole('provider', '/account/');
export const CaseManager: Story = asRole('case-manager', '/account/');
export const SuperAdmin: Story = asRole('super-admin', '/account/');
