import type { Meta, StoryObj } from '@storybook/nextjs';
import { CategoryArt } from '@pam/ui/CategoryArt';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { MapDrawer } from '@pam/ui/MapDrawer';
import { TripCard } from '@pam/ui/TripCard';

/**
 * A drawer that sits over the Trips map, above the tab bar, with three resting
 * heights: `dock` (just the title, so the map has the screen), `half` (where it
 * opens: map above, list below) and `full` (most of the screen, leaving room for
 * the search bar). Drag the handle, or tap it to step up a height. Use it for a
 * list that belongs to a map.
 */
const TRIPS = [
  (
    <TripCard
      key="learning"
      placeName="Example Learning Center"
      when="Tuesday, Oct 7 · 10:00 AM"
      href="/place/?id=learning"
      art={<CategoryArt category="education" size="fill" />}
      withName="Sandra"
      policies={{ label: 'Signatures needed', isDone: false }}
      label="Example Learning Center, Tuesday, Oct 7 · 10:00 AM, with Sandra"
    />
  ),
  (
    <TripCard
      key="jobs"
      placeName="Example Job Center"
      when="Thursday, Oct 9 · 1:30 PM"
      href="/place/?id=jobs"
      art={<CategoryArt category="workforce" size="fill" />}
      withName="Jordan"
      policies={{ label: 'Policies signed', isDone: true }}
      label="Example Job Center, Thursday, Oct 9 · 1:30 PM, with Jordan"
    />
  ),
  (
    <TripCard
      key="family"
      placeName="Example Family Resource Center"
      when="Monday, Oct 13 · 9:00 AM"
      href="/place/?id=family"
      art={<CategoryArt category="family_services" size="fill" />}
      label="Example Family Resource Center, Monday, Oct 13 · 9:00 AM"
    />
  ),
  (
    <TripCard
      key="learning-2"
      placeName="Example Learning Center"
      when="Wednesday, Oct 15 · 3:00 PM"
      href="/place/?id=learning"
      art={<CategoryArt category="education" size="fill" />}
      withName="Marcus"
      label="Example Learning Center, Wednesday, Oct 15 · 3:00 PM, with Marcus"
    />
  ),
];

const meta = {
  title: 'Components/Places/MapDrawer',
  tags: ['autodocs'],
  component: MapDrawer,
  // The drawer is fixed to the bottom of the screen, so each story gets its
  // own frame in the docs page rather than stacking on top of the others.
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, height: '640px' } } },
  args: {
    initialStop: 'half',
    bottomOffset: 66,
    topOffset: 84,
    expandLabel: 'Show more of your trips',
    collapseLabel: 'Show the map',
    header: (
      <VStack gap={0.5}>
        <Heading level={1}>Trips</Heading>
        <Text type="supporting">4 visits</Text>
      </VStack>
    ),
    children: <VStack gap={3}>{TRIPS}</VStack>,
  },
  argTypes: {
    initialStop: { control: 'inline-radio', options: ['dock', 'half', 'full'] },
    header: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof MapDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opened halfway: the map above, enough of the list to see it goes on. */
export const Default: Story = {};

/** Docked: only the title and its count, so the map has the screen. */
export const Docked: Story = { args: { initialStop: 'dock' } };

/** Full height: the list fills the screen below the search bar. */
export const Full: Story = { args: { initialStop: 'full' } };

/** One trip, with a plain note instead of cards. */
export const ShortList: Story = {
  args: {
    header: (
      <VStack gap={0.5}>
        <Heading level={1}>Trips</Heading>
        <Text type="supporting">1 visit</Text>
      </VStack>
    ),
    children: (
      <VStack gap={3}>
        {TRIPS[0]}
        <Text type="supporting">Questions about a visit? Call Example Learning Center at (555) 010-0142.</Text>
      </VStack>
    ),
  },
};
