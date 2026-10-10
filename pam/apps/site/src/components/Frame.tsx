import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';

const styles = stylex.create({
  // A readable column, centred, with a gutter that holds on a phone.
  frame: {
    width: '100%',
    marginInline: 'auto',
    boxSizing: 'border-box',
  },
});

/**
 * The width every section of the site sits in. `read` is a column for prose;
 * `wide` is for the home page's grids and the support table.
 */
export function Frame({
  children,
  width = 'wide',
  gap = 6,
}: {
  readonly children: ReactNode;
  readonly width?: 'read' | 'wide';
  readonly gap?: 2 | 3 | 4 | 5 | 6 | 8 | 10;
}) {
  return (
    <VStack
      gap={gap}
      maxWidth={width === 'read' ? 720 : 1080}
      paddingInline={4}
      xstyle={styles.frame}
    >
      {children}
    </VStack>
  );
}
