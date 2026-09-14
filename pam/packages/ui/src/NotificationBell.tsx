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
 * **Filled, not ghost** (Will, 14 September). It used to be a quiet outline in
 * the corner, which is what you do with a control people can afford to miss —
 * and this is the opposite: it is the only route to the things that need
 * somebody, and since the home screen stopped carrying a notifications tile it
 * is the *only* route. The brand fill puts the label at 8.4:1 in light and
 * 13.3:1 in dark, where the ghost version depended on the page behind it.
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
  // the rule, not the drawing (§2.5).
  bell: {
    minHeight: pam.touchTargetMin,
    minWidth: pam.touchTargetMin,
    fontSize: '24px',
    borderRadius: '14px',
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
        variant="primary"
        href={href}
        xstyle={styles.bell}
      />
      {hasNew ? <span aria-hidden="true" {...stylex.props(styles.dot)} /> : null}
    </span>
  );
}
