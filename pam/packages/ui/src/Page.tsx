'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { PageEnter } from './motion.js';
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
 *
 * It is also where a screen's arrival lives. Every screen in Pam goes through
 * this component, so putting the fade here means no screen can forget it and no
 * two screens can disagree about it — and somebody who asked their phone for
 * less motion gets none of it, decided once in `MotionProvider`.
 *
 * ## The footer (D-326)
 *
 * A screen's one action can ride at the foot of the screen, always in reach
 * however far somebody scrolls — a place's "Plan a trip" (D-309). It is the
 * template's job, not the screen's: the first version was a `position:
 * fixed` strip inside the place's own body, and a full-page capture (how
 * Will sees it, in Chromatic) painted it halfway down the screen as a white
 * box with a hard edge and the rest of the page running on underneath it
 * (Will, 6 October: "the floating button is not working well").
 *
 * So it is the last thing in the page, **sticky** to the bottom edge: on a
 * phone it stays at the foot while the body scrolls under it, and where the
 * page is shorter than the screen, or captured whole, it simply sits at the
 * end, where it belongs. The content above fades out into it — a gradient
 * from nothing to the page colour over the top of the strip, so there is no
 * edge, the way every bottom edge in Pam fades (`edgeFade`). Clear of the
 * home indicator. Nothing goes after it; a footer is the end of a screen.
 */
export interface PageProps {
  readonly children: ReactNode;
  /** `read` widens the column for long prose. */
  readonly width?: 'app' | 'read';
  /** Centres everything, for a screen that is one thought (sign-in). */
  readonly align?: 'start' | 'center';
  /** Space between the things stacked inside. */
  readonly gap?: 0 | 1 | 2 | 3 | 4;
  /**
   * The screen's one action, kept at the foot of the screen (D-326): a
   * `BigButton`, usually. Rendered last, sticky to the bottom edge, with the
   * page fading out above it.
   */
  readonly footer?: ReactNode;
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
  // Room for the footer: its own fade overlaps the last of the content,
  // so the page needs no spacer beyond what the fade is tall.
  withFooter: { paddingBlockEnd: '0px' },
  footer: {
    position: 'sticky',
    bottom: 0,
    zIndex: 11,
    // Full-bleed, past the page's side padding, so the fade covers the
    // whole width of the screen and not just the column.
    marginInline: `calc(-1 * ${pam.screenPadding})`,
    paddingInline: pam.screenPadding,
    // The fade: 56px of the content above washing out into the page colour,
    // then the strip itself, solid, down to the home indicator.
    marginBlockStart: '-24px',
    paddingBlockStart: '56px',
    paddingBlockEnd: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    backgroundImage: `linear-gradient(to bottom, transparent 0px, color-mix(in srgb, ${colorVars['--color-background-body']} 55%, transparent) 22px, color-mix(in srgb, ${colorVars['--color-background-body']} 90%, transparent) 42px, ${colorVars['--color-background-body']} 56px)`,
    // A tap on the faded part lands on what is under it, not on the strip.
    pointerEvents: 'none',
  },
  footerInner: {
    width: '100%',
    maxWidth: pam.pageWidth,
    marginInline: 'auto',
    paddingInline: '8px',
    pointerEvents: 'auto',
  },
});

export function Page({ children, width = 'app', align = 'start', gap = 4, footer }: PageProps) {
  return (
    <main
      {...stylex.props(styles.page, styles[width], align === 'center' && styles.centred, footer ? styles.withFooter : null)}
    >
      <PageEnter>
        <VStack gap={gap} align={align === 'center' ? 'center' : undefined}>
          {children}
        </VStack>
      </PageEnter>
      {footer ? (
        <VStack xstyle={styles.footer}>
          <VStack xstyle={styles.footerInner}>{footer}</VStack>
        </VStack>
      ) : null}
    </main>
  );
}
