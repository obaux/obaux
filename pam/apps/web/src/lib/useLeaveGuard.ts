'use client';

import { useEffect, useRef } from 'react';

/**
 * Stop a tap that would leave the screen while something is unfinished
 * (D-255: Saved's Edit, with removals not yet confirmed), and hand its
 * address to `onAttempt` instead — which asks, then goes there itself.
 *
 * Listens on `window` in the capture phase, so it runs before anything on
 * `document` — the prototype's own link handler included — and a cancelled
 * tap is seen as cancelled by everything after it. Next's `<Link>` skips a
 * navigation whose click was cancelled, so the app's tab bar stops too.
 * Only same-site links count: a phone number or another site is not leaving
 * the edit, and an in-page `#anchor` is not leaving at all.
 */
export function useLeaveGuard(isActive: boolean, onAttempt: (href: string) => void): void {
  const attempt = useRef(onAttempt);
  attempt.current = onAttempt;

  useEffect(() => {
    if (!isActive) return;
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      if (href.startsWith('#') || /^(tel:|mailto:|sms:)/i.test(href)) return;
      const resolved = new URL(href, window.location.href);
      if (resolved.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      attempt.current(`${resolved.pathname}${resolved.search}${resolved.hash}`);
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [isActive]);
}
