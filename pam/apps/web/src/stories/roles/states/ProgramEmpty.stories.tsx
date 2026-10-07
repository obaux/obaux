import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProgramEmptyView } from '../../../screens/ProgramEmptyView';
import { asRole } from '../../journeys/journey';

/**
 * **Approved mockup, not in use** (D-352, D-363): the Program tab before a
 * lead has added a program — one button to add it over the page members will
 * see, faded. Will approved it on 7 October but chose to keep the Program tab
 * opening Add a program directly (D-361), so this stays here for later.
 */
const meta = {
  title: 'Program lead/States/Program — no program yet (approved mockup, unused)',
  component: ProgramEmptyView,
} satisfies Meta<typeof ProgramEmptyView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoProgramYet: Story = { ...asRole('provider', '/program/'), name: 'No program yet' };
export const Spanish: Story = { ...NoProgramYet, name: 'Spanish', globals: { locale: 'es' } };
