import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { BookmarkIcon, Page } from '@pam/ui';
import { ConfirmTip } from '@pam/ui/ConfirmTip';
import { roundAction } from '@pam/ui/roundAction';
import { useStoryText } from '../support/useStoryText';

/**
 * A small word by a button that says what the tap just did (Will, 11 October: "when I save a place it should show a
 * tooltip saying saved"). Tap the bookmark: **Saved** appears by it, stays about two seconds, and fades. Tapping again
 * takes the place off and says nothing. Nothing has to be tapped to dismiss it; it never takes focus or a tap.
 *
 * It is said to a screen reader too, politely, through a live region that is already in the page. The only movement
 * is the fade; with "reduce motion" on it simply goes.
 *
 * **When to use it:** a quiet success the screen otherwise shows only by a changed icon (Save, in the place bar and on
 * every place card). **Not for** an error (`CompactNotice`, `Notice`) or anything that must be read before going on.
 */
function SaveButton({ align }: { readonly align: 'end' | 'center' }) {
  const tr = useStoryText();
  const [saved, setSaved] = useState(false);
  const [taps, setTaps] = useState(0);
  return (
    <HStack gap={3} align="center" justify={align === 'end' ? 'end' : 'center'}>
      <Text type="supporting">{tr('place.save')}</Text>
      <ConfirmTip text={tr('places.saved') ?? ''} trigger={taps} align={align}>
        <IconButton
          label={saved ? (tr('places.saved') ?? '') : (tr('place.save') ?? '')}
          variant="ghost"
          aria-pressed={saved}
          onClick={() => {
            if (!saved) setTaps((n) => n + 1);
            setSaved(!saved);
          }}
          icon={<BookmarkIcon width={22} height={22} aria-hidden isFilled={saved} />}
          xstyle={roundAction.plain}
        />
      </ConfirmTip>
    </HStack>
  );
}

const meta = {
  title: 'Components/Feedback/ConfirmTip',
  tags: ['autodocs'],
  component: ConfirmTip,
  decorators: [
    (Story) => (
      <Page gap={4}>
        <Story />
      </Page>
    ),
  ],
} satisfies Meta<typeof ConfirmTip>;

export default meta;
type Story = StoryObj;

/** At the edge of a row, as in the place bar and on a place card: the bubble lines up with the button's end. */
export const AtTheEnd: Story = { render: () => <SaveButton align="end" /> };

/** Centred under the button. */
export const Centred: Story = { render: () => <SaveButton align="center" /> };

export const Arabic: Story = { render: () => <SaveButton align="end" />, globals: { locale: 'ar' } };

export const Spanish: Story = { render: () => <SaveButton align="end" />, globals: { locale: 'es' } };
