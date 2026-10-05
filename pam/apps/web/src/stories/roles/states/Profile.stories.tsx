import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProfileView } from '../../../screens/ProfileView';
import { HeaderActions } from '../../shell/HeaderActions';
import { asRedesign } from '../../journeys/journey';

/**
 * Profile, redesigned (D-210). Scroll it: the large title shrinks into the
 * bar, which keeps the bell and Help in reach.
 */
const meta = {
  title: 'Member app/States/Profile',
  component: ProfileView,
  args: {
    name: 'Marcus',
    role: 'member',
    points: 400,
    savedCount: 3,
    connectionsCount: 2,
    remindersOn: false,
    headerActions: <HeaderActions />,
  },
} satisfies Meta<typeof ProfileView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = { ...asRedesign('member', '/profile/') };
export const RemindersAlreadyOn: Story = { ...asRedesign('member', '/profile/'), args: { remindersOn: true } };
export const NewMember: Story = {
  ...asRedesign('member', '/profile/'),
  args: { points: 0, savedCount: 0, connectionsCount: 0 },
};
export const LongName: Story = {
  ...asRedesign('member', '/profile/'),
  args: { name: 'Maria Guadalupe Hernandez-Washington' },
};
export const Spanish: Story = { ...asRedesign('member', '/profile/'), globals: { locale: 'es' } };
