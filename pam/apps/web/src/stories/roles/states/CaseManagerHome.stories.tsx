import type { Meta, StoryObj } from '@storybook/nextjs';
import { CaseloadHome } from '../../../screens/StaffHomes';
import { asRole } from '../../journeys/journey';

/**
 * A case manager's Home (D-212): their caseload under the search bar, Home on
 * the first tab. Type a name to filter; tap a person. Under the title, a row of
 * rings on the people with something new (D-198, card a22): an unread message
 * (Keisha) or a place saved since the last look (Aaliyah), those first. The
 * redesigned Home, shown here only: the app's Home for a case manager is still
 * the old one until Will says the rings stay.
 */
const meta = {
  title: 'Case manager/States/Home',
  component: CaseloadHome,
} satisfies Meta<typeof CaseloadHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Caseload: Story = { ...asRole('case-manager', '/'), name: 'Caseload' };
export const Arabic: Story = { ...Caseload, name: 'Arabic', globals: { locale: 'ar' } };
export const Spanish: Story = { ...Caseload, name: 'Spanish', globals: { locale: 'es' } };
