import type { Meta, StoryObj } from '@storybook/nextjs';
import { HStack } from '@astryxdesign/core/HStack';
import { StaffBadge } from '@pam/ui/StaffBadge';

/**
 * Who you'll meet at a program (D-335): their face at the right of a booked
 * place's open/closed row. A tap opens a small popover with their name and
 * title. Their photo when Pam has one, initials otherwise.
 */
const meta = {
  title: 'Components/Feedback/StaffBadge',
  tags: ['autodocs'],
  component: StaffBadge,
  decorators: [
    (Story) => (
      <HStack justify="end">
        <Story />
      </HStack>
    ),
  ],
  args: {
    name: 'Sandra',
    title: 'Program lead',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=320&h=320&fit=crop&crop=faces&q=70',
    label: "Sandra, Program lead. Who you'll meet",
  },
} satisfies Meta<typeof StaffBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** No photo: their initials. */
export const Initials: Story = { args: { name: 'Renee', photoUrl: null, label: "Renee, Program lead. Who you'll meet" } };
