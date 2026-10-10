import type { Meta, StoryObj } from '@storybook/nextjs';
import { CaseloadHome } from '../../../screens/StaffHomes';
import { ExamplePeopleProvider } from '../../../lib/examplePeople';
import { asRole } from '../../journeys/journey';

/**
 * A case manager's Home (D-212): their caseload under the search bar, Home on
 * the first tab. Type a name to filter; tap a person. Under the title, a row of
 * rings on the people with something new (D-198, D-486): an unread message or a
 * place saved since the last look, those first.
 */
const meta = {
  title: 'Case manager/States/Home',
  component: CaseloadHome,
} satisfies Meta<typeof CaseloadHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Caseload: Story = { ...asRole('case-manager', '/'), name: 'Caseload' };
/**
 * Nobody on the list yet (D-486): under "Your members", faint circles with a (+) first that starts an invite
 * (a member's, straight away), and the list's own "Nobody on your list yet" below. The demo's example people
 * are off here so the empty state can be seen; in the app they stand in for it while the demo is on (D-172).
 */
export const Empty: Story = {
  ...asRole('case-manager', '/', {}, { noPeople: true }),
  name: 'Empty',
  decorators: [(Story) => <ExamplePeopleProvider value={false}><Story /></ExamplePeopleProvider>],
};
export const EmptyArabic: Story = { ...Empty, name: 'Empty — Arabic', globals: { locale: 'ar' } };
export const Arabic: Story = { ...Caseload, name: 'Arabic', globals: { locale: 'ar' } };
export const Spanish: Story = { ...Caseload, name: 'Spanish', globals: { locale: 'es' } };
