import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HelpIcon, NotificationBell, Page, PlusIcon } from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';

/** Saved's People / Programs switch, with its own state so it can be tried. */
function PeopleProgramsSwitch() {
  const [pane, setPane] = useState('people');
  return (
    <SegmentedControl label="Saved" value={pane} onChange={setPane} size="md">
      <SegmentedControlItem value="people" label="People" />
      <SegmentedControlItem value="programs" label="Programs" />
    </SegmentedControl>
  );
}

/**
 * The title of a tab screen (Home, Saved, Messages, Profile): large at the top,
 * shrinking into a sticky bar as the page scrolls. The bar keeps the screen's
 * actions — the bell and Help — in reach at every scroll position. Use it on
 * top-level tab screens; nested screens use SubPage instead.
 */
const meta = {
  title: 'Components/Navigation/LargeTitleHeader',
  tags: ['autodocs'],
  component: LargeTitleHeader,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
        <VStack gap={3}>
          <Text>Scroll down to see the title move into the bar.</Text>
          <Text type="supporting">Example Learning Center — GED classes on Tuesday and Thursday mornings.</Text>
          <Text type="supporting">Northside Job Center — resume help, walk in any weekday.</Text>
          <Text type="supporting">Riverside Family Services — food pantry open Saturday.</Text>
        </VStack>
      </Page>
    ),
  ],
  args: {
    title: 'Profile',
    isAccessoryInline: false,
  },
  argTypes: {
    actions: { control: false },
    titleAccessory: { control: false },
  },
} satisfies Meta<typeof LargeTitleHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The bell and Help at the right of the bar, as on every tab screen. */
export const WithActions: Story = {
  args: {
    title: 'Home',
    actions: (
      <>
        <NotificationBell href="/notifications/" label="Notifications" unreadCount={2} unreadLabel="Notifications, 2 new" appearance="round" />
        <IconButton
          label="Help"
          variant="ghost"
          href="/help/"
          icon={
            <HStack>
              <HelpIcon width={24} height={24} aria-hidden />
            </HStack>
          }
        />
      </>
    ),
  },
};

/** A switch on the title's line, at its end — a case manager's Saved. */
export const WithTitleAccessory: Story = {
  args: {
    title: 'Saved',
    titleAccessory: <PeopleProgramsSwitch />,
    actions: (
      <NotificationBell href="/notifications/" label="Notifications" unreadCount={0} appearance="round" />
    ),
  },
};

/** The accessory right after the words, read as one phrase. */
export const InlineAccessory: Story = {
  args: {
    title: 'Coming in',
    titleAccessory: <Text type="supporting">this week</Text>,
    isAccessoryInline: true,
    actions: (
      <IconButton
        label="New trip"
        variant="ghost"
        href="/trips/new/"
        icon={
          <HStack>
            <PlusIcon width={26} height={26} aria-hidden />
          </HStack>
        }
      />
    ),
  },
};
