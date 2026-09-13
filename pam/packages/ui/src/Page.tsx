import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { pam } from './tokens.stylex.js';

/**
 * The shape every screen has.
 *
 * It was copied into six files — the same max-width, the same side padding, the
 * same `marginInline: auto` — with the numbers slightly different in each,
 * because they were typed again rather than shared. Nobody notices 520 against
 * 560 on one screen; everybody notices the day the padding changes and one
 * screen does not follow.
 *
 * `width` exists because two screens legitimately differ: a long legal document
 * reads better wider than a form does.
 */
export interface PageProps {
  readonly children: ReactNode;
  /** `read` widens the column for long prose. */
  readonly width?: 'app' | 'read';
  /** Centres everything, for a screen that is one thought (sign-in). */
  readonly align?: 'start' | 'center';
  /** Space between the things stacked inside. */
  readonly gap?: 0 | 1 | 2 | 3 | 4;
}

const styles = stylex.create({
  page: {
    width: '100%',
    marginInline: 'auto',
    paddingInline: pam.screenPadding,
    paddingBlock: '24px',
  },
  app: { maxWidth: pam.pageWidth },
  read: { maxWidth: '720px' },
  centred: { textAlign: 'center' },
});

export function Page({ children, width = 'app', align = 'start', gap = 4 }: PageProps) {
  return (
    <main {...stylex.props(styles.page, styles[width], align === 'center' && styles.centred)}>
      <VStack gap={gap} align={align === 'center' ? 'center' : undefined}>
        {children}
      </VStack>
    </main>
  );
}
