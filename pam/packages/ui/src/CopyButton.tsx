'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { COPY_STATUS_MS, copyLink } from './clipboard.js';
import { CheckIcon, CopyIcon, InfoIcon } from './icons.js';

/**
 * One copy icon for a page (Will, 9 October, D-417), top right of the header,
 * putting the whole page's text on the clipboard.
 *
 * - **Idle:** a copy icon. The glyph is 22px but the button is 48px, because
 *   this acts and Pam's floor is 48px (§2.5).
 * - **Copied:** the icon is replaced by a tick — a plain swap, no animation —
 *   and a small tooltip under the button says "Copied". After 5 seconds it is
 *   a copy icon again.
 * - **Could not copy:** an "i" and the reason with what to do instead ("press
 *   and hold the text"), the same 5 seconds. Some browsers refuse the
 *   clipboard; the text is on the screen either way.
 *
 * The tooltip is a `role="status"` live region that is in the page before
 * anything is said, so a screen reader announces it when the words arrive.
 * Colour is never the only signal: the icon changes shape and the words say it.
 * Nothing moves or fades, so there is nothing for reduced motion to remove.
 *
 * `copyLink` runs straight from the tap: Safari lets a page write to the
 * clipboard only inside one.
 */
export interface CopyButtonProps {
  /**
   * Where it sits. `header` is the 48px circle with a thin edge, top right of a
   * page (D-417). `inCard` is for a copy action inside a card (Will, 9 October
   * 2026): 32px, no edge — a small quiet icon at the corner of what it copies,
   * not a button the size of the thumb. Both say the same words.
   */
  readonly placement?: 'header' | 'inCard';
  /** What lands on the clipboard. */
  readonly text: string;
  /** The button's name for a screen reader: "Copy this page". */
  readonly label: string;
  /** "Copied". */
  readonly copiedLabel: string;
  /** "Could not copy. Press and hold the text to copy it." */
  readonly failedLabel: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

const styles = stylex.create({
  wrap: { position: 'relative', flexShrink: 0 },
  // White with a thin grey edge, a 48px circle: the same as Help and the bell
  // in a screen's top bar (Will, 9 October, D-417).
  button: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    flexShrink: 0,
    color: colorVars['--color-text-primary'],
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  // A tooltip: under the button, its right edge on the button's, a small
  // point up at the icon. Dark on the light page and light on the dark one,
  // so it reads on either. Taps go through to what is under it.
  tip: {
    position: 'absolute',
    insetBlockStart: '100%',
    insetInlineEnd: 0,
    marginBlockStart: '2px',
    zIndex: 5,
    width: 'max-content',
    maxWidth: '240px',
    paddingBlock: '8px',
    paddingInline: '12px',
    borderRadius: '8px',
    backgroundColor: colorVars['--color-text-primary'],
    pointerEvents: 'none',
    '::before': {
      content: "''",
      position: 'absolute',
      insetBlockStart: '-4px',
      insetInlineEnd: '18px',
      width: '10px',
      height: '10px',
      transform: 'rotate(45deg)',
      backgroundColor: colorVars['--color-text-primary'],
    },
  },
  // Inside a card (Will, 9 October 2026): 32px and no ring. The glyph is 18px,
  // and it keeps the page copy button's tick and tooltip.
  inCard: {
    width: '32px',
    height: '32px',
    minWidth: '32px',
    minHeight: '32px',
    padding: '0px',
    borderWidth: '0px',
    backgroundColor: 'transparent',
  },
  // The tooltip's point sits over the middle of a 32px button, not a 48px one.
  tipInCard: { '::before': { insetInlineEnd: '11px' } },
  tipText: { position: 'relative', fontSize: '15px', lineHeight: 1.35, color: colorVars['--color-background-body'] },
});

export function CopyButton({ text, label, copiedLabel, failedLabel, placement = 'header' }: CopyButtonProps) {
  const isInCard = placement === 'inCard';
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
    timer.current = setTimeout(() => setState('idle'), COPY_STATUS_MS);
  };

  const glyph = isInCard ? 18 : 22;
  const icon =
    state === 'copied' ? (
      <CheckIcon width={glyph} height={glyph} />
    ) : state === 'failed' ? (
      <InfoIcon width={glyph} height={glyph} />
    ) : (
      <CopyIcon width={glyph} height={glyph} />
    );

  return (
    <HStack xstyle={styles.wrap}>
      <Button
        label={label}
        variant="ghost"
        isIconOnly
        icon={<HStack>{icon}</HStack>}
        onClick={() => void copy()}
        xstyle={[styles.button, isInCard && styles.inCard]}
      />
      <span role="status" aria-live="polite">
        {state !== 'idle' ? (
          <HStack xstyle={[styles.tip, isInCard && styles.tipInCard]} align="center">
            <Text xstyle={styles.tipText}>{state === 'copied' ? copiedLabel : failedLabel}</Text>
          </HStack>
        ) : null}
      </span>
    </HStack>
  );
}
