import type { Meta, StoryObj } from '@storybook/nextjs';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ConnectionsIcon, Page, PeopleIcon, PlusIcon } from '@pam/ui';
import { FloatingAction } from '@pam/ui/FloatingAction';

/**
 * One row that floats just above the bottom tab bar — icon, words, chevron —
 * so a screen's main way onward stays in reach while the list scrolls ("Invite
 * someone" on a case manager's Home, "Your people" on a member's Messages). It
 * is a real link, and draws a spacer so the end of the list scrolls clear.
 */
const meta = {
  title: 'Components/Actions/FloatingAction',
  tags: ['autodocs'],
  component: FloatingAction,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <VStack gap={3}>
          <Text>Today</Text>
          <Text type="supporting">10:00 AM — Jordan, intake at Example Learning Center</Text>
          <Text type="supporting">1:30 PM — Sam, resume help at Northside Job Center</Text>
          <Text type="supporting">3:00 PM — Alex, check-in call</Text>
        </VStack>
        <Story />
      </Page>
    ),
  ],
  args: {
    label: 'Invite someone',
    href: '/invite/',
    icon: <PeopleIcon width={26} height={26} aria-hidden />,
  },
  argTypes: {
    icon: { control: false },
  },
} satisfies Meta<typeof FloatingAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A second, quieter line under the label. */
export const WithDescription: Story = {
  args: {
    label: 'Your people',
    description: 'People willing to help',
    href: '/connections/',
    icon: <ConnectionsIcon width={26} height={26} aria-hidden />,
  },
};

export const AddAProgram: Story = {
  args: {
    label: 'Add a program',
    description: 'List a place people can go for help',
    href: '/programs/new/',
    icon: <PlusIcon width={26} height={26} aria-hidden />,
  },
};
