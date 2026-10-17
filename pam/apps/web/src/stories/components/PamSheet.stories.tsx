import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { PamSheet } from '@pam/ui/PamSheet';
import { BigButton } from '@pam/ui';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useStoryText } from '../support/useStoryText';

const styles = stylex.create({
  page: { padding: '16px' },
  body: { paddingInline: '20px', paddingBlockEnd: '24px' },
});

/**
 * Pam's one drawer (Will, card a93; revised on a97). A 48px band across the top closes it on a tap; the title starts below it, with room;
 * one round button in the top corner (the left corner in Arabic) closes it too. Swipe and Escape still work. The icon is a rule about
 * what the drawer is for:
 *
 * - **Checkmark, "Done"** (`kind="review"`): you pick in the drawer, or only read it. Location, Opening hours, What you can see,
 *   New message, Open in….
 * - **X, "Close"** (`kind="act"`): something is done inside the drawer, so a checkmark would say it had been confirmed. Bring a
 *   friend (you copy the link), Sign a policy.
 *
 * The words are `action.done` and `trips.confirm.close`; the caller passes them, so they follow the person's language.
 */
const meta = {
  title: 'Components/Overlays/PamSheet',
  tags: ['autodocs'],
  component: PamSheet,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PamSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ kind, titleKey, long = false }: { readonly kind: 'review' | 'act'; readonly titleKey: string; readonly long?: boolean }) {
  const t = useStoryText();
  const [isOpen, setOpen] = useState(true);
  return (
    <VStack gap={3} xstyle={styles.page}>
      <BigButton label={t(titleKey)} onPress={() => setOpen(true)} />
      <PamSheet
        isOpen={isOpen}
        onOpenChange={setOpen}
        label={t(titleKey)}
        kind={kind}
        actionLabel={t(kind === 'review' ? 'action.done' : 'trips.confirm.close')}
        height={long ? 'tall' : 'hug'}
      >
        <VStack gap={2} xstyle={styles.body}>
          <Text>{t('place.hours')}</Text>
        </VStack>
      </PamSheet>
    </VStack>
  );
}

/** A drawer you read: a checkmark, "Done". */
export const Review: Story = {
  args: { isOpen: true, onOpenChange: () => {}, label: '', kind: 'review', actionLabel: '', children: null },
  render: () => <Demo kind="review" titleKey="place.hours" />,
};

/** A drawer where something is done inside it: an X, "Close". */
export const Act: Story = {
  args: { isOpen: true, onOpenChange: () => {}, label: '', kind: 'act', actionLabel: '', children: null },
  render: () => <Demo kind="act" titleKey="friend.label" />,
};

/** At 320, in Arabic: the button is in the top-left corner. */
export const NarrowArabic: Story = {
  args: { isOpen: true, onOpenChange: () => {}, label: '', kind: 'review', actionLabel: '', children: null },
  globals: { locale: 'ar', viewport: { value: 'narrow320', isRotated: false } },
  render: () => <Demo kind="review" titleKey="places.area.title" />,
};
