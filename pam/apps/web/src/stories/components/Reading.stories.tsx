import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import { CheckIcon, EyeIcon, PeopleIcon } from '@pam/ui';
import { CopyButton } from '@pam/ui/CopyButton';
import { FactGroup, FactRow, GuideCard, ReadCard, SectionHeading, SummaryCard } from '@pam/ui/Reading';

/**
 * Pieces for reading something long and important (D-416, D-417): who "your
 * guide" is (small, the icon beside the title), the short version, cards of
 * ticked and crossed rows, and flat section headings with a bare icon for the
 * policy pages. Meaning never rests on the picture or the colour alone: each
 * row says it in words, and each icon is hidden from a screen reader.
 */
const meta = {
  title: 'Components/Layout/Reading cards',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Guide: Story = {
  render: () => (
    <GuideCard
      title="Your guide"
      body="Your guide is the person who invited you, or a staff member responsible for guiding you."
      icon={<PeopleIcon />}
    />
  ),
};

export const Summary: Story = {
  render: () => (
    <SummaryCard
      title="The short version"
      lines={[
        { text: 'Your guide can see your plans, your progress and who you connect with.', mark: 'yes', icon: <EyeIcon /> },
        { text: 'Your guide cannot read your messages to other people.', mark: 'no' },
      ]}
    />
  ),
};

export const CardOfRows: Story = {
  render: () => (
    <ReadCard title="Your guide can see" icon={<EyeIcon />}>
      <FactGroup title="Your progress">
        <FactRow lead="Your points, your level and your badges" mark="yes" />
        <FactRow lead="The last day you used Pam." mark="yes" />
        <FactRow lead="When you save a new place — not which one." detail="A program you joined sees this too." mark="yes" />
        <FactRow lead="What you say to someone else" mark="no" />
      </FactGroup>
    </ReadCard>
  ),
};

/** The flat page: a bare icon beside each heading, no card. */
export const FlatSections: Story = {
  render: () => (
    <VStack gap={4}>
      <SectionHeading title="What we keep" icon={<CheckIcon />} />
      <SectionHeading title="Who can see it" icon={<EyeIcon />} />
    </VStack>
  ),
};

/**
 * The copy icon, as it sits top right of a page's header. Tap it: the icon is
 * replaced by a tick and a tooltip under it says "Copied"; after 5 seconds it
 * is a copy icon again. No animation.
 */
export const CopyIcon: Story = {
  render: () => (
    <VStack gap={2} align="end">
      <CopyButton
        text="Copied text"
        label="Copy this page"
        copiedLabel="Copied"
        failedLabel="Could not copy. Press and hold the text to copy it."
      />
    </VStack>
  ),
};
