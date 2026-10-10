import type { Meta, StoryObj } from '@storybook/nextjs';
import { CaseloadHome } from '../../../screens/StaffHomes';
import { asRole } from '../../journeys/journey';

/**
 * A case manager's Home (D-212): their caseload under the search bar, Home on
 * the first tab. Type a name to filter; tap a person.
 */
const meta = {
  title: 'Case manager/States/Home',
  component: CaseloadHome,
} satisfies Meta<typeof CaseloadHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Caseload: Story = { ...asRole('case-manager', '/'), name: 'Caseload' };
export const Spanish: Story = { ...Caseload, name: 'Spanish', globals: { locale: 'es' } };
