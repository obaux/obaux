'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { SubPageHeader } from '@pam/ui/SubPage';
import { roundAction } from '@pam/ui/roundAction';
import { useI18n } from '@/lib/i18n';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * The thread screen's frame (D-192): the app header and the thread header
 * pinned at the top, the composer pinned at the bottom by `ChatLayout`, and
 * only the messages scrolling between them. Every other screen is `Page` —
 * a column that scrolls with the document. A conversation is the one
 * screen where that is wrong on a phone: the name you are talking to and
 * the box you type in have to stay put while the history moves.
 *
 * So this is a fixed full-viewport flex column at `Page`'s own width, and no
 * `PageEnter` fade: the composer is the thing
 * somebody is reaching for and should not arrive late. `ChatLayout` inside
 * it owns the scroll region and docks the composer as a sticky flex item,
 * so the last message is never under it (the library's own layout
 * contract) — `position: fixed` only takes the frame itself out of the
 * document; it is not what pins the composer within it.
 *
 * `ThreadHeader` is the nested-page template as every other screen you tap
 * into has it (Will, 9 October, D-411 — it was a one-row compact bar, D-193,
 * whose back and ⋯ sat a few pixels off from everywhere else): the round
 * back at the top left and the ⋯ at the top right, in exactly the places
 * they are on Legal or a place, then the name, large, and under it who they
 * are to you on one line (D-187, D-395, D-400 — nothing for staff looking at
 * a member). `ThreadTop` has `Page`'s own padding so the bar lands where
 * `Page` puts it.
 *
 * No help link on this screen (A14, D-194) — the third screen in Pam
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
 *
 * The frame itself has no bottom padding (D-396). The room under the
 * composer (D-391, D-393) is the composer's own, inside `ChatLayout`'s
 * frosted dock — see `ThreadView` — so the conversation runs to the bottom
 * edge and that room is part of the fade, not a strip of bare page under it.
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
    // `Page`'s own top padding, so back and ⋯ land where they do on every
    // nested screen (D-411).
    paddingBlockStart: spacingVars['--spacing-6'],
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  // The side gutter is the header's alone (D-390): the conversation under it
  // runs closer to the screen's edges, on Astryx's own 12px list padding and
  // 8px composer dock. The header's is `Page`'s 16px (D-411). No fade under
  // it any more (Will, 9 October, D-411: "I don't like the fade on top"; it
  // was D-400's blur and white fade): the messages simply go under the edge.
  top: {
    flexShrink: 0,
    paddingBlockEnd: '8px',
    paddingInline: spacingVars['--spacing-4'],
  },
});

export function ThreadFrame({ children }: { readonly children: ReactNode }) {
  return <main {...stylex.props(styles.frame)}>{children}</main>;
}

/** The pinned block above the messages: the thread header, then the visit card, if any. */
export function ThreadTop({ children }: { readonly children: ReactNode }) {
  return (
    <VStack gap={4} xstyle={styles.top}>
      {children}
    </VStack>
  );
}

/**
 * The nested-page template (D-213, D-411): round back, ⋯ in an outline with
 * a shadow so it is not missed, the name large, who they are under it.
 */
export function ThreadHeader({
  name,
  context,
  backHref,
  backLabel,
  menuHref,
}: {
  readonly name: string;
  /** "Case manager", or "Program lead at …" — under the name; `null` draws nothing (D-187, D-395). */
  readonly context: string | null;
  readonly backHref: string;
  readonly backLabel: string;
  /** The ⋯ page — report, the program's details (D-213). */
  readonly menuHref?: string;
}) {
  const { t } = useI18n();
  return (
    <SubPageHeader
      title={name}
      backHref={backHref}
      backLabel={backLabel}
      {...(context ? { subtitle: context, hasOneLineSubtitle: true } : {})}
      actions={
        menuHref ? (
          <IconButton
            label={t('messages.thread.more')}
            href={menuHref}
            variant="ghost"
            icon={<Icon icon="moreHorizontal" size="md" />}
            xstyle={roundAction.button}
          />
        ) : undefined
      }
    />
  );
}
