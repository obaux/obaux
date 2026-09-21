'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { Token } from '@astryxdesign/core/Token';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * The thread screen's frame (D-192): the app header and the thread header
 * pinned at the top, the composer pinned at the bottom by `ChatLayout`, and
 * only the messages scrolling between them. Every other screen is `Page` —
 * a column that scrolls with the document. A conversation is the one
 * screen where that is wrong on a phone: the name you are talking to and
 * the box you type in have to stay put while the history moves.
 *
 * So this is a fixed full-viewport flex column, close to `Page`'s own width
 * and side padding, and no `PageEnter` fade: the composer is the thing
 * somebody is reaching for and should not arrive late. `ChatLayout` inside
 * it owns the scroll region and docks the composer as a sticky flex item,
 * so the last message is never under it (the library's own layout
 * contract) — `position: fixed` only takes the frame itself out of the
 * document; it is not what pins the composer within it.
 *
 * `ThreadHeader` is one row (D-193): back, the name, and a `Token` beside
 * it for who they are to you (D-187 — nothing for staff looking at a
 * member). Smaller than a page title, on purpose: this header repeats on
 * every conversation and shares the phone with the conversation itself.
 *
 * No help link on this screen (A14, D-194) — the third screen in PAM
 * without one (a fourth, Messages itself, followed at A15). Back leads to
 * Messages; the person here is already talking to their case manager or
 * program.
 *
 * `frame` is `position: fixed; inset: 0` (Will, 21 September — a dead strip
 * of empty space below the composer, from a phone screenshot). `globals.css`
 * keeps every page's `body` padded at the bottom for the fixed `HelpBar`
 * (72px + the safe area) so a scrolling page never runs its last control
 * under the bar; this screen has no bar (A14) but still sat inside that
 * `body`, so its old `height: calc(100dvh - 72px - …)` reservation — sized
 * to avoid the document scrolling under the frame — left exactly that much
 * dead space between the composer and the true bottom of the screen. Taking
 * the frame out of flow with `position: fixed` removes the problem instead
 * of budgeting around it: `inset: 0` reaches the real viewport edges
 * regardless of what `body`'s own padding reserves, and the composer's dock
 * needs only `env(safe-area-inset-bottom, 0px)` — the actual device inset,
 * not the 72px sized for a bar this screen never draws — to clear a home
 * indicator.
 */

// The same numbers `Page` and `PageTitle` take from `@pam/ui`'s tokens
// (560px column, 48px floor) — written out because a StyleX `defineVars`
// file cannot be imported across the package boundary from here. The side
// gutter uses Astryx's own spacing token instead (imported fine — the
// boundary problem is specific to `@pam/ui`'s own token file, not Astryx's).
const styles = stylex.create({
  frame: {
    position: 'fixed',
    inset: 0,
    width: '100%',
    maxWidth: '560px',
    marginInline: 'auto',
    paddingInline: spacingVars['--spacing-3'],
    paddingBlockStart: spacingVars['--spacing-4'],
    paddingBlockEnd: 'env(safe-area-inset-bottom, 0px)',
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
