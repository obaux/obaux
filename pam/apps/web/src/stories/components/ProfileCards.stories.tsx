import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import { BellIcon, StarIcon } from '@pam/ui';
import { BadgeArt, ConnectionsArt } from '@pam/ui/BadgeArt';
import { FeatureTile, FeatureTileRow, ProfileSummary, PromoCard } from '@pam/ui/ProfileCards';
import { SetupArt } from '@pam/ui/SetupArt';
import { useStoryText } from '../support/useStoryText';

/** The Profile screen's cards: who you are with up to three numbers, two feature tiles side by side, and a single offer. Use ProfileSummary at the top of a profile. */
const meta = {
  title: 'Components/Cards/ProfileCards',
  tags: ['autodocs'],
  component: ProfileSummary,
  args: {
    name: 'Jordan',
    roleLabel: 'Member',
    photoUrl: null,
    stats: [
      { value: '120', label: 'Points' },
      { value: '4', label: 'Places saved' },
      { value: '3', label: 'Connections' },
    ],
  },
  argTypes: {
    corner: { control: false },
    nameAddon: { control: false },
  },
} satisfies Meta<typeof ProfileSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A staff account has no numbers to show, so the person has the whole card. */
export const StaffNoStats: Story = { args: { name: 'Keisha', roleLabel: 'Case manager', stats: [] } };

/** On someone else's page, whose title already says the name: the same card, but the name is not a second heading, so a screen reader says it once. */
export const NameInTitle: Story = { args: { isNameInTitle: true } };

/** A case manager viewing a member: a star in the corner. */
export const WithCorner: Story = {
  args: {
    roleLabel: 'Member · North Philadelphia',
    corner: <StarIcon width={24} height={24} isFilled={false} aria-label="Star Jordan" />,
  },
};

/** Two FeatureTiles side by side in a FeatureTileRow: the member's badge and Connections. */
export const FeatureTiles: Story = {
  render: () => (
    <FeatureTileRow>
      <FeatureTile label="Rooted" hint="Your badge" href="/points/" art={<BadgeArt badgeKey="rooted" size={88} shape="square" />} />
      <FeatureTile label="Connections" href="/connections/" art={<ConnectionsArt size={88} />} />
    </FeatureTileRow>
  ),
};

/** A single PromoCard offer. */
export const Promo: Story = {
  render: function Render() {
    // The app's own words, read from the bundle (the offer's name changed once already: B4).
    const tr = useStoryText();
    return (
      <PromoCard
        title={tr('profile.promo.reminders.title')}
        badge={tr('common.comingSoon')}
        href="/reminders/"
        art={<SetupArt kind="alerts" size={72} />}
      />
    );
  },
};

/** The full Profile stack, as the screen lays it out. */
export const FullProfile: Story = {
  render: function Render(args) {
    const tr = useStoryText();
    return (
    <VStack gap={4}>
      <ProfileSummary {...args} />
      <FeatureTileRow>
        <FeatureTile label="Rooted" hint="Your badge" href="/points/" art={<BadgeArt badgeKey="rooted" size={88} shape="square" />} />
        <FeatureTile label="Connections" href="/connections/" art={<ConnectionsArt size={88} />} />
      </FeatureTileRow>
      <PromoCard
        title={tr('profile.promo.reminders.title')}
        badge={tr('common.comingSoon')}
        href="/reminders/"
        art={<BellIcon width={36} height={36} aria-hidden />}
      />
    </VStack>
    );
  },
};
