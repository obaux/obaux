import type { Meta, StoryObj } from '@storybook/nextjs';
import FlagPage from '../../app/flag/page';
import { asRole } from './journey';

/** One of four reasons, and an optional note. */
const meta = {
  title: 'Journeys/08 Report a place',
  component: FlagPage,
} satisfies Meta<typeof FlagPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/flag/', {'place': 's1'});
export const CaseManager: Story = asRole('case-manager', '/flag/', {'place': 's1'});
