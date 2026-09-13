'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import * as stylex from '@stylexjs/stylex';
import { PAM_MOTION } from './motion-tempo.js';

/**
 * How PAM moves, and who pays for it.
 *
 * Motion here is doing a job, not decorating: it says where a thing came from,
 * that a tap landed, and that something left rather than vanished. The tempo
 * lives in `motion-tempo.ts` — under a quarter second, opacity and transform
 * only, because those are what a cheap phone animates without stuttering.
 *
 * ## Animation is a separate download, and an optional one
 *
 * Nothing in this file imports framer-motion. The implementations are in
 * `motion-runtime.tsx`, imported dynamically, so the library is a chunk of its
 * own that is never part of the app's first load — the budget check measures it
 * separately and fails the build if it ever leaks in (Will, 13 September).
 *
 * It is fetched only when the connection can carry it. A member on 2G, or with
 * Data Saver on, gets PAM with no animation chunk at all: every component below
 * renders a plain wrapper, every screen works, nothing waits. On a $40 prepaid
 * plan, 37 kB of easing curves is not a trade PAM gets to make on their behalf.
 *
 * `navigator.connection` is Chromium-only — which is most Android phones, the
 * population this protects. Elsewhere the check is absent and motion loads,
 * which is the right default for a browser that will not say.
 *
 * ## Why the page fade is CSS and everything else is not
 *
 * A screen's arrival wraps the entire page, and swapping the wrapper when the
 * chunk lands would remount the page under somebody's fingers — the first
 * version did exactly that, and the field somebody was typing in lost focus a
 * second after the page loaded. So the page fade is a CSS animation: it costs
 * nothing, runs on every connection, and never changes shape.
 *
 * A press is CSS for a sharper reason: `Press` wraps every primary button in
 * the app, so swapping it when the chunk lands remounts a button — and a tap
 * that lands in that window hits a node that is being replaced and does
 * nothing. A dropped tap on the one button a member came to press is not a
 * trade worth 120ms of scale, so it is a `:active` rule, which costs nothing
 * and cannot remount.
 *
 * What is left for the runtime — a card arriving, a square wiping away — wraps
 * small subtrees with no pending interaction in them, where a swap is invisible.
 */

interface MotionRuntime {
  readonly CardEnterImpl: ComponentType<{ children: ReactNode; index?: number }>;
  readonly ScrollRevealImpl: ComponentType<{ children: ReactNode; index?: number }>;
  readonly MaskedListImpl: ComponentType<{ children: ReactNode }>;
  readonly MaskedItemImpl: ComponentType<{ children: ReactNode; className?: string }>;
}

const RuntimeContext = createContext<MotionRuntime | null>(null);

/**
 * Whether this connection should pay for animation.
 *
 * No for Data Saver, no for 2G. Read once on mount: a member whose signal drops
 * mid-session has already downloaded the chunk, and taking the motion away
 * again would make the app feel broken at the worst possible moment.
 */
function connectionCanAfford(): boolean {
  if (typeof navigator === 'undefined') return false;

  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;

  if (!connection) return true;
  if (connection.saveData) return false;
  return connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g';
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<MotionRuntime | null>(null);

  useEffect(() => {
    if (!connectionCanAfford()) return;
    let cancelled = false;

    void import('./motion-runtime.js')
      .then((mod) => {
        if (!cancelled) setRuntime(mod as unknown as MotionRuntime);
      })
      .catch(() => {
        // The chunk never arrived. The app has been working without it since
        // the first paint, and will carry on.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // The provider itself never changes shape — only the value it carries. That
  // is what keeps the tree mounted when the chunk lands.
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

const styles = stylex.create({
  full: { width: '100%' },
  press: {
    display: 'block',
    width: '100%',
    // The press itself: 97% while held, back on release. `:has()` so the scale
    // follows the button's own active state rather than the wrapper's, and
    // transform only, so nothing around it moves.
    transform: { default: 'none', ':has(:active)': 'scale(0.97)' },
    transitionProperty: 'transform',
    transitionDuration: '120ms',
    '@media (prefers-reduced-motion: reduce)': {
      transform: 'none',
      transitionDuration: '0s',
    },
  },
  /**
   * The page's arrival, in CSS.
   *
   * Eight pixels and a fade, not a slide: a page that travels across the screen
   * on every navigation is a page somebody waits for. Suppressed for anybody
   * who asked their phone for less motion — the one animation in PAM that has
   * to make that check itself, because it is not inside the runtime that makes
   * it for everything else.
   */
  page: {
    width: '100%',
    animationName: stylex.keyframes({
      from: { opacity: 0, transform: 'translateY(8px)' },
      to: { opacity: 1, transform: 'none' },
    }),
    animationDuration: '240ms',
    animationTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
  },
});

/** A screen arriving. CSS, so it costs nothing and never remounts anything. */
export function PageEnter({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.page)}>{children}</div>;
}

/** A card arriving in its turn, staggered 40ms a row and capped at six. */
export function CardEnter({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const runtime = useContext(RuntimeContext);
  if (!runtime) return <div {...stylex.props(styles.full)}>{children}</div>;
  return <runtime.CardEnterImpl index={index}>{children}</runtime.CardEnterImpl>;
}

/**
 * A card arriving as it is scrolled to, once.
 *
 * `once` matters: a row that re-animates every time it passes the fold is a
 * page that never settles, and on a list somebody is scanning for an address
 * that is actively unhelpful.
 */
export function ScrollReveal({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const runtime = useContext(RuntimeContext);
  if (!runtime) return <div {...stylex.props(styles.full)}>{children}</div>;
  return <runtime.ScrollRevealImpl index={index}>{children}</runtime.ScrollRevealImpl>;
}

/**
 * A tap, acknowledged: three per cent for 120ms.
 *
 * Enough that a thumb covering the button still feels the press at the edges,
 * small enough that nothing reflows — and the one piece of motion in PAM a
 * member will feel hundreds of times.
 */
export function Press({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.press)}>{children}</div>;
}

/** A list whose items leave under a mask rather than blinking out. */
export function MaskedList({ children }: { children: ReactNode }) {
  const runtime = useContext(RuntimeContext);
  if (!runtime) return <>{children}</>;
  return <runtime.MaskedListImpl>{children}</runtime.MaskedListImpl>;
}

export function MaskedItem({ children, className }: { children: ReactNode; className?: string }) {
  const runtime = useContext(RuntimeContext);
  if (!runtime) return <div className={className}>{children}</div>;
  return <runtime.MaskedItemImpl className={className}>{children}</runtime.MaskedItemImpl>;
}

export { PAM_MOTION };
