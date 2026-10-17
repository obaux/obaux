import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';

const styles = stylex.create({
  frame: { width: '100%', marginInline: 'auto', boxSizing: 'border-box', minWidth: 0 },
  // A card's edge on a phone: 12px, as drawn (Figma "Home — Phone 390"); the page's 16px from 900px.
  card: { paddingInline: { default: '12px', '@media (min-width: 900px)': '16px' } },
  // The header's: 20px at the wordmark, 8px at Sign in, on a phone.
  header: { paddingInlineStart: { default: '20px', '@media (min-width: 900px)': '16px' }, paddingInlineEnd: { default: '8px', '@media (min-width: 900px)': '16px' } },
});

/** The 1200px column of the new website (Figma "Pam — Website": header, hero and footer sit in 1200; cards in 1260 on a 1440 page). */
export function WebFrame({ children, gap = 0, edge = 'page' }: { readonly children: ReactNode; readonly gap?: 0 | 2 | 3 | 4 | 6 | 8 | 10; readonly edge?: 'page' | 'card' | 'header' }) {
  return (
    <VStack gap={gap} maxWidth={1200} {...(edge === 'page' ? { paddingInline: 4 as const } : {})} xstyle={[styles.frame, edge === 'card' && styles.card, edge === 'header' && styles.header]}>
      {children}
    </VStack>
  );
}
