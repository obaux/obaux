import type { Meta, StoryObj } from '@storybook/nextjs';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BADGES } from '@pam/config';
import { BadgeArt, ConnectionsArt } from '@pam/ui/BadgeArt';
import { CategoryArt } from '@pam/ui/CategoryArt';

/** Every badge's picture, in the place cards' style (D-295): the ladder, the category badges, the milestones. */
const meta = {
  title: 'Components/BadgeArt',
  component: BadgeArt,
  args: { badgeKey: 'rooted', size: 72, shape: 'circle', isLocked: false },
} satisfies Meta<typeof BadgeArt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const One: Story = {};
export const Locked: Story = { args: { isLocked: true } };

/** All twenty, then Profile's Connections and the three place pictures — one set. */
export const Everything: Story = {
  render: () => (
    <VStack gap={4}>
      {(['core', 'category', 'milestone'] as const).map((group) => (
        <HStack key={group} gap={3} wrap="wrap">
          {BADGES.filter((b) => b.group === group).map((b) => (
            <VStack key={b.key} gap={1} align="center">
              <BadgeArt badgeKey={b.key} size={72} />
              <Text type="supporting">{b.key}</Text>
            </VStack>
          ))}
        </HStack>
      ))}
      <HStack gap={3} wrap="wrap">
        <ConnectionsArt size={88} />
        <BadgeArt badgeKey="rooted" size={88} shape="square" />
        <CategoryArt category="education" size={88} />
        <CategoryArt category="workforce" size={88} />
        <CategoryArt category="family_services" size={88} />
      </HStack>
    </VStack>
  ),
};
