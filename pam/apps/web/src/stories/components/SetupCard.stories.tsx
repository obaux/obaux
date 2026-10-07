import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import { SetupCard } from '@pam/ui/SetupCard';

/**
 * One thing to set up, on a program lead's Home (D-352): the place card's
 * frame — picture, bold title, one sentence — with the whole card the link.
 * Use a stack of them for a short list of first steps; take a card away
 * once its step is done.
 */
const meta = {
  title: 'Components/Cards/SetupCard',
  tags: ['autodocs'],
  component: SetupCard,
  args: {
    kind: 'program',
    title: 'Add your program',
    body: 'Say what you offer and where. Pam checks it before members see it.',
    href: '/programs/new/',
  },
} satisfies Meta<typeof SetupCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Program: Story = {};
export const Photo: Story = {
  args: {
    kind: 'photo',
    title: 'Add your photo',
    body: 'A friendly face helps people feel welcome before they walk in.',
    href: '/profile/',
  },
};
export const Calendar: Story = {
  args: {
    kind: 'calendar',
    title: 'See who is coming in',
    body: 'When members plan a trip to your program, you will see them here and check them in.',
    href: '/home/calendar/',
  },
};

/**
 * Being worked on (D-384): the card works, and only the picture shimmers —
 * a program Pam is checking.
 */
export const Processing: Story = {
  args: {
    kind: 'review',
    title: 'Your program is in review',
    body: 'Pam checks it in 1–2 days. See where it is.',
    href: '/program/',
    loading: 'processing',
  },
};

/** Loading (D-384): the card's shape, animated, until what goes in it arrives. */
export const Loading: Story = { args: { loading: 'skeleton' } };

/** The three together, as a new lead's Home shows them. */
export const AllThree: Story = {
  render: () => (
    <VStack gap={3}>
      <SetupCard {...Program.args!} {...meta.args} />
      <SetupCard {...meta.args} {...Photo.args!} />
      <SetupCard {...meta.args} {...Calendar.args!} />
    </VStack>
  ),
};
