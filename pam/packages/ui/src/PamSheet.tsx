'use client';

import { useRef, type ReactNode, type RefObject } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Button } from './Button.js';
import { sheet } from './sheet.js';
import { landFocus, landFocusStyle } from './landFocus.js';
import { pam } from './tokens.stylex.js';

/**
 * Pam's one drawer (Will, 17 October, card a93: "standardize these drawers across the entire app so they all have enough space on
 * that top notch for the person to tap and it closes. They should also have a green link on the top right … one says 'Close' and
 * another one says 'Done', depending on the purpose of the drawer … more space from the title to the top edge").
 *
 * An Astryx `BottomSheet` with, in this order:
 *
 *   1. **The top notch is a target.** The strip Astryx draws as a grab handle is 24px and decorative; here a 48px-high band across
 *      the top of the sheet closes it on a tap (z-index above Astryx's strip, which still draws the grip and still drags).
 *      It is not a second way for a screen reader or keyboard to close: it is hidden from both, because the link below does that.
 *   2. **Room above the title.** The title starts below that band, not under the grip.
 *   3. **The title, then one green link at the end of its row: the only visible control that closes** (swipe and Escape still do).
 *      A screen reader meets the title, then the link, then the content.
 *
 * Which word the link says depends on what the drawer is for (`kind`), and the caller passes the word, so it is read in the
 * person's language (`action.done` for Done; `trips.confirm.close` for Close):
 *
 *   - `read`  → "Close". A drawer you only look at, or one whose rows take you somewhere else: a week of hours, a policy,
 *     What you can see, Bring a friend, the list of map apps, who to message.
 *   - `pick`  → "Done". A drawer where you choose or set something and then leave it: the area, a signature.
 */
export type PamSheetKind = 'read' | 'pick';

export interface PamSheetProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  /** The drawer's name for a screen reader. Also its title unless `title` is given. */
  readonly label: string;
  readonly kind: PamSheetKind;
  /** The link's word: "Close" for `read`, "Done" for `pick`. */
  readonly actionLabel: string;
  /** The title: defaults to `label`; pass `null` for a drawer that draws its own (under a picture). */
  readonly title?: ReactNode | null;
  readonly height?: 'hug' | 'capped' | 'tall';
  /** Astryx's `purpose`: `form` while something is being drawn or typed that a swipe must not throw away. */
  readonly purpose?: 'info' | 'form';
  readonly finalFocusRef?: RefObject<HTMLElement | null>;
  /** The first thing in the sheet is a field to type in: it takes the focus, not the content (`landFocus`). */
  readonly isTyping?: boolean;
  readonly children: ReactNode;
}

const styles = stylex.create({
  frame: { width: '100%', position: 'relative' },
  // The top notch: across the whole top of the sheet, over Astryx's own strip.
  notch: {
    position: 'absolute',
    insetBlockStart: 0,
    insetInline: 0,
    height: pam['--pam-touch-target-min'],
    zIndex: 2,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  // 48px of notch, then 8px of air, before the title row.
  header: { width: '100%', paddingBlockStart: '56px', paddingInline: '20px', paddingBlockEnd: '8px' },
  title: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, minWidth: 0 },
  action: {
    flexShrink: 0,
    minHeight: pam['--pam-touch-target-min'],
    minWidth: pam['--pam-touch-target-min'],
    paddingInline: '4px',
    fontSize: '17px',
    fontWeight: 700,
    color: colorVars['--color-text-accent'],
    backgroundImage: { default: 'none', ':hover': 'none', ':active': 'none' },
  },
});

export function PamSheet({
  isOpen,
  onOpenChange,
  label,
  kind,
  actionLabel,
  title,
  height = 'hug',
  purpose = 'info',
  finalFocusRef,
  isTyping = false,
  children,
}: PamSheetProps) {
  const close = () => onOpenChange(false);
  // Where the focus goes back to: whatever had it when the drawer opened (the row or chip that was tapped). Astryx's own return
  // let it fall to the page when the opener was redrawn meanwhile; the element is read in the render that opens the drawer, before
  // the drawer takes the focus.
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (isOpen && !wasOpen.current && typeof document !== 'undefined') {
    opener.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  }
  wasOpen.current = isOpen;
  const heading = title === undefined ? label : title;
  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      label={label}
      height={height}
      purpose={purpose}
      xstyle={sheet.panel}
      finalFocusRef={finalFocusRef ?? opener}
    >
      {isOpen ? (
        <VStack {...(isTyping ? {} : landFocus)} data-sheet-kind={kind} xstyle={[styles.frame, isTyping ? null : landFocusStyle.quiet]}>
          {/* The 48px notch: a touch target only. Not announced and not a tab stop; the link below is the way for those. */}
          <button type="button" aria-hidden="true" tabIndex={-1} data-sheet-notch="" onClick={close} {...stylex.props(styles.notch)} />
          <HStack align="center" justify="between" gap={3} wrap="nowrap" xstyle={styles.header}>
            {heading ? (
              <Heading level={2} xstyle={styles.title}>
                {heading}
              </Heading>
            ) : (
              <span />
            )}
            <Button label={actionLabel} variant="ghost" onClick={close} data-sheet-action={kind} xstyle={styles.action} />
          </HStack>
          {children}
        </VStack>
      ) : null}
    </BottomSheet>
  );
}
