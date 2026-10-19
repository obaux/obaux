'use client';

import * as stylex from '@stylexjs/stylex';
import type { NoticeToastSpec } from '@pam/ui';
import { MalfunctionBanner, type MalfunctionBannerProps } from './MalfunctionBanner';
import { NoticeToast } from './NoticeToast';

/**
 * The one stack at the bottom of the screen (D-618, D-619): the toasts for the states a screen is in (a status `Notice`) above, and the banner
 * for what just failed (`useMalfunction`) at the bottom edge, nearest the thumb. One column, so nothing in it can cover another thing in it;
 * the host that holds it sits above the tab bar, the keyboard and the safe area. Loaded once, with the page idle, so it is not in the root
 * bundle and is there when the network is not.
 */
export interface StackNotice {
  readonly id: string;
  readonly spec: NoticeToastSpec;
}

const styles = stylex.create({
  stack: {
    width: '100%',
    maxWidth: '560px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    // The host takes no taps (the page under it stays usable); what is in the stack does.
    pointerEvents: 'auto',
  },
});

export function BottomStack({
  notices,
  banner,
  onCloseNotice,
}: {
  readonly notices: readonly StackNotice[];
  readonly banner: (MalfunctionBannerProps & { readonly seq: number }) | null;
  readonly onCloseNotice: (id: string) => void;
}) {
  return (
    <div {...stylex.props(styles.stack)}>
      {notices.map((notice) => (
        <NoticeToast key={notice.id} spec={notice.spec} onClose={() => onCloseNotice(notice.id)} />
      ))}
      {banner ? <MalfunctionBanner key={banner.seq} {...banner} /> : null}
    </div>
  );
}
