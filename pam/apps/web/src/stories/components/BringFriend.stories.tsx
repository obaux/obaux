import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { BringFriend } from '@pam/ui/BringFriend';
import { BigButton } from '@pam/ui';
import { FRIEND_BANNER, FRIEND_BANNER_SRCSET } from '@/lib/friendBanner';

/**
 * Bring a friend, as a drawer (D-336): opened from its row on "Your trip is
 * booked". Will's banner across the top (D-337), one sentence, then the link and
 * Copy. Opening it copies the link and says "Link copied" over the field for
 * 3s (D-337); an × at the top right closes it. Only after a visit is booked, so the
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
    copiedLabel: 'Link copied',
    closeLabel: 'Close',
    shareLabel: 'Send to a friend',
    shareText: "I'm going to Example Learning Center on Friday, October 9, 10:00 AM. Come with me: https://web-ten-umber-88.vercel.app/signin/",
    heroSrc: FRIEND_BANNER,
    heroSrcSet: FRIEND_BANNER_SRCSET,
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

/** Just opened from its row, which copied the link: "Link copied" over the field. */
export const JustCopied: Story = { args: { copiedAt: 1 } };

/** In Spanish. */
export const Spanish: Story = {
  args: {
    label: 'Traer a alguien',
    body: 'Ir es más fácil con alguien. Envíe este enlace para que también venga.',
    linkLabel: 'Enlace para enviar',
    copyLabel: 'Copiar',
    copiedLabel: 'Enlace copiado',
    closeLabel: 'Cerrar',
    shareLabel: 'Enviar a alguien',
  },
};

/** Without the banner (it could not load): the drawer still reads. */
export const NoBanner: Story = { args: { heroSrc: null, heroSrcSet: null } };
