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
 * Pam's one drawer (Will, 17 October, card a93). A 48px band across the top closes it on a tap; the title starts below it, with room;
 * one green link at the end of the title's row closes it too. Swipe and Escape still work. The word depends on what the drawer is for:
 *
 * - **Close** (`kind="read"`): a drawer you only read, or whose rows take you somewhere else. A week of hours, Bring a friend, who to
 *   message, the map apps, a policy, What you can see, the signature sheet (leaving it signs nothing).
 * - **Done** (`kind="pick"`): a drawer where you choose or set something and then leave it. The area.
 *
 * The words are `trips.confirm.close` and `action.done`; the caller passes them, so they follow the person's language.
 */
const meta = {
  title: 'Components/Overlays/PamSheet',
  tags: ['autodocs'],
  component: PamSheet,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PamSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ kind, titleKey, long = false }: { readonly kind: 'read' | 'pick'; readonly titleKey: string; readonly long?: boolean }) {
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
        actionLabel={t(kind === 'pick' ? 'action.done' : 'trips.confirm.close')}
        height={long ? 'tall' : 'hug'}
      >
        <VStack gap={2} xstyle={styles.body}>
          <Text>{t('place.hours')}</Text>
        </VStack>
      </PamSheet>
    </VStack>
  );
}

/** A drawer you read: "Close". */
export const Read: Story = {
  args: { isOpen: true, onOpenChange: () => {}, label: '', kind: 'read', actionLabel: '', children: null },
  render: () => <Demo kind="read" titleKey="place.hours" />,
};

/** A drawer where you pick or set something: "Done". */
export const Pick: Story = {
  args: { isOpen: true, onOpenChange: () => {}, label: '', kind: 'pick', actionLabel: '', children: null },
  render: () => <Demo kind="pick" titleKey="places.area.title" />,
};

/** At 320, in Arabic: the title and the link share a row, the link at the end. */
export const NarrowArabic: Story = {
  args: { isOpen: true, onOpenChange: () => {}, label: '', kind: 'pick', actionLabel: '', children: null },
  globals: { locale: 'ar', viewport: { value: 'narrow320', isRotated: false } },
  render: () => <Demo kind="pick" titleKey="places.area.title" />,
};
