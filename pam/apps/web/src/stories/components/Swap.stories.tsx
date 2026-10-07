import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { AutoHeight, TextSwap } from '@pam/ui';

/**
 * `TextSwap` reveals new words through a left-to-right mask whenever its
 * `token` changes (the token says what the words are about, such as a
 * service's id), as if they were written over the old ones; it does not play
 * on first paint. `AutoHeight` eases a box to its content's height, so what is
 * below slides instead of jumping. Both stop under `prefers-reduced-motion`.
 * They are used on a place's About and Address cards when the member picks a
 * service.
 *
 * Change the `token` control to see the reveal; `text` overrides the words.
 */
const SERVICES = {
  tutoring: 'Free one-on-one tutoring in reading and math, weekday afternoons.',
  ged: 'Classes to get ready for the GED test, with practice tests and a study coach. Evenings, twice a week.',
  computer: 'Drop-in computer lab with help writing a resume and applying for jobs online.',
} as const;
type ServiceId = keyof typeof SERVICES;

const SHORT = 'Walk-ins welcome. Call (555) 010-0142 with questions.';
const LONG =
  'Walk-ins welcome Monday to Friday, 9:00 AM to 5:00 PM. Bring a photo ID if you have one; if not, a staff member will help you get started. ' +
  'The center is two blocks from the bus stop on Main Street, with parking behind the building. Call (555) 010-0142 with questions, ' +
  'or ask for Jordan at the front desk.';

interface SwapArgs {
  /** What the words are about. Changing it plays the reveal. */
  readonly token: ServiceId;
  /** Words to show; leave empty for the service's own description. */
  readonly text: string;
  /** AutoHeight: show the long paragraph instead of the short one. */
  readonly long: boolean;
}

const meta = {
  title: 'Foundations/Motion/Text swap and auto height',
  tags: ['autodocs'],
  // The args are the demo's, not TextSwap's own props; `render` maps them.
  component: TextSwap as unknown as ComponentType<SwapArgs>,
  args: { token: 'tutoring', text: '', long: false },
  argTypes: {
    token: { control: 'inline-radio', options: Object.keys(SERVICES) },
    text: { control: 'text' },
    long: { control: 'boolean' },
  },
  render: ({ token, text }) => (
    <Card padding={4}>
      <VStack gap={2}>
        <Heading level={2}>About</Heading>
        <TextSwap token={token}>
          <Text>{text || SERVICES[token]}</Text>
        </TextSwap>
      </VStack>
    </Card>
  ),
} satisfies Meta<SwapArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The About card's words; change `token` to reveal another service's. */
export const Default: Story = {};

/** A longer description, to see the mask cross several lines. */
export const LongerWords: Story = { args: { token: 'ged' } };

/** Toggle `long`: the card eases to its new height instead of jumping. */
export const AutoHeightBox: Story = {
  render: ({ long }) => (
    <VStack gap={3}>
      <Card padding={4}>
        <VStack gap={2}>
          <Heading level={2}>Address</Heading>
          <AutoHeight>
            <Text>{long ? LONG : SHORT}</Text>
          </AutoHeight>
        </VStack>
      </Card>
      <Text type="supporting">This line slides down as the card grows.</Text>
    </VStack>
  ),
};

/** Both together, as on a place: picking a service rewrites and resizes the card. */
export const AboutCard: Story = {
  args: { token: 'computer' },
  render: ({ token, text }) => (
    <Card padding={4}>
      <VStack gap={2}>
        <Heading level={2}>About</Heading>
        <AutoHeight>
          <TextSwap token={token}>
            <Text>{text || SERVICES[token]}</Text>
          </TextSwap>
        </AutoHeight>
      </VStack>
    </Card>
  ),
};
