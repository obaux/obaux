import type { Meta, StoryObj } from '@storybook/nextjs';
import { ConnectionsView } from '../../../screens/ConnectionsView';
import { ConnectionsScreen } from '../../../screens/ConnectionsScreen';
import { asRedesign } from '../../journeys/journey';

/**
 * Connections (D-210, cards since D-213): the case manager and program
 * people on a member's side. Each card is the whole profile (D-272): the
 * round button messages them, the program's name opens its page, and a
 * program person shows who connected the member. Photos are hotlinked placeholders (initials where
 * they cannot load).
 */
const meta = {
  title: 'Member/Created/States/Connections',
  component: ConnectionsView,
  args: { connections: [] },
} satisfies Meta<typeof ConnectionsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const People: Story = { ...asRedesign('member', '/connections/'), render: () => <ConnectionsScreen /> };
export const None: Story = { ...asRedesign('member', '/connections/') };
export const Spanish: Story = { ...People, globals: { locale: 'es' } };
