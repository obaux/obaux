import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProgramHome } from '../../../screens/HomeScreen';
import { asRole } from '../../journeys/journey';

/**
 * A program lead's Home (D-212): the members interested in their program,
 * under the search bar, Home on the first tab.
 */
const meta = {
  title: 'Program lead/States/Home',
  component: ProgramHome,
} satisfies Meta<typeof ProgramHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interested: Story = { ...asRole('provider', '/'), name: 'Interested' };
export const Spanish: Story = { ...Interested, name: 'Spanish', globals: { locale: 'es' } };
