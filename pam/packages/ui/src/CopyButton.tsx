'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { COPIED_MS, COPY_FAILED_MS, copyLink } from './clipboard.js';
import { CheckIcon, CopyIcon, InfoIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * A small copy icon for a block of text (Will, 9 October, D-416): top right of
 * a card, and when it is tapped it says what happened.
 *
 * - **Idle:** a copy icon. The glyph is 22px but the button is 48px, because
 *   this acts, and Pam's floor is 48px for anything that does (§2.5; only an
 *   info tip, which explains and never acts, is smaller).
 * - **Copied:** the icon turns into a green tick and a pale-green pill under it
 *   says "Copied" for 3 seconds. The pill is positioned, not in the flow, so
 *   the card does not jump.
 * - **Could not copy:** an "i" and the reason with what to do instead ("press
 *   and hold the text"), for 6 seconds — longer, because it asks something of
 *   you. Some browsers refuse the clipboard; the text is on the screen either way.
 *
 * The status is a `role="status"` live region that is always in the page, so a
 * screen reader announces it when the words arrive rather than missing a region
 * created at the same moment. Colour is never the only signal: the icon changes
 * shape and the words say it. Under reduced motion the pill appears without a
 * fade.
 *
 * `copyLink` runs straight from the tap: Safari lets a page write to the
 * clipboard only inside one.
 */
export interface CopyButtonProps {
  /** What lands on the clipboard. */
  readonly text: string;
  /** The button's name for a screen reader: "Copy this section". */
  readonly label: string;
  /** "Copied". */
  readonly copiedLabel: string;
  /** "Could not copy. Press and hold the text to copy it." */
  readonly failedLabel: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

const fadeIn = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

const styles = stylex.create({
  wrap: { position: 'relative', flexShrink: 0 },
  button: { color: colorVars['--color-text-primary'] },
  buttonDone: { color: colorVars['--color-icon-green'] },
  // Under the icon, right edges together, on top of what is below. A box with
  // a border and a shadow, so it reads over text on either page colour.
  status: {
    position: 'absolute',
    insetBlockStart: '100%',
    insetInlineEnd: 0,
    marginBlockStart: '4px',
    zIndex: 5,
    width: 'max-content',
    maxWidth: '240px',
    paddingBlock: '8px',
    paddingInline: '14px',
    borderRadius: '12px',
    backgroundColor: pam['--pam-secondary-fill'],
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.14)',
    animationName: fadeIn,
    animationDuration: '160ms',
    animationTimingFunction: 'ease-out',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
    // Taps go through to whatever is under it.
    pointerEvents: 'none',
  },
  statusText: { fontSize: '16px', lineHeight: 1.35, fontWeight: 600, color: colorVars['--color-text-accent'] },
});

export function CopyButton({ text, label, copiedLabel, failedLabel }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    const ok = await copyLink(text);
    setState(ok ? 'copied' : 'failed');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), ok ? COPIED_MS : COPY_FAILED_MS);
  };

  const icon =
    state === 'copied' ? (
      <CheckIcon width={22} height={22} />
    ) : state === 'failed' ? (
      <InfoIcon width={22} height={22} />
    ) : (
      <CopyIcon width={22} height={22} />
    );

  return (
    <HStack xstyle={styles.wrap}>
      <Button
        label={label}
        variant="ghost"
        isIconOnly
        icon={<HStack>{icon}</HStack>}
        onClick={() => void copy()}
        xstyle={[styles.button, state === 'copied' ? styles.buttonDone : null]}
      />
      <span role="status" aria-live="polite">
        {state !== 'idle' ? (
          <HStack xstyle={styles.status} align="center">
            <Text xstyle={styles.statusText}>{state === 'copied' ? copiedLabel : failedLabel}</Text>
          </HStack>
        ) : null}
      </span>
    </HStack>
  );
}
