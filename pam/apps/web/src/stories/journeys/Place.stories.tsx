import type { Meta, StoryObj } from '@storybook/nextjs';
import PlacePage from '../../app/place/page';
import { asRole } from './journey';

/** Everything about one place, and the actions that used to crowd the card. */
const meta = {
  title: 'Journeys/06 One place',
  component: PlacePage,
} satisfies Meta<typeof PlacePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = asRole('member', '/place/', {'id': 's1', 'from': 'places'});
export const ProgramManager: Story = asRole('provider', '/place/', {'id': 's1', 'from': 'places'});
export const CaseManager: Story = asRole('case-manager', '/place/', {'id': 's1', 'from': 'places'});
export const SuperAdmin: Story = asRole('super-admin', '/place/', {'id': 's1', 'from': 'places'});
