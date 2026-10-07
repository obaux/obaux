'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { pam } from './tokens.stylex.js';
import { FriendsArt } from './FriendsArt.js';
import { TextField } from './TextField.js';

/**
 * Bring a friend, as a drawer (D-336, Will, 7 October: "use the item
 * component like we do for hours, where it's a chevron that opening brings
 * up a drawer … an image illustration … that takes up the hero section of
 * the drawer, and the invitation link and details below it. For a more
 * festive feel").
 *
 * The row that opens it is a `MenuList` item on the booked screen, beside
 * Policies to sign; this is what it opens: `FriendsArt` across the top, the
 * title, one sentence, then the link in a read-only field and Copy, which
 * says "Copied" for 1.5s (D-333). Copy only, everywhere: the native share
 * sheet waits for Will.
 */
export interface BringFriendProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  /** "Bring a friend". */
  readonly label: string;
  /** "Going is easier with someone. Send this link so they can come too." */
  readonly body: string;
  /** The link to send. */
  readonly link: string;
  /** The field's accessible name: "Link to send". */
  readonly linkLabel: string;
  /** "Copy". */
  readonly copyLabel: string;
  /** "Copied". */
  readonly copiedLabel: string;
}

/** How long Copy says "Copied". */
export const COPIED_MS = 1500;

const styles = stylex.create({
  sheet: { width: '100%', paddingInline: '20px', paddingBlockStart: '8px', paddingBlockEnd: '28px' },
  hero: { alignItems: 'center', paddingBlockEnd: '4px' },
  title: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  body: { fontSize: '17px', lineHeight: 1.45, textAlign: 'center', alignSelf: 'center', maxWidth: '320px' },
  field: { flexGrow: 1, minWidth: 0 },
  // As tall as the link field beside it.
  copy: { height: pam['--pam-field-height'], minHeight: pam['--pam-field-height'], flexShrink: 0, borderRadius: '12px' },
});

export function BringFriend({
  isOpen,
  onOpenChange,
  label,
  body,
  link,
  linkLabel,
  copyLabel,
  copiedLabel,
}: BringFriendProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(link);
    } catch {
      // No clipboard: the link is in the field, to copy by hand.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange} label={label} height="hug">
      {isOpen ? (
        <VStack gap={3} xstyle={styles.sheet}>
          <VStack xstyle={styles.hero}>
            <FriendsArt size={168} />
          </VStack>
          <Heading level={2} xstyle={styles.title}>
            {label}
          </Heading>
          <Text xstyle={styles.body}>{body}</Text>
          <HStack gap={2} align="end" wrap="nowrap">
            {/* The link takes all the room Copy leaves it (D-334). */}
            <VStack xstyle={styles.field}>
              <TextField label={linkLabel} isLabelHidden value={link} isReadOnly width="100%" />
            </VStack>
            <Button
              label={copied ? copiedLabel : copyLabel}
              variant="secondary"
              onClick={() => void copy()}
              xstyle={styles.copy}
            />
          </HStack>
        </VStack>
      ) : null}
    </BottomSheet>
  );
}
