'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { pam } from './tokens.stylex.js';
import { TextField } from './TextField.js';

/**
 * The banner across the top is Will's picture (D-337, 7 October: "instead of
 * coming up with an illustration for it, use this banner on top of drawer"),
 * shipped compressed as WebP by `apps/web/scripts/friend-banner.mjs`. If it
 * cannot load (offline, not yet in the build), the drawer simply has no
 * banner rather than a broken image.
 *
 * Opening it copies the link at once (Will, 7 October, D-337: "Clicking
 * bring a friend should automatically copy the link to clipboard and show
 * this overlaid on top of link input field, then disappear after 3
 * seconds. Add an X to close drawer on top right"). The copy happens in the
 * row's own tap (`copyLink`), because Safari only lets a page write to the
 * clipboard inside a tap; the drawer is told it worked through `copiedAt`.
 * Copy is still there to copy it again.
 *
 * Bring a friend, as a drawer (D-336, Will, 7 October: "use the item
 * component like we do for hours, where it's a chevron that opening brings
 * up a drawer … an image illustration … that takes up the hero section of
 * the drawer, and the invitation link and details below it. For a more
 * festive feel").
 *
 * The row that opens it is a `MenuList` item on the booked screen, beside
 * Policies to sign; this is what it opens: the banner across the top, the
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
  /** "Link copied", over the field for 3s. */
  readonly copiedLabel: string;
  /** The × at the top right: "Close". */
  readonly closeLabel: string;
  /**
   * When the opener copied the link (`Date.now()` after `copyLink` said
   * yes): the drawer opens with "Link copied" over the field.
   */
  readonly copiedAt?: number | null;
  /** The banner: the 1200px WebP. */
  readonly heroSrc?: string | null;
  /** The banner's sizes, "…-800.webp 800w, …-1200.webp 1200w". */
  readonly heroSrcSet?: string | null;
}

/** How long "Link copied" stays over the field (D-337). */
export const COPIED_MS = 3000;

/**
 * Copies `text`; true when the clipboard took it. Call it inside a tap: that
 * is the only time Safari allows it.
 */
export async function copyLink(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // No clipboard: the link is in the field, to copy by hand.
    return false;
  }
}

const styles = stylex.create({
  sheet: { width: '100%', paddingInline: '20px', paddingBlockStart: '8px', paddingBlockEnd: '28px' },
  top: { position: 'relative', minHeight: pam['--pam-touch-target-min'] },
  // Full width, the banner's own shape (1608 × 629), corners like a card's.
  hero: {
    display: 'block',
    width: '100%',
    height: 'auto',
    aspectRatio: '1608 / 629',
    objectFit: 'cover',
    borderRadius: '20px',
    backgroundColor: colorVars['--color-background-muted'],
  },
  // The × at the top right, a white circle so it reads on the picture.
  close: {
    position: 'absolute',
    top: '8px',
    insetInlineEnd: '8px',
    width: pam['--pam-touch-target-min'],
    height: pam['--pam-touch-target-min'],
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-body'],
    boxShadow: '0 1px 4px oklch(0 0 0 / 18%)',
  },
  title: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  body: { fontSize: '17px', lineHeight: 1.45, textAlign: 'center', alignSelf: 'center', maxWidth: '320px' },
  field: { flexGrow: 1, minWidth: 0, position: 'relative' },
  // "Link copied", over the field: a dark pill in its middle, fading in.
  copied: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    animationName: stylex.keyframes({ from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'none' } }),
    animationDuration: '160ms',
    animationTimingFunction: 'ease-out',
  },
  pill: {
    paddingInline: '16px',
    paddingBlock: '8px',
    borderRadius: '999px',
    backgroundColor: colorVars['--color-text-primary'],
    color: colorVars['--color-background-body'],
    fontSize: '16px',
    fontWeight: 600,
    boxShadow: '0 4px 14px oklch(0 0 0 / 20%)',
  },
  pillText: { color: colorVars['--color-background-body'], fontSize: '16px', fontWeight: 600 },
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
  closeLabel,
  copiedAt = null,
  heroSrc = null,
  heroSrcSet = null,
}: BringFriendProps) {
  const [copied, setCopied] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const flash = () => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  // Copied by the tap that opened the drawer.
  useEffect(() => {
    if (isOpen && copiedAt !== null) flash();
  }, [isOpen, copiedAt]);

  const copy = async () => {
    if (await copyLink(link)) flash();
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange} label={label} height="hug">
      {isOpen ? (
        <VStack gap={3} xstyle={styles.sheet}>
          <VStack xstyle={styles.top}>
            {heroSrc && !heroFailed ? (
              // Decoration: the title under it says what the drawer is.
              <img
                src={heroSrc}
                {...(heroSrcSet ? { srcSet: heroSrcSet, sizes: '(min-width: 480px) 440px, 100vw' } : {})}
                alt=""
                width={1608}
                height={629}
                decoding="async"
                onError={() => setHeroFailed(true)}
                {...stylex.props(styles.hero)}
              />
            ) : null}
            <IconButton
              label={closeLabel}
              icon={<Icon icon="close" size="md" />}
              variant="ghost"
              onClick={() => onOpenChange(false)}
              xstyle={styles.close}
            />
          </VStack>
          <Heading level={2} xstyle={styles.title}>
            {label}
          </Heading>
          <Text xstyle={styles.body}>{body}</Text>
          <HStack gap={2} align="end" wrap="nowrap">
            {/* The link takes all the room Copy leaves it (D-334). */}
            <VStack xstyle={styles.field}>
              <TextField label={linkLabel} isLabelHidden value={link} isReadOnly width="100%" />
              {/* Said out loud as well as shown (a status, not an alert). */}
              <HStack role="status" xstyle={copied ? styles.copied : null}>
                {copied ? (
                  <HStack gap={1.5} align="center" wrap="nowrap" xstyle={styles.pill}>
                    <Icon icon="check" size="sm" />
                    <Text xstyle={styles.pillText}>{copiedLabel}</Text>
                  </HStack>
                ) : null}
              </HStack>
            </VStack>
            <Button label={copyLabel} variant="secondary" onClick={() => void copy()} xstyle={styles.copy} />
          </HStack>
        </VStack>
      ) : null}
    </BottomSheet>
  );
}
