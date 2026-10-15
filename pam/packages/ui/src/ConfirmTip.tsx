'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * A small word by a button that says what the tap just did: "Saved" (Will, 11 October: "when I save a place it
 * should show a tooltip saying saved").
 *
 * It is a confirmation, not a hint: it appears by the button when the number in `trigger` goes up, stays about two
 * seconds, and fades. Nothing has to be tapped to dismiss it, and it never takes focus or a tap (`pointer-events:
 * none`). The words are also said to a screen reader, politely, through a live region that is in the page before
 * anything is put in it (a region added together with its text is often not announced); the drawn bubble is hidden
 * from assistive technology so it is not read twice.
 *
 * The only movement is the fade. Under "reduce motion" it simply goes.
 *
 * Not a general tooltip: Astryx's own `Tooltip` is for a label on hover or focus and pulls in the overlay layer.
 * This is a few lines and no layer, so it is fine to sit on every place card.
 *
 * **Use it** for a quiet success the screen otherwise shows only by a changed icon. **Do not use it** for an error
 * (that is a `CompactNotice` or `Notice`), or for anything the person must read before going on.
 */
export interface ConfirmTipProps {
  /** What the tap did, already localised: "Saved". */
  readonly text: string;
  /** Goes up by one each time the thing happens. The first value is not a tap and shows nothing. */
  readonly trigger: number;
  /** Which end of the button the bubble lines up with. `end` suits a button at the edge of a row. */
  readonly align?: 'end' | 'center';
  /** The button. */
  readonly children: ReactNode;
}

/** How long the word stays before it fades. */
export const CONFIRM_TIP_MS = 2000;
/** How long the fade takes; the bubble leaves the page after it. */
const FADE_MS = 200;

const styles = stylex.create({
  wrap: { position: 'relative', display: 'inline-flex', flexShrink: 0 },
  bubble: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    zIndex: 30,
    pointerEvents: 'none',
    width: 'max-content',
    maxWidth: '200px',
    boxSizing: 'border-box',
    paddingBlock: '6px',
    paddingInline: '12px',
    borderRadius: '8px',
    // The page's own text colour as the ground and its background as the words: a pair that is
    // already AAA in both modes, whatever is behind it.
    backgroundColor: colorVars['--color-text-primary'],
    color: colorVars['--color-background-body'],
    boxShadow: '0 2px 8px light-dark(oklch(0 0 0 / 18%), oklch(0 0 0 / 50%))',
    opacity: 1,
    transition: {
      default: 'opacity 200ms ease-out',
      '@media (prefers-reduced-motion: reduce)': 'none',
    },
  },
  fading: { opacity: 0 },
  end: { insetInlineEnd: 0 },
  center: { insetInlineStart: '50%', transform: 'translateX(-50%)' },
  text: {
    fontSize: '14px',
    lineHeight: 1.3,
    fontWeight: 600,
    textAlign: 'center',
    // The bubble's colours are chosen against each other, not against the page's text.
    color: colorVars['--color-background-body'],
  },
});

export function ConfirmTip({ text, trigger, align = 'end', children }: ConfirmTipProps) {
  const [phase, setPhase] = useState<'idle' | 'shown' | 'fading'>('idle');
  const first = useRef(true);

  useEffect(() => {
    // The value it starts at is the page loading, not a tap.
    if (first.current) {
      first.current = false;
      return;
    }
    setPhase('shown');
    const fade = setTimeout(() => setPhase('fading'), CONFIRM_TIP_MS);
    const gone = setTimeout(() => setPhase('idle'), CONFIRM_TIP_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, [trigger]);

  return (
    <span {...stylex.props(styles.wrap)}>
      {children}
      {/* Always in the page, so the words arriving in it are announced. */}
      <VisuallyHidden>
        <span role="status" aria-live="polite">
          {phase === 'shown' ? text : ''}
        </span>
      </VisuallyHidden>
      {phase !== 'idle' ? (
        <span
          aria-hidden="true"
          data-confirm-tip=""
          {...stylex.props(styles.bubble, align === 'end' ? styles.end : styles.center, phase === 'fading' && styles.fading)}
        >
          <Text xstyle={styles.text}>{text}</Text>
        </span>
      ) : null}
    </span>
  );
}
