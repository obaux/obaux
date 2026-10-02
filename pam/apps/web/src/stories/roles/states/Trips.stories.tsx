import type { Meta, StoryObj } from '@storybook/nextjs';
import { TripsScreen, TripsView } from '../../../screens/TripsView';
import { HeaderActions } from '../../shell/HeaderActions';
import { asRedesign } from '../../journeys/journey';

/**
 * Trips (D-213): the map with a pin per visit, and the drawer over it — drag
 * the handle (or tap it) between a dock, half and 90%. Search narrows pins
 * and cards by the place's name. The map here is the drawn preview; with
 * `NEXT_PUBLIC_GOOGLE_MAPS_KEY` set it is Google Maps.
 */
const meta = {
  title: 'Member app/States/Trips',
  component: TripsView,
  args: { trips: [], headerActions: <HeaderActions /> },
} satisfies Meta<typeof TripsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Upcoming: Story = {
  ...asRedesign('member', '/trips/'),
  render: () => <TripsScreen headerActions={<HeaderActions />} />,
};
export const NoTrips: Story = { ...asRedesign('member', '/trips/') };
export const Spanish: Story = { ...Upcoming, globals: { locale: 'es' } };
