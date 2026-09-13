import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Badge } from '@astryxdesign/core/Badge';
import { IconButton } from '@astryxdesign/core/IconButton';
import { BellIcon } from './icons.js';

/**
 * The bell in the header: how many things need you, and the way to them.
 *
 * A link rather than a button that opens a panel. The list is a screen of its
 * own (§0: a way back, a way to help), and a real link means it survives a
 * dropped connection, can be opened in a new tab, and puts the list in browser
 * history where Back behaves the way anybody expects.
 *
 * The count is a word, not a dot: "2 new" survives being read aloud and does
 * not depend on seeing a colour. Nothing here shouts — these are things to
 * attend to, not emergencies, and an interface that is permanently alarmed
 * teaches people to ignore it.
 */
export interface NotificationBellProps {
  readonly href: string;
  /** "Notifications" — the bell's accessible name. */
  readonly label: string;
  /** Already-filled, e.g. "2 new". Shown only when something is unread. */
  readonly unreadLabel?: string;
  readonly unreadCount: number;
}

const styles = stylex.create({
  // 48px stands even though the glyph is small: the touch target is the rule,
  // not the drawing (§2.5).
  bell: { minHeight: '48px', minWidth: '48px', fontSize: '22px' },
});

export function NotificationBell({
  href,
  label,
  unreadLabel,
  unreadCount,
}: NotificationBellProps) {
  return (
    <HStack gap={1} align="center" wrap="nowrap">
      <IconButton
        label={label}
        icon={<BellIcon />}
        variant="ghost"
        href={href}
        xstyle={styles.bell}
      />
      {unreadCount > 0 && unreadLabel ? <Badge variant="neutral" label={unreadLabel} /> : null}
    </HStack>
  );
}
