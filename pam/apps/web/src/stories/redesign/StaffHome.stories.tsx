import type { Meta, StoryObj } from '@storybook/nextjs';
import { CaseloadHome, ProgramHome } from '../../screens/HomeScreen';
import { asRedesign } from '../journeys/journey';

/**
 * A staff member's home (D-212): the case manager's caseload, and the
 * people interested in a program — each under the search bar, with Home on
 * the first tab. Type a name to filter; tap a person.
 */
const meta = {
  title: 'Redesign/Staff home',
  component: CaseloadHome,
} satisfies Meta<typeof CaseloadHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CaseManager: Story = { ...asRedesign('case-manager', '/'), name: 'Case manager — caseload' };
export const Program: Story = {
  ...asRedesign('provider', '/'),
  name: 'Program — interested',
  render: () => <ProgramHome />,
};
export const CaseManagerSpanish: Story = { ...CaseManager, name: 'Case manager — Spanish', globals: { locale: 'es' } };
