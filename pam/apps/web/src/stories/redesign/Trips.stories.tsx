import type { Meta, StoryObj } from '@storybook/nextjs';
import { TripsView } from '../../screens/TripsView';
import { HeaderActions } from '../shell/HeaderActions';
import { LocalTabBar } from '../shell/LocalTabBar';
import { asRole } from '../journeys/journey';

/** Trips (D-210): empty until a visit can be planned. */
const meta = {
  title: 'Redesign/Trips',
  component: TripsView,
  decorators: [
    (Story) => (
      <>
        <Story />
        <LocalTabBar current="trips" />
      </>
    ),
  ],
  args: { headerActions: <HeaderActions /> },
} satisfies Meta<typeof TripsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { ...asRole('member', '/trips/') };
export const Spanish: Story = { ...asRole('member', '/trips/'), globals: { locale: 'es' } };
