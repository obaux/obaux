import type { Meta, StoryObj } from '@storybook/nextjs';
import { ConnectionsView } from '../../screens/ConnectionsView';
import { asRedesign } from '../journeys/journey';

/** Connections (D-210): the case manager and programs on a member's side. */
const meta = {
  title: 'Redesign/Connections',
  component: ConnectionsView,
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

export const ThreePeople: Story = { ...asRedesign('member', '/connections/') };
export const None: Story = { ...asRedesign('member', '/connections/'), args: { connections: [] } };
export const Spanish: Story = { ...asRedesign('member', '/connections/'), globals: { locale: 'es' } };
