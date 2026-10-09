import type { Meta, StoryObj } from '@storybook/nextjs';
import { Icon } from '@astryxdesign/core/Icon';
import { PolicyStatusCard, StatusCard } from '@pam/ui/PolicyStatusCard';

/** Near the top of a place a member has a visit at: policies to sign, or all signed (D-271). */
const meta = {
  title: 'Components/Cards/PolicyStatusCard',
  tags: ['autodocs'],
  component: PolicyStatusCard,
  args: {
    isDone: false,
    title: 'Policies to sign',
    body: 'Sign before your visit',
    label: 'Policies to sign. Sign before your visit',
    href: '/place/policies/?id=dummy-place-learning',
  },
} satisfies Meta<typeof PolicyStatusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Signed: Story = {
  args: {
    isDone: true,
    title: 'Policies signed',
    body: 'All signatures complete',
    label: 'Policies signed. All signatures complete',
  },
};

/** The compact card pinned above a conversation with a program: the booked visit (D-276, D-400). */
export const VisitCompact: Story = {
  render: () => (
    <StatusCard
      tone="green"
      icon={<Icon icon="calendar" size="sm" />}
      title="Saturday, October 10"
      body="10:00 AM · Visit booked"
      href="/place/?id=dummy-place-learning"
      label="Your visit, Saturday, October 10 at 10:00 AM"
      isCompact
    />
  ),
};
