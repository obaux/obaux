import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { BringFriend } from '@pam/ui/BringFriend';
import { BigButton } from '@pam/ui';
import { FRIEND_BANNER, FRIEND_BANNER_SRCSET } from '@/lib/friendBanner';
import { useStoryText } from '../support/useStoryText';

/**
 * Bring a friend, as a drawer (D-336): opened from its row on "Your trip is
 * booked". Will's banner across the top (D-337), one sentence, then the link and
 * Copy. Opening it copies the link and says "Link copied" over the field for
 * 3s (D-337); a green Close link at the top right (and the band across the top) closes it (PamSheet, 17 October). Only after a visit is booked, so the
 * link points to a real slot (D-333).
 */
const meta = {
  title: 'Components/Actions/BringFriend',
  tags: ['autodocs'],
  component: BringFriend,
  args: {
    isOpen: true,
    onOpenChange: () => {},
    // The app's own words, read from the bundle by `render` (they follow the Language toolbar).
    label: 'friend.label',
    body: 'friend.body',
    link: 'https://web-ten-umber-88.vercel.app/signin/?as=member&program=dummy-place-learning&at=2026-10-08T14%3A00%3A00.000Z',
    linkLabel: 'friend.link',
    copyLabel: 'friend.copy',
    copiedLabel: 'friend.copied',
    closeLabel: 'friend.close',
    shareLabel: 'friend.share',
    shareText:
      'friend.share.message?place=Example%20Learning%20Center&when=Friday%2C%20October%209%2C%2010%3A00%20AM&link=https%3A%2F%2Fweb-ten-umber-88.vercel.app%2Fsignin%2F',
    heroSrc: FRIEND_BANNER,
    heroSrcSet: FRIEND_BANNER_SRCSET,
  },
  render: function Render(args) {
    const [isOpen, setOpen] = useState(args.isOpen);
    const tr = useStoryText();
    const plain = useStoryText({ plain: true });
    return (
      <>
        <BigButton label="Open the drawer" onPress={() => setOpen(true)} />
        <BringFriend
          {...args}
          label={tr(args.label)}
          body={tr(args.body)}
          linkLabel={tr(args.linkLabel)}
          copyLabel={tr(args.copyLabel)}
          copiedLabel={tr(args.copiedLabel)}
          closeLabel={tr(args.closeLabel)}
          {...(args.shareLabel ? { shareLabel: String(tr(args.shareLabel)) } : {})}
          {...(args.shareText ? { shareText: String(plain(args.shareText)) } : {})}
          isOpen={isOpen}
          onOpenChange={setOpen}
        />
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

/** In Spanish: a stand-in drawing of the words (not the bundle's; use the Language toolbar for the real ones). */
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
