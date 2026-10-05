import type { Meta, StoryObj } from '@storybook/nextjs';
import { HStack } from '@astryxdesign/core/HStack';
import { CategoryArt } from '@pam/ui/CategoryArt';

/** A small, flat illustration for each kind of place, in the sign-in carousel's style (D-287). */
const meta = {
  title: 'Components/CategoryArt',
  component: CategoryArt,
  args: { category: 'education', size: 56 },
} satisfies Meta<typeof CategoryArt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SchoolAndTraining: Story = {};
export const WorkAndMoney: Story = { args: { category: 'workforce' } };
export const FamilyAndFood: Story = { args: { category: 'family_services' } };
/** All three, large, to check the drawing. */
export const AllLarge: Story = {
  render: () => (
    <HStack gap={4}>
      <CategoryArt category="education" size={160} />
      <CategoryArt category="workforce" size={160} />
      <CategoryArt category="family_services" size={160} />
    </HStack>
  ),
};
