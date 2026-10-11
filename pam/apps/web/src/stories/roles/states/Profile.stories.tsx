import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProfileView } from '../../../screens/ProfileView';
import { HeaderActions } from '../../shell/HeaderActions';
import { asRedesign } from '../../journeys/journey';

/**
 * Profile, redesigned (D-210). Scroll it: the large title shrinks into the
 * bar, which keeps the bell and Help in reach.
 */
const meta = {
  title: 'Member/Created/States/Profile',
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
/** A member who also works at a program (D-374): "Use Pam as" leads the settings. */
export const AlsoWorksAtAProgram: Story = { ...asRedesign('member', '/profile/'), args: { canUseAs: true } };

/**
 * While it loads (Will, 11 October: "skeleton loaders for the image, stats and labels in profile hero card";
 * D-518): the hero card is pulses sized exactly like the real card, so nothing moves when it arrives. The pulse
 * stops under reduce-motion.
 */
export const LoadingHeroCard: Story = { ...asRedesign('member', '/profile/'), args: { isLoading: true } };
/** The account is known and the numbers are still arriving: only the numbers are pulses. */
export const NumbersArriving: Story = { ...asRedesign('member', '/profile/'), args: { points: null, savedCount: null } };
