import type { Meta, StoryObj } from '@storybook/nextjs';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { DashedRule } from '@pam/ui/DashedRule';

/**
 * The dashed rule (D-356): round-ended 2px dashes, black at 5%. Put it under
 * a page's explanation, before the thing it explains. For new work only —
 * existing solid dividers stay as they are.
 */
const meta = {
  title: 'Components/Layout/DashedRule',
  tags: ['autodocs'],
  component: DashedRule,
} satisfies Meta<typeof DashedRule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** As the calendar preview uses it: under the explanation, with room after. */
export const UnderAnExplanation: Story = {
  render: () => (
    <VStack gap={5}>
      <Text type="supporting">When members plan a trip to your program, they show up here, by day.</Text>
      <DashedRule />
    </VStack>
  ),
};
