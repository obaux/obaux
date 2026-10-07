import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProgramEmptyView } from '../../../screens/ProgramEmptyView';
import { asRole } from '../../journeys/journey';

/**
 * **Mockup for review** (D-352): the Program tab before a lead has added a
 * program — what goes here, one button to add it, and the page members will
 * see, faded under it. Not in the app yet; the Program tab still shows the
 * example program until this is agreed.
 */
const meta = {
  title: 'Program lead/States/Program — no program yet (mockup)',
  component: ProgramEmptyView,
} satisfies Meta<typeof ProgramEmptyView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoProgramYet: Story = { ...asRole('provider', '/program/'), name: 'No program yet' };
export const Spanish: Story = { ...NoProgramYet, name: 'Spanish', globals: { locale: 'es' } };
