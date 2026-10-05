'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { morphSourceFor, navKindFor, runNavTransition } from '@pam/ui/navTransition';
import { setClientNav } from './navigate';

/**
 * Moving between screens without reloading the app (D-269).
 *
 * Astryx and our own cards draw plain `<a href>`, so until this every tap was
 * a full page load: a white flash, the whole app booted again, and the new
 * screen arriving in one block. This catches a same-site link tap once the
 * page has had its say (a leave guard, the Storybook prototype) and hands it
 * to Next's router instead, inside the move it is — forward, back, tab to tab,
 * or a card growing into its screen (`@pam/ui/navTransition`).
 *
 * Deliberately not `next/link`: that prefetches every link it can see, and a
 * list of thirty places would spend a 3G member's data on thirty screens they
 * will never open (§12). One tap, one screen.
 *
 * Left to the browser, as before: other sites, `tel:`/`sms:`/`mailto:`, new
 * tabs, downloads, files (`/og/invite.jpg`), and a link to the screen already
 * showing with a different `?id=` — those screens read their query once, on
 * load, so a fresh load is what keeps them right.
 */
const SETTLE_MS = 700;

let settle: (() => void) | null = null;

function routable(url: URL): boolean {
  if (url.origin !== window.location.origin) return false;
  const last = url.pathname.split('/').pop() ?? '';
  if (last.includes('.')) return false;
  return url.pathname !== window.location.pathname;
}

export function ClientNav(): null {
  const router = useRouter();
  const pathname = usePathname();

  // The new screen is on the page: let the transition photograph it.
  useEffect(() => {
    settle?.();
  }, [pathname]);

  useEffect(() => {
    /** Changes screen and resolves once the new one has rendered, or after SETTLE_MS. */
    const arrive = (change: () => void) => () =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(done, SETTLE_MS);
        function done() {
          window.clearTimeout(timer);
          if (settle === done) settle = null;
          resolve();
        }
        settle = done;
        change();
      });

    const push = (href: string, source?: HTMLElement | null): boolean => {
      const url = new URL(href, window.location.href);
      if (!routable(url)) return false;
      // A tapped card always opens into its screen, even when that screen is a tab.
      const kind = source ? 'forward' : navKindFor(window.location.pathname, url.pathname);
      runNavTransition(kind, arrive(() => router.push(`${url.pathname}${url.search}${url.hash}`)), source);
      return true;
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const raw = anchor.getAttribute('href') ?? '';
      if (raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return;
      if (push(anchor.href, morphSourceFor(anchor))) event.preventDefault();
    };

    setClientNav((href, mode) => {
      if (mode === 'push') return push(href);
      runNavTransition('back', arrive(() => window.history.back()));
      return true;
    });
    document.addEventListener('click', onClick);
    return () => {
      setClientNav(null);
      document.removeEventListener('click', onClick);
    };
  }, [router]);

  return null;
}
