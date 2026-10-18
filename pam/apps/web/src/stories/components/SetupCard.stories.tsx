import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { VStack } from '@astryxdesign/core/VStack';
import { SetupCard } from '@pam/ui/SetupCard';
import { useStoryText } from '../support/useStoryText';

/** Its words are the app's own, read from the bundle (args are keys), so they follow the Language toolbar and cannot drift. */
function Localised(props: ComponentProps<typeof SetupCard>) {
  const tr = useStoryText();
  // body is optional since D-608 (the photo and calendar cards have none), so it is passed only when a story has one.
  return <SetupCard {...props} title={tr(props.title)} {...(props.body ? { body: tr(props.body) } : {})} />;
}

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
  render: (args) => <Localised {...args} />,
  args: {
    kind: 'program',
    title: 'home.setup.program.title',
    href: '/programs/new/',
  },
} satisfies Meta<typeof SetupCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Program: Story = { args: { body: 'home.setup.program.body' } };
export const Photo: Story = {
  args: {
    kind: 'photo',
    title: 'home.setup.photo.title',
    href: '/profile/',
  },
};
export const Calendar: Story = {
  args: {
    kind: 'calendar',
    title: 'home.setup.calendar.title',
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
    title: 'home.setup.review.title.review',
    body: 'home.setup.review.body.review',
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
      <Localised {...Program.args!} {...meta.args} />
      <Localised {...meta.args} {...Photo.args!} />
      <Localised {...meta.args} {...Calendar.args!} />
    </VStack>
  ),
};
