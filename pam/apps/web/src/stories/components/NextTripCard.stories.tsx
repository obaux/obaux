import type { Meta, StoryObj } from '@storybook/nextjs';
import { EducationIcon, WorkforceIcon } from '@pam/ui';
import { NextTripCard } from '@pam/ui/NextTripCard';

/** A member's next visit, on Explore (D-265). No program name — the kind, the day and the time. */
const meta = {
  title: 'Components/Cards/NextTripCard',
  tags: ['autodocs'],
  component: NextTripCard,
  args: {
    categoryLabel: 'School and training',
    categoryIcon: <EducationIcon width={20} height={20} aria-hidden />,
    art: <EducationIcon width={44} height={44} aria-hidden />,
    title: 'Your next visit',
    when: 'Tue, Oct 7 · 10:00 AM',
    href: '/trips/',
    label: 'Your next visit: School and training, Tue, Oct 7 · 10:00 AM. See your trips.',
  },
} satisfies Meta<typeof NextTripCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Work: Story = {
  args: {
    categoryLabel: 'Work and money',
    categoryIcon: <WorkforceIcon width={20} height={20} aria-hidden />,
    art: <WorkforceIcon width={44} height={44} aria-hidden />,
    when: 'Fri, Oct 10 · 1:00 PM',
  },
};
