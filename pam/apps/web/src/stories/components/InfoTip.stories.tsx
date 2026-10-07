import type { Meta, StoryObj } from '@storybook/nextjs';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { InfoTip } from '@pam/ui/InfoTip';

/**
 * An info tip (D-368): a 36px round icon — under the 48px floor on purpose,
 * because it explains and never acts — that opens a popover with 18px of
 * padding. Put it beside the heading or name it explains. See Foundations ›
 * Actions for the rule on small targets.
 */
const meta = {
  title: 'Components/Actions/InfoTip',
  tags: ['autodocs'],
  component: InfoTip,
  args: {
    label: 'About services',
    content:
      'Name each thing you do, like GED classes or a computer room. Later, from your Program tab, you can give each one its own address, hours, phone, website and policies.',
  },
} satisfies Meta<typeof InfoTip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Beside a heading, as on Add a program. */
export const BesideAHeading: Story = {
  render: (args) => (
    <HStack gap={1} align="center" wrap="nowrap">
      <Heading level={2}>What does it offer?</Heading>
      <InfoTip {...args} />
    </HStack>
  ),
};
