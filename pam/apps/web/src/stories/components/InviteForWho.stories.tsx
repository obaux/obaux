import type { Meta, StoryObj } from '@storybook/nextjs';
import { InviteForWho } from '../../screens/InviteForWho';

/**
 * Who an invite is for (D-373): first name and mobile number, both required.
 * The number is the only one that can use the link, and how Pam finds the
 * invite when the person signs in without it.
 */
const meta = {
  title: 'Components/Forms/InviteForWho',
  tags: ['autodocs'],
  component: InviteForWho,
  args: { role: 'provider', busy: false, onSubmit: () => {}, onCancel: () => {} },
} satisfies Meta<typeof InviteForWho>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Program: Story = {};
export const Member: Story = { args: { role: 'member' } };
