import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { CheckIcon, EyeIcon, PeopleIcon } from '@pam/ui';
import { CopyButton } from '@pam/ui/CopyButton';
import { FactGroup, FactRow, GuideCard, ReadCard, SummaryCard } from '@pam/ui/Reading';

/**
 * Cards for reading something long and important (D-416). Every one takes
 * `decor` — "icons" or "plain" — so the same content can be judged both ways.
 * Meaning never rests on the picture or the colour alone: each row says it in
 * words, and each icon is hidden from a screen reader.
 */
const meta = {
  title: 'Components/Layout/Reading cards',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const both = (render: (decor: 'icons' | 'plain') => React.ReactNode): Story['render'] => () => (
  <VStack gap={4}>
    {(['icons', 'plain'] as const).map((decor) => (
      <VStack key={decor} gap={1}>
        <Text type="supporting">{decor}</Text>
        {render(decor)}
      </VStack>
    ))}
  </VStack>
);

export const Guide: Story = {
  render: both((decor) => (
    <GuideCard
      title="Your guide"
      body="Your guide is the person who invited you, or a staff member responsible for guiding you."
      decor={decor}
      icon={<PeopleIcon />}
    />
  )),
};

export const Summary: Story = {
  render: both((decor) => (
    <SummaryCard
      title="The short version"
      decor={decor}
      lines={[
        { text: 'Your guide can see your plans, your progress and who you connect with.', mark: 'yes', icon: <EyeIcon /> },
        { text: 'Your guide cannot read your messages to other people.', mark: 'no' },
      ]}
    />
  )),
};

export const CardWithCopy: Story = {
  render: both((decor) => (
    <ReadCard
      title="What we keep"
      decor={decor}
      icon={<CheckIcon />}
      copy={{
        text: 'What we keep\n\nYour first name, your phone number, and the language you pick.',
        label: 'Copy this section',
        copiedLabel: 'Copied',
        failedLabel: 'Could not copy. Press and hold the text to copy it.',
      }}
    >
      <FactGroup title="Your plans">
        <FactRow lead="What you said you want to work on" mark="yes" decor={decor} />
        <FactRow lead="The last day you used Pam." detail="A program you joined sees this too." mark="yes" decor={decor} />
        <FactRow lead="What you say to someone else" mark="no" decor={decor} />
      </FactGroup>
    </ReadCard>
  )),
};

/** Tap it: the icon becomes a tick and a pill under it says "Copied" for 3 seconds. */
export const CopyIcon: Story = {
  render: () => (
    <VStack gap={2} align="end">
      <CopyButton
        text="Copied text"
        label="Copy this section"
        copiedLabel="Copied"
        failedLabel="Could not copy. Press and hold the text to copy it."
      />
    </VStack>
  ),
};
