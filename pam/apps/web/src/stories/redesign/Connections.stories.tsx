import type { Meta, StoryObj } from '@storybook/nextjs';
import { ConnectionsView } from '../../screens/ConnectionsView';
import { LocalTabBar } from '../shell/LocalTabBar';
import { asRole } from '../journeys/journey';

/** Connections (D-210): the case manager and programs on a member's side. */
const meta = {
  title: 'Redesign/Connections',
  component: ConnectionsView,
  decorators: [
    (Story) => (
      <>
        <Story />
        <LocalTabBar current="profile" />
      </>
    ),
  ],
  args: {
    connections: [
      { id: 'c1', firstName: 'Teresa', role: 'admin' },
      { id: 'c2', firstName: 'Alice', role: 'provider', programName: 'Riverside Learning Center' },
      { id: 'c3', firstName: 'Darnell', role: 'provider', programName: 'Philadelphia Works — Center City' },
    ],
  },
} satisfies Meta<typeof ConnectionsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreePeople: Story = { ...asRole('member', '/connections/') };
export const None: Story = { ...asRole('member', '/connections/'), args: { connections: [] } };
export const Spanish: Story = { ...asRole('member', '/connections/'), globals: { locale: 'es' } };
