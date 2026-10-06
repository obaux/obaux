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

/**
 * How many screens deep inside Pam this tab is (D-277): up by one on every
 * move made here, down by one when the browser itself goes back. A back
 * button goes back through history while this is above zero — to wherever
 * the member came from, not a fixed screen — and to its own `href` when it
 * is not (a shared link opened cold). Kept for the tab, so a reload keeps
 * the count the history still has. The browser's forward button is not
 * counted; a wrong count only means a back button uses its fixed target.
 */
const DEPTH_KEY = 'pam.nav.depth';

function depth(): number {
  try {
    return Math.max(0, Number(sessionStorage.getItem(DEPTH_KEY)) || 0);
  } catch {
    return 0;
  }
}

function setDepth(next: number): void {
  try {
    sessionStorage.setItem(DEPTH_KEY, String(Math.max(0, next)));
  } catch {
    // Storage off: every back button uses its fixed target.
  }
}

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
      setDepth(depth() + 1);
      return true;
    };

    const back = (): boolean => {
      if (depth() === 0) return false;
      runNavTransition('back', arrive(() => window.history.back()));
      return true;
    };
    const onPop = () => setDepth(depth() - 1);

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const raw = anchor.getAttribute('href') ?? '';
      if (raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return;
      // A back button (D-277): through history when there is some.
      if (anchor.hasAttribute('data-pam-back') && back()) {
        event.preventDefault();
        return;
      }
      if (push(anchor.href, morphSourceFor(anchor))) event.preventDefault();
    };

    setClientNav((href, mode, steps) => {
      if (mode === 'push') return push(href);
      // `goBack()`: one screen, the browser's own way (D-250).
      if (steps === undefined) {
        runNavTransition('back', arrive(() => window.history.back()));
        return true;
      }
      // Out of a flow (D-279): only as far as Pam's own history goes — a
      // flow opened cold answers false and goes to its fallback. One
      // popstate arrives for the whole jump, so the count is brought down by
      // all but that one here.
      if (depth() < steps) return false;
      setDepth(depth() - steps + 1);
      runNavTransition('back', arrive(() => window.history.go(-steps)));
      return true;
    });
    document.addEventListener('click', onClick);
    window.addEventListener('popstate', onPop);
    return () => {
      setClientNav(null);
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
    };
  }, [router]);

  return null;
}
