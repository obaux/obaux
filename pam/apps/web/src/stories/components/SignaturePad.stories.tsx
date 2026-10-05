import type { Meta, StoryObj } from '@storybook/nextjs';
import { SignaturePad } from '@pam/ui/SignaturePad';

/**
 * The box a member signs a program's policy in, with a finger (D-270). White
 * paper with dark ink in both themes, so a saved signature reads anywhere.
 * Draw in it with the mouse here.
 */
const meta = {
  title: 'Components/SignaturePad',
  component: SignaturePad,
  args: {
    label: 'Signature box. Draw your signature here.',
    placeholder: 'Sign here',
  },
} satisfies Meta<typeof SignaturePad>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
