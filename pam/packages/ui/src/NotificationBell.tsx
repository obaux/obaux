import * as stylex from '@stylexjs/stylex';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BellIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * The bell in the header: that something needs you, and the way to it.
 *
 * A link rather than a button that opens a panel. The list is a screen of its
 * own (§0: a way back, a way to help), and a real link means it survives a
 * dropped connection, can be opened in a new tab, and puts the list in browser
 * history where Back behaves the way anybody expects.
 *
 * **Filled only when there is something new** (Will, 16 September, reversing
 * part of 14 September). The brand fill used to be permanent — the bell was
 * the only route to the things that need somebody, so it stayed lit whether or
 * not anything was waiting. That made "something needs you" and "here is where
 * that list lives" the same colour, so a caught-up caseload looked exactly
 * like an ignored one. The fill is now the news: ghost, bordered like the
 * account button beside it, until there is something unread, and primary only
 * for as long as there is.
 *
 * **The colour is not the only signal.** Even filled, the accessible name
 * carries the count ("Notifications, 2 new"), so the state never depends on
 * seeing the fill at all.
 *
 * **A dot, not a count** (Will, 13 September). "2 new" beside the bell was a
 * second thing to read in a header that is already carrying a wordmark and a
 * role chip, and the exact number changes nothing about what somebody does
 * next: they open the list either way. The dot says "there is something", the
 * list says what.
 *
 * The count does not disappear, it moves. The bell's accessible name becomes
 * "Notifications, 2 new", so a screen reader still hears the number and the dot
 * itself is hidden — a coloured dot alone would be information carried by shape
 * and colour only, which is exactly what WCAG 1.4.1 forbids.
 *
 * Nothing here shouts. These are things to attend to, not emergencies, and an
 * interface that is permanently alarmed teaches people to ignore it.
 */
export interface NotificationBellProps {
  readonly href: string;
  /** "Notifications" — the bell's accessible name. */
  readonly label: string;
  /** Already-filled, e.g. "2 new". Announced, never drawn. */
  readonly unreadLabel?: string;
  readonly unreadCount: number;
}

const styles = stylex.create({
  // The dot is positioned against this, so the wrapper has to be the thing it
  // is positioned against.
  root: { position: 'relative', display: 'inline-flex' },
  // 48px stands even though the glyph is smaller than that: the touch target is
  // the rule, not the drawing (§2.5). Matches the account button's size (Will,
  // 16 September) — the two are read as one pair, not two different weights.
  bell: {
    minHeight: pam.touchTargetMin,
    minWidth: pam.touchTargetMin,
    fontSize: '28px',
    borderRadius: '14px',
  },
  // The quiet state: bordered like the account button, not filled — there is
  // nothing here that needs finding.
  quiet: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  dot: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    // On a filled button the dot has to differ from the fill, so it takes the
    // button's own label colour and a ring of the page behind it.
    backgroundColor: colorVars['--color-error'],
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-background-body'],
  },
});

export function NotificationBell({ href, label, unreadLabel, unreadCount }: NotificationBellProps) {
  const hasNew = unreadCount > 0;

  return (
    <span {...stylex.props(styles.root)}>
      <IconButton
        label={hasNew && unreadLabel ? `${label}, ${unreadLabel}` : label}
        icon={<BellIcon />}
        variant={hasNew ? 'primary' : 'ghost'}
        href={href}
        xstyle={hasNew ? styles.bell : [styles.bell, styles.quiet]}
      />
      {hasNew ? <span aria-hidden="true" {...stylex.props(styles.dot)} /> : null}
    </span>
  );
}
