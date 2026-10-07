'use client';

import { useEffect, useId, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { useCollapsible } from '@astryxdesign/core/Collapsible';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { pam } from './tokens.stylex.js';
import { UserPlusIcon } from './icons.js';
import { TextField } from './TextField.js';

/**
 * Bring a friend, on the booked screen (D-333, design review): a row that
 * opens to one sentence and the link, with Copy beside it.
 *
 * - Only after a visit is booked, so the link always points to a real slot.
 * - Collapsed by default: a user-plus icon, "Bring a friend" and a chevron,
 *   at least 48px tall.
 * - Open: the sentence, then the link in a read-only field and a small Copy
 *   button that says "Copied" for about a second and a half.
 * - No preview and no page of its own. Copy only, everywhere: the native
 *   share sheet waits for Will (D-333).
 * - On the page itself, not in a card, with a large dark chevron (Will,
 *   D-334): Astryx's `useCollapsible` for the state, an Astryx `Button` for
 *   the row, since `Collapsible`'s own chevron cannot be restyled.
 */
export interface BringFriendProps {
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
  /** Open at first, for a story or a test. */
  readonly defaultIsOpen?: boolean;
}

/** How long Copy says "Copied". */
export const COPIED_MS = 1500;

const styles = stylex.create({
  section: { width: '100%' },
  trigger: {
    width: '100%',
    minHeight: pam['--pam-touch-target-min'],
    justifyContent: 'flex-start',
    paddingInline: 0,
    textAlign: 'start',
  },
  grow: { flexGrow: 1, minWidth: 0 },
  chevron: {
    color: colorVars['--color-text-primary'],
    transitionProperty: 'transform',
    transitionDuration: '200ms',
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0s' },
  },
  chevronOpen: { transform: 'rotate(180deg)' },
  icon: { width: '24px', height: '24px', flexShrink: 0, color: colorVars['--color-icon-primary'] },
  label: { fontSize: '18px', fontWeight: 600, lineHeight: 1.3 },
  body: { fontSize: '17px', lineHeight: 1.45 },
  field: { flexGrow: 1, minWidth: 0 },
  // As tall as the link field beside it.
  copy: { height: pam['--pam-field-height'], minHeight: pam['--pam-field-height'], flexShrink: 0, borderRadius: '12px' },
});

export function BringFriend({
  label,
  body,
  link,
  linkLabel,
  copyLabel,
  copiedLabel,
  defaultIsOpen = false,
}: BringFriendProps) {
  const [copied, setCopied] = useState(false);
  const contentId = useId();
  const disclosure = useCollapsible({ isCollapsible: { defaultIsOpen } });
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
    <VStack gap={3} xstyle={styles.section}>
      <Button
        label={label}
        variant="ghost"
        size="lg"
        aria-expanded={disclosure.isOpen}
        aria-controls={contentId}
        onClick={disclosure.toggle}
        icon={<UserPlusIcon aria-hidden {...stylex.props(styles.icon)} />}
        endContent={<Icon icon="chevronDown" size="lg" xstyle={[styles.chevron, disclosure.isOpen && styles.chevronOpen]} />}
        xstyle={styles.trigger}
      >
        <Text xstyle={[styles.label, styles.grow]}>{label}</Text>
      </Button>
      {disclosure.isOpen ? (
        <VStack gap={3} id={contentId} role="region" aria-label={label}>
          <Text xstyle={styles.body}>{body}</Text>
          <HStack gap={2} align="end" wrap="nowrap">
            {/* The link takes all the room Copy leaves it (Will, D-334). */}
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
    </VStack>
  );
}
