import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { MenuList } from './MenuList.js';

/**
 * One row floating just above the bottom bar (D-218, Will, 2 October):
 * "Invite someone" on a case manager's and a program lead's Home — the same
 * row Profile draws (icon, words, chevron), on a plain strip resting on the
 * bottom bar so it stays in reach while the list scrolls (D-226). A real link, so it works with no JavaScript.
 * Draws a spacer too, so the end of the list scrolls clear of it.
 */
export interface FloatingActionProps {
  readonly label: string;
  readonly href: string;
  /** A PAM icon at 26px, as in a `MenuList` row. */
  readonly icon: ReactNode;
}

// The bottom bar's height (TabBar).
const BAR = 66;

const styles = stylex.create({
  // A plain strip resting on the bottom bar (Will, 2 October, D-226): no
  // card, no shadow, the bar's own hairline above it — the row's icon and
  // words stay exactly where they were on the card.
  dock: {
    position: 'fixed',
    insetInline: 0,
    bottom: `calc(${BAR}px + env(safe-area-inset-bottom, 0px))`,
    zIndex: 9,
    backgroundColor: colorVars['--color-background-body'],
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colorVars['--color-border'],
  },
  inner: { width: '100%', maxWidth: '560px', marginInline: 'auto', paddingInline: '24px' },
  spacer: { height: '72px', flexShrink: 0 },
});

export function FloatingAction({ label, href, icon }: FloatingActionProps) {
  return (
    <>
      <VStack aria-hidden xstyle={styles.spacer} />
      <HStack xstyle={styles.dock}>
        <VStack xstyle={styles.inner}>
          <MenuList label={label} items={[{ id: 'action', label, href, icon }]} />
        </VStack>
      </HStack>
    </>
  );
}
