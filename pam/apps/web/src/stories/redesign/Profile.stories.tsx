import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProfileView } from '../../screens/ProfileView';
import { HeaderActions } from '../shell/HeaderActions';
import { LocalTabBar } from '../shell/LocalTabBar';
import { asRole } from '../journeys/journey';

/**
 * Profile, redesigned (D-210). Scroll it: the large title shrinks into the
 * bar, which keeps the bell and Help in reach.
 */
const meta = {
  title: 'Redesign/Profile',
  component: ProfileView,
  decorators: [
    (Story) => (
      <>
        <Story />
        <LocalTabBar current="profile" />
      </>
    ),
  ],
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

export const Member: Story = { ...asRole('member', '/profile/') };
export const RemindersAlreadyOn: Story = { ...asRole('member', '/profile/'), args: { remindersOn: true } };
export const NewMember: Story = {
  ...asRole('member', '/profile/'),
  args: { points: 0, savedCount: 0, connectionsCount: 0 },
};
export const LongName: Story = {
  ...asRole('member', '/profile/'),
  args: { name: 'Maria Guadalupe Hernandez-Washington' },
};
export const Spanish: Story = { ...asRole('member', '/profile/'), globals: { locale: 'es' } };
