import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { InfoTip } from '@pam/ui/InfoTip';
import { useStoryText } from '../support/useStoryText';

/** Its words are the app's own, read from the bundle (args are keys): Add a program's services tip. */
function Localised({ label, content }: { readonly label: string; readonly content?: ReactNode }) {
  const tr = useStoryText();
  return <InfoTip label={tr(label)} content={typeof content === 'string' ? tr(content) : content} />;
}

/**
 * An info tip (D-368): a 36px round icon — under the 48px floor on purpose,
 * because it explains and never acts — that opens a popover with 20px of
 * padding. Put it beside the heading or name it explains. See Foundations ›
 * Actions for the rule on small targets.
 */
const meta = {
  title: 'Components/Actions/InfoTip',
  tags: ['autodocs'],
  component: InfoTip,
  args: {
    label: 'join.program.services.more',
    content: 'join.program.services.hint',
  },
} satisfies Meta<typeof InfoTip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: (args) => <Localised {...args} /> };

/** Beside a heading, as on Add a program. */
export const BesideAHeading: Story = {
  render: (args) => (
    <HStack gap={1} align="center" wrap="nowrap">
      <Heading level={2}>What does it offer?</Heading>
      <Localised {...args} />
    </HStack>
  ),
};
