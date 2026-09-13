import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Badge } from '@astryxdesign/core/Badge';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * The wordmark, and who you are signed in as.
 *
 * PAM is one codebase serving three very different people — somebody who just
 * came home, the staff running a programme, the officer watching a caseload —
 * and the screens are deliberately similar, because they are built from the
 * same components. That similarity is a liability the moment somebody has two
 * of them open, so the role chip is not decoration: it is the answer to "whose
 * screen am I looking at".
 *
 * The chip is grey on purpose. It is orientation, not news: a coloured chip in
 * the corner of every screen competes with the things that genuinely need
 * attention — an account paused, a feature switched off — and those are the
 * only badges on these screens that should catch an eye.
 *
 * The mark is the real wordmark. Two files rather than one: the artwork is
 * coral on dark grounds and deep green on light ones, and neither survives the
 * other's background. `<picture>` picks between them from the browser's own
 * colour scheme, with no JavaScript and no flash of the wrong one — and one
 * `alt` on the `<img>`, so a screen reader hears "PAM" once, not twice.
 *
 * Static files rather than inlined SVG. At 5.7 kB each that is now a close call
 * either way, but keeping them out of the JavaScript bundle costs nothing and
 * §12's 500 kB budget has under 8 kB of headroom left.
 */
export interface AppHeaderProps {
  /** Plain-language role name, already translated. Omitted for signed-out. */
  roleLabel?: string | null;
  /**
   * Where the mark sits. Left inside the app, where it shares a row with the
   * role chip and screens are scanned from the left; centred on the way in,
   * where it is the only thing on its line and is there to say which app this
   * is rather than to be navigated past.
   */
  align?: 'start' | 'center';
  /**
   * Anything that belongs in the header row itself, at the end — today, the
   * notification bell. A slot rather than a `notifications` prop: the header
   * should not know what a notification is, and the panel's open state belongs
   * to the thing that opens it.
   */
  trailing?: ReactNode;
  /**
   * Keeps the mark at the top of the window while the screen scrolls under it.
   *
   * For the way in, where the mark is the only thing saying which app this is
   * and the screen above the form scrolls (Will, 13 September). Inside the app
   * the header shares its row with the role chip and the bell, and pinning that
   * strip would cost a phone screen's worth of height on every screen.
   */
  isSticky?: boolean;
}

const styles = stylex.create({
  header: {
    width: '100%',
    paddingBlock: '4px',
  },
  sticky: {
    position: 'sticky',
    top: 0,
    // Paints its own ground, or the page scrolls through it. The body's own
    // token, so it is the same colour the page is already painted in and the
    // strip is invisible until something passes under it.
    backgroundColor: colorVars['--color-background-body'],
    zIndex: 1,
    paddingBlock: '8px',
  },
  mark: {
    // Sized by height so the aspect ratio comes from the artwork, and set in px
    // because this is a piece of art at a fixed size, not text that should grow
    // with a reader's font settings.
    height: '26px',
    width: 'auto',
    display: 'block',
  },
});

export function AppHeader({
  roleLabel,
  align = 'start',
  trailing,
  isSticky = false,
}: AppHeaderProps) {
  return (
    <header {...stylex.props(styles.header, isSticky && styles.sticky)}>
      <HStack gap={2} align="center" justify={trailing ? 'between' : align} wrap="nowrap">
        <HStack gap={2} align="center" wrap="wrap">
          <picture>
            <source srcSet="/pam-wordmark-dark.svg" media="(prefers-color-scheme: dark)" />
            <img src="/pam-wordmark-light.svg" alt="PAM" {...stylex.props(styles.mark)} />
          </picture>
          {roleLabel ? <Badge variant="neutral" label={roleLabel} /> : null}
        </HStack>
        {trailing}
      </HStack>
    </header>
  );
}
