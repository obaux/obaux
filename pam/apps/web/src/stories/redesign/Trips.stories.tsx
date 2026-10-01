import type { Meta, StoryObj } from '@storybook/nextjs';
import { TripsView } from '../../screens/TripsView';
import { HeaderActions } from '../shell/HeaderActions';
import { asRedesign } from '../journeys/journey';

/** Trips (D-210): empty until a visit can be planned. */
const meta = {
  title: 'Redesign/Trips',
  component: TripsView,
  args: { headerActions: <HeaderActions /> },
} satisfies Meta<typeof TripsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { ...asRedesign('member', '/trips/') };
export const Spanish: Story = { ...asRedesign('member', '/trips/'), globals: { locale: 'es' } };
