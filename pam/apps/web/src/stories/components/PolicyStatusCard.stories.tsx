import type { Meta, StoryObj } from '@storybook/nextjs';
import { PolicyStatusCard } from '@pam/ui/PolicyStatusCard';

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
