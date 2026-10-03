'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { Page, Notice } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';

/**
 * The app, clickable, inside one story (D-211).
 *
 * The screens are the app's own (`src/app/**`), unchanged. What this adds is
 * the one thing Storybook lacks — somewhere for a tap to go:
 *
 *   - **Links.** Every same-site `<a href>` click is caught before the iframe
 *     follows it, and the matching screen is drawn instead. `tel:`, `mailto:`,
 *     other sites and new-tab links are left alone.
 *   - **`router.push` / `replace` / `back`** (sign-in, redirects, sign-up's
 *     last step) arrive through `parameters.nextjs.navigation`, wired to
 *     `prototypeRouter` below.
 *   - **`navigate()`** (`src/lib/navigate.ts`) announces `pam:navigate`
 *     first; this cancels it. **`goBack()`** likewise announces `pam:back`
 *     (D-250) — the Storybook router mock never forwards `router.back`.
 *
 * Which screen a path shows comes from Next's own path and search-param
 * contexts, set here — so `useSearchParams()` on the place screen reads the
 * `?id=` the tap carried, exactly as in the app. The pretend database
 * (`journeys/mockSupabase.ts`) answers every query, as in the journeys.
 */
export interface PrototypeRoute {
  readonly render: () => ReactNode;
}

export interface PrototypeAppProps {
  /** Path → screen. Paths end in `/`, as the app's do (`trailingSlash`). */
  readonly routes: Readonly<Record<string, PrototypeRoute>>;
  /** Where the prototype opens. */
  readonly start: string;
  /** Drawn under every screen with the current path — the bottom bar. */
  readonly chrome?: (pathname: string) => ReactNode;
  /**
   * The first screen, as the story already draws it — a journey's own
   * render, with its args. Shown until the first tap; from then on, the
   * route table. Back to the start shows it again.
   */
  readonly first?: ReactNode;
}

const ORIGIN = 'https://pam.prototype';

function normalise(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

/** The current prototype's navigate, for `router.*` calls from the screens. */
type Go = (href: string, mode: 'push' | 'replace' | 'back') => void;
let activeGo: Go | null = null;

/** Hand these to `parameters.nextjs.navigation` so `useRouter()` drives the prototype. */
export const prototypeRouter = {
  push: (href: string) => activeGo?.(href, 'push'),
  replace: (href: string) => activeGo?.(href, 'replace'),
  back: () => activeGo?.('', 'back'),
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
};

export function PrototypeApp({ routes, start, chrome, first }: PrototypeAppProps) {
  const [stack, setStack] = useState<readonly string[]>([start]);
  const current = stack[stack.length - 1] ?? start;
  const url = useMemo(() => new URL(current, ORIGIN), [current]);
  const pathname = normalise(url.pathname);

  const go = useCallback<Go>((href, mode) => {
    setStack((prev) => {
      if (mode === 'back') return prev.length > 1 ? prev.slice(0, -1) : prev;
      const base = new URL(prev[prev.length - 1] ?? '/', ORIGIN);
      const next = new URL(href, base);
      const target = `${normalise(next.pathname)}${next.search}${next.hash}`;
      return mode === 'replace' ? [...prev.slice(0, -1), target] : [...prev, target];
    });
  }, []);

  // `router.*` from the screens.
  useEffect(() => {
    activeGo = go;
    return () => {
      if (activeGo === go) activeGo = null;
    };
  }, [go]);

  // Taps on links, before the iframe follows them.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!anchor || anchor.getAttribute('target') === '_blank' || anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href') ?? '';
      if (/^(tel:|mailto:|sms:)/i.test(href)) return;
      const resolved = new URL(href, window.location.href);
      if (resolved.origin !== window.location.origin) return;
      // A bare in-page anchor (`#top`) scrolls as it would anyway.
      if (href.startsWith('#')) return;
      event.preventDefault();
      go(`${resolved.pathname}${resolved.search}${resolved.hash}`, 'push');
    };
    const onNavigate = (event: Event) => {
      event.preventDefault();
      go(String((event as CustomEvent<string>).detail), 'push');
    };
    const onBack = (event: Event) => {
      event.preventDefault();
      go('', 'back');
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('pam:navigate', onNavigate);
    window.addEventListener('pam:back', onBack);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('pam:navigate', onNavigate);
      window.removeEventListener('pam:back', onBack);
    };
  }, [go]);

  // A new screen starts at its top, or at the section a link named.
  useEffect(() => {
    if (url.hash) {
      const id = decodeURIComponent(url.hash.slice(1));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  }, [current, url.hash]);

  const route = routes[pathname];
  // Still on the opening screen: nothing pushed, nothing replaced it.
  const atFirst = first !== undefined && stack.length === 1 && stack[0] === start;

  return (
    <PathnameContext.Provider value={pathname}>
      <SearchParamsContext.Provider value={url.searchParams}>
        {atFirst ? (
          <ScreenFrame key="first">{first}</ScreenFrame>
        ) : route ? (
          <ScreenFrame key={current}>{route.render()}</ScreenFrame>
        ) : (
          <Page gap={4}>
            <SubPageHeader title="Not in the prototype yet" backHref="/" backLabel="Back" />
            <Notice
              notice="service_not_available"
              title={pathname}
              body="This screen is not wired into the Storybook prototype. Add it to the route table in src/stories/prototype/routes.tsx."
            />
          </Page>
        )}
        {chrome ? chrome(pathname) : null}
      </SearchParamsContext.Provider>
    </PathnameContext.Provider>
  );
}

/** Remounts the screen on every navigation, as the app's full page loads do. */
function ScreenFrame({ children }: { readonly children: ReactNode }) {
  return <>{children}</>;
}
