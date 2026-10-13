import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';

const styles = stylex.create({
  frame: { width: '100%', marginInline: 'auto', boxSizing: 'border-box', minWidth: 0 },
});

/** The 1200px column of the new website (Figma "Pam — Website": header, hero and footer sit in 1200; cards in 1260 on a 1440 page). */
export function WebFrame({ children, gap = 0 }: { readonly children: ReactNode; readonly gap?: 0 | 2 | 3 | 4 | 6 | 8 | 10 }) {
  return (
    <VStack gap={gap} maxWidth={1200} paddingInline={4} xstyle={styles.frame}>
      {children}
    </VStack>
  );
}
