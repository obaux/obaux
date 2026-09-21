'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { Token } from '@astryxdesign/core/Token';

/**
 * The thread screen's frame (D-192): the app header and the thread header
 * pinned at the top, the composer pinned at the bottom by `ChatLayout`, and
 * only the messages scrolling between them. Every other screen is `Page` —
 * a column that scrolls with the document. A conversation is the one
 * screen where that is wrong on a phone: the name you are talking to and
 * the box you type in have to stay put while the history moves.
 *
 * So this is a full-height flex column (`100dvh`, which follows the mobile
 * keyboard) with the same width and side padding as `Page`, and no
 * `PageEnter` fade: the composer is the thing somebody is reaching for and
 * should not arrive late. `ChatLayout` inside it owns the scroll region and
 * docks the composer as a sticky flex item, so the last message is never
 * under it (the library's own layout contract, not a `position: fixed`).
 *
 * `ThreadHeader` is one row (D-193): back, the name, and a `Token` beside
 * it for who they are to you (D-187 — nothing for staff looking at a
 * member). Smaller than a page title, on purpose: this header repeats on
 * every conversation and shares the phone with the conversation itself.
 *
 * No help link on this screen (A14, D-194) — the third screen in PAM
 * without one. Back leads to Messages, which carries the `HelpBar`; and the
 * person here is already talking to their case manager or program.
 */

// The same numbers `Page` and `PageTitle` take from `@pam/ui`'s tokens
// (560px column, 16px gutter, 48px floor) — written out because a StyleX
// `defineVars` file cannot be imported across the package boundary from here.
const styles = stylex.create({
  frame: {
    width: '100%',
    maxWidth: '560px',
    marginInline: 'auto',
    paddingInline: '16px',
    paddingBlockStart: '16px',
    // The viewport less the room `globals.css` keeps under every page for a
    // fixed help bar (72px + the safe area) — this screen has no bar (A14),
    // but the body's padding is still there, and a frame the full viewport
    // tall would let the document scroll by exactly that much under the
    // conversation's own scroll region.
    height: 'calc(100dvh - 72px - env(safe-area-inset-bottom, 0px))',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  top: { flexShrink: 0, paddingBlockEnd: '8px' },
  row: { width: '100%', minHeight: '48px' },
  back: {
    minHeight: '48px',
    minWidth: '48px',
    marginInlineStart: '-10px',
    fontSize: '22px',
    flexShrink: 0,
  },
  name: {
    fontSize: '20px',
    lineHeight: 1.2,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // A long program name is cut, never wrapped: the row stays one row.
  tag: { maxWidth: '40%', flexShrink: 1 },
});

export function ThreadFrame({ children }: { readonly children: ReactNode }) {
  return <main {...stylex.props(styles.frame)}>{children}</main>;
}

/** The pinned block above the messages: the app header, then the thread header. */
export function ThreadTop({ children }: { readonly children: ReactNode }) {
  return (
    <VStack gap={2} xstyle={styles.top}>
      {children}
    </VStack>
  );
}

export function ThreadHeader({
  name,
  context,
  backHref,
  backLabel,
}: {
  readonly name: string;
  /** "Case manager", or the program's name — `null` draws no tag (D-187). */
  readonly context: string | null;
  readonly backHref: string;
  readonly backLabel: string;
}) {
  return (
    <HStack gap={1} align="center" wrap="nowrap" xstyle={styles.row}>
      <IconButton
        label={backLabel}
        icon={<Icon icon="chevronLeft" />}
        variant="ghost"
        href={backHref}
        xstyle={styles.back}
      />
      <Heading level={1} xstyle={styles.name}>
        {name}
      </Heading>
      {context ? <Token label={context} size="sm" xstyle={styles.tag} /> : null}
    </HStack>
  );
}
