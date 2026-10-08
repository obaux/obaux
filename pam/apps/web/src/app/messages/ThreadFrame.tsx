'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { SubPageHeader } from '@pam/ui/SubPage';
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
 * `ThreadHeader` is one bar (D-193): back, the name, and under the name who
 * they are to you (D-187 — nothing for staff looking at a member). That
 * line was a `Token` beside the name until 8 October (D-395): a chip beside
 * a name has room for a word, so "Example Food Pantry" read "Example
 * Food …". Under the name it has the whole width and two lines, and says
 * the role with the place — "Program lead at Example Food Pantry". Smaller
 * than a page title, on purpose: this header repeats on every conversation
 * and shares the phone with the conversation itself.
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
 * Never less than 32px, though (Will, 8 October: D-391 "more bottom
 * padding below text box", then D-393 "even more"): on a phone with no home
 * indicator the inset is 0, which left the composer 8px — only its dock's
 * own padding — off the bottom edge; it is 40px now. `max()` keeps the
 * device's inset where it is larger, so an iPhone's composer sits about
 * where it did (its 34px inset, nearly the same).
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
    paddingBlockStart: spacingVars['--spacing-4'],
    paddingBlockEnd: `max(env(safe-area-inset-bottom, 0px), ${spacingVars['--spacing-8']})`,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  // The side gutter is the header's alone (D-390): the conversation under it
  // runs closer to the screen's edges, on Astryx's own 12px list padding and
  // 8px composer dock.
  top: { flexShrink: 0, paddingBlockEnd: '8px', paddingInline: spacingVars['--spacing-3'] },
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
  more: { width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0 },
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

/**
 * The nested-page template in its compact form (D-213): the round back
 * button, then the name in the same bar, with who they are beside it — one
 * row, as D-193 asked, now drawn the way every nested screen starts.
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
      variant="compact"
      title={name}
      backHref={backHref}
      backLabel={backLabel}
      {...(context ? { subtitle: context } : {})}
      actions={
        menuHref ? (
          <IconButton
            label={t('messages.thread.more')}
            href={menuHref}
            variant="ghost"
            icon={<Icon icon="moreHorizontal" size="md" />}
            xstyle={styles.more}
          />
        ) : undefined
      }
    />
  );
}
