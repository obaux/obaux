import type { Meta, StoryObj } from '@storybook/nextjs';
import { ConnectionsView } from '../../screens/ConnectionsView';
import { ConnectionProfileScreen, ConnectionsScreen } from '../../screens/ConnectionsScreen';
import { asRedesign } from '../journeys/journey';

/**
 * Connections (D-210, cards since D-213): the case manager and program
 * people on a member's side. Tap a card for their profile; Message opens the
 * example conversation. Photos are hotlinked placeholders (initials where
 * they cannot load).
 */
const meta = {
  title: 'Redesign/Connections',
  component: ConnectionsView,
  args: { connections: [] },
} satisfies Meta<typeof ConnectionsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const People: Story = { ...asRedesign('member', '/connections/'), render: () => <ConnectionsScreen /> };
export const None: Story = { ...asRedesign('member', '/connections/') };
export const Spanish: Story = { ...People, globals: { locale: 'es' } };
export const Profile: Story = {
  ...asRedesign('member', '/connections/person/', { id: 'dummy-p1' }),
  name: 'Profile — Sandra',
  render: () => <ConnectionProfileScreen />,
};
