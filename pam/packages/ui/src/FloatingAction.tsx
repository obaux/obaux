import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { MenuList } from './MenuList.js';

/**
 * One row floating just above the bottom bar (D-218, Will, 2 October):
 * "Invite someone" on a case manager's and a program lead's Home — the same
 * row Profile draws (icon, words, chevron), lifted onto a card so it stays in
 * reach while the list scrolls. A real link, so it works with no JavaScript.
 * Draws a spacer too, so the end of the list scrolls clear of it.
 */
export interface FloatingActionProps {
  readonly label: string;
  readonly href: string;
  /** A PAM icon at 26px, as in a `MenuList` row. */
  readonly icon: ReactNode;
}

// The bottom bar's height (TabBar), and the gap above it.
const BAR = 66;
const GAP = 12;

const styles = stylex.create({
  dock: {
    position: 'fixed',
    insetInline: 0,
    bottom: `calc(${BAR + GAP}px + env(safe-area-inset-bottom, 0px))`,
    zIndex: 9,
    paddingInline: '16px',
    marginInline: 'auto',
    maxWidth: '560px',
  },
  card: {
    width: '100%',
    borderRadius: '20px',
    paddingInline: '8px',
    boxShadow: '0 2px 6px oklch(0 0 0 / 8%), 0 10px 28px oklch(0 0 0 / 16%)',
  },
  spacer: { height: '88px', flexShrink: 0 },
});

export function FloatingAction({ label, href, icon }: FloatingActionProps) {
  return (
    <>
      <VStack aria-hidden xstyle={styles.spacer} />
      <HStack xstyle={styles.dock}>
        <Card padding={0} xstyle={styles.card}>
          <MenuList label={label} items={[{ id: 'action', label, href, icon }]} />
        </Card>
      </HStack>
    </>
  );
}
