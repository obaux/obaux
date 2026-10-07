import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { BringFriend } from '@pam/ui/BringFriend';
import { BigButton, FriendsArt } from '@pam/ui';

/**
 * Bring a friend, as a drawer (D-336): opened from its row on "Your trip is
 * booked". `FriendsArt` across the top, one sentence, then the link and
 * Copy, which says "Copied" for 1.5s. Only after a visit is booked, so the
 * link points to a real slot (D-333).
 */
const meta = {
  title: 'Components/Actions/BringFriend',
  tags: ['autodocs'],
  component: BringFriend,
  args: {
    isOpen: true,
    onOpenChange: () => {},
    label: 'Bring a friend',
    body: 'Going is easier with someone. Send this link so they can come too.',
    link: 'https://web-ten-umber-88.vercel.app/signin/?as=member&program=dummy-place-learning&at=2026-10-08T14%3A00%3A00.000Z',
    linkLabel: 'Link to send',
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
  },
  render: function Render(args) {
    const [isOpen, setOpen] = useState(args.isOpen);
    return (
      <>
        <BigButton label="Open the drawer" onPress={() => setOpen(true)} />
        <BringFriend {...args} isOpen={isOpen} onOpenChange={setOpen} />
      </>
    );
  },
} satisfies Meta<typeof BringFriend>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Open, as after tapping its row. */
export const Default: Story = {};

/** In Spanish. */
export const Spanish: Story = {
  args: {
    label: 'Traer a alguien',
    body: 'Ir es más fácil con alguien. Envíe este enlace para que también venga.',
    linkLabel: 'Enlace para enviar',
    copyLabel: 'Copiar',
    copiedLabel: 'Copiado',
  },
};

/** The illustration on its own. */
export const Illustration: StoryObj = { render: () => <FriendsArt size={240} /> };
