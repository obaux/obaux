import type { Meta, StoryObj } from '@storybook/nextjs';
import { InviteForWho } from '../../screens/InviteForWho';

/**
 * Who an invite is for (D-373): first name and mobile number, both required.
 * The number is the only one that can use the link, and how Pam finds the
 * invite when the person signs in without it. Staff — a program lead or a case
 * manager — also need an email, which lands on their account when they sign in
 * with that number (D-435); a member is never asked for one.
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
export const CaseManager: Story = { args: { role: 'admin' } };
/** Staff only: the email is not optional, so Create link says what is missing. */
export const StaffNeedsEmail: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Their first name'), 'Bo');
    await userEvent.type(canvas.getByLabelText('Their mobile number'), '2155550112');
    await userEvent.click(canvas.getByRole('button', { name: 'Create link' }));
  },
};
export const Member: Story = { args: { role: 'member' } };
