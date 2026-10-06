import type { Meta, StoryObj } from '@storybook/nextjs';
import { BringFriend } from '@pam/ui/BringFriend';

/**
 * Bring a friend, folded under the trip on the booked screen (D-333): a row
 * that opens to one sentence and the link with Copy. Only after a visit is
 * booked, so the link points to a real slot. Copy says "Copied" for 1.5s.
 */
const meta = {
  title: 'Components/Actions/BringFriend',
  tags: ['autodocs'],
  component: BringFriend,
  args: {
    label: 'Bring a friend',
    body: 'Going is easier with someone. Send this link so they can come too.',
    link: 'https://web-ten-umber-88.vercel.app/signin/?as=member&program=dummy-place-learning&at=2026-10-08T14%3A00%3A00.000Z',
    linkLabel: 'Link to send',
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
    defaultIsOpen: false,
  },
} satisfies Meta<typeof BringFriend>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed, as it first appears. */
export const Default: Story = {};

/** Open: the sentence, the link and Copy. */
export const Open: Story = { args: { defaultIsOpen: true } };

/** In Spanish. */
export const Spanish: Story = {
  args: {
    defaultIsOpen: true,
    label: 'Traer a alguien',
    body: 'Ir es más fácil con alguien. Envíe este enlace para que también venga.',
    linkLabel: 'Enlace para enviar',
    copyLabel: 'Copiar',
    copiedLabel: 'Copiado',
  },
};
