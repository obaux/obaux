'use client';

import { useRef, type ReactNode, type RefObject } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { sheet } from './sheet.js';
import { landFocus, landFocusStyle } from './landFocus.js';
import { pam } from './tokens.stylex.js';

/**
 * Pam's one drawer (Will, 17 October, card a93; revised on card a97: "Bring the X circle button to the others … create rule that
 * when drawer requires action inputs in main area, use checkmark icon, if only informative, use checkmark icon. But if action is
 * performed inside drawer (like the copy link example) then use X icon. Keep the headers consistent with the extra space above …
 * the icon button should be in top right corner").
 *
 * An Astryx `BottomSheet` with, in this order:
 *
 *   1. **The top notch is a target.** The strip Astryx draws as a grab handle is 24px and decorative; here a 48px-high band across
 *      the top of the sheet closes it on a tap (z-index above Astryx's strip, which still draws the grip and still drags).
 *      It is not a second way for a screen reader or keyboard to close: it is hidden from both, because the button below does that.
 *   2. **Room above the title.** The title starts below that band, not under the grip.
 *   3. **The title, then one round button in the top-right corner (top-left in Arabic): the only visible control that closes**
 *      (swipe and Escape still do). A screen reader meets the title, then the button, then the content.
 *
 * Which icon the button has is a rule about what the drawer is for (`kind`), and the caller passes the word, so it is read in the
 * person's language:
 *
 *   - `review` → a **checkmark**, named "Done" (`action.done`). You pick something in the drawer, or you only read it: Location,
 *     Opening hours, What you can see, New message, Open in…. Tapping it says "I have what I came for."
 *   - `act` → an **X**, named "Close" (`trips.confirm.close`). Something is done inside the drawer itself, so a checkmark would
 *     say it had been confirmed: Bring a friend (you copy the link there), Sign a policy (you sign there).
 *
 * `title={null}` is for a drawer that starts with a picture to the top edge (Bring a friend): there is no title row, and the
 * button sits over the picture.
 */
export type PamSheetKind = 'review' | 'act';

export interface PamSheetProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  /** The drawer's name for a screen reader. Also its title unless `title` is given. */
  readonly label: string;
  readonly kind: PamSheetKind;
  /** The button's name: "Done" for `review` (`action.done`), "Close" for `act` (`trips.confirm.close`). */
  readonly actionLabel: string;
  /** The title: defaults to `label`; pass `null` for a drawer that starts with a picture to the top edge. */
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
  // 48px of notch, then 8px of air, before the title row; the title leaves room for the corner button.
  header: { width: '100%', paddingBlockStart: '56px', paddingInlineStart: '20px', paddingInlineEnd: '64px', paddingBlockEnd: '8px' },
  title: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, minWidth: 0 },
  // The round button, tucked into the top corner (the end corner: left in Arabic): a 36px circle 16px in from the top and from the side,
  // so it sits inside the sheet's rounded corner instead of floating by it. The button itself is the 48px tap target (the global
  // 48px floor on every button, globals.css) and has no fill; the circle is drawn inside it.
  action: {
    position: 'absolute',
    insetBlockStart: '10px',
    insetInlineEnd: '10px',
    zIndex: 3,
    width: pam['--pam-touch-target-min'],
    height: pam['--pam-touch-target-min'],
    backgroundColor: 'transparent',
    backgroundImage: { default: 'none', ':hover': 'none', ':active': 'none' },
    boxShadow: 'none',
  },
  circle: {
    width: '36px',
    height: '36px',
    minWidth: '36px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-muted'],
  },
  // Over Bring a friend's picture: the white circle with a soft shadow it always had (D-338).
  circleOnPicture: {
    backgroundColor: colorVars['--color-background-body'],
    boxShadow: '0 1px 4px oklch(0 0 0 / 18%)',
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
          {heading ? (
            <Heading level={2} xstyle={[styles.title, styles.header]}>
              {heading}
            </Heading>
          ) : null}
          <IconButton
            label={actionLabel}
            variant="ghost"
            icon={
              <HStack align="center" justify="center" xstyle={[styles.circle, title === null ? styles.circleOnPicture : null]}>
                <Icon icon={kind === 'review' ? 'check' : 'close'} size="sm" />
              </HStack>
            }
            onClick={close}
            data-sheet-action={kind}
            xstyle={styles.action}
          />
          {children}
        </VStack>
      ) : null}
    </BottomSheet>
  );
}
