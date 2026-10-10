import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProgramHome } from '../../../screens/StaffHomes';
import { ExamplePeopleProvider } from '../../../lib/examplePeople';
import { asRole } from '../../journeys/journey';

/**
 * A program lead's Home with the row of people who have something new (D-198,
 * D-486): rings on whoever has an unread message or saved a place since the last
 * look, those first. It sits under the header and above the calendar. The people
 * are the example set (D-172), ranked by the real rule.
 */
const meta = {
  title: 'Program lead/States/Home with people',
  component: ProgramHome,
} satisfies Meta<typeof ProgramHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithRings: Story = { ...asRole('provider', '/'), name: 'With rings' };
/**
 * A lead with nobody on their list yet (D-486): the same faint circles, a (+) first that opens Invite someone.
 * The demo's example people are off here so the empty state can be seen.
 */
export const Empty: Story = {
  ...asRole('provider', '/', {}, { noPeople: true }),
  name: 'Empty',
  decorators: [(Story) => <ExamplePeopleProvider value={false}><Story /></ExamplePeopleProvider>],
};
export const Spanish: Story = { ...WithRings, name: 'Spanish', globals: { locale: 'es' } };
export const Arabic: Story = { ...WithRings, name: 'Arabic', globals: { locale: 'ar' } };
