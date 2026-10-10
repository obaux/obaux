import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProgramHome } from '../../../screens/StaffHomes';
import { asRole } from '../../journeys/journey';

/**
 * A program lead's Home with the row of people who have something new (D-198,
 * card a22): rings on whoever has an unread message or saved a place since the
 * last look, those first. It sits under the header and above the calendar. The
 * redesigned Home, shown here only: the app's Home for a program lead is still
 * the old one until Will says the rings stay. The people are the example set
 * (D-172), ranked by the real rule.
 */
const meta = {
  title: 'Program lead/States/Home with people',
  component: ProgramHome,
} satisfies Meta<typeof ProgramHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithRings: Story = { ...asRole('provider', '/'), name: 'With rings' };
export const Spanish: Story = { ...WithRings, name: 'Spanish', globals: { locale: 'es' } };
export const Arabic: Story = { ...WithRings, name: 'Arabic', globals: { locale: 'ar' } };
