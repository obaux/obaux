/**
 * How one screen gives way to the next (D-269).
 *
 * The browser's own View Transitions API does the work: it photographs the
 * screen, lets the change happen, then animates from the photograph to the
 * new screen. The animations themselves are CSS in the app's `globals.css`,
 * keyed on `html[data-pam-nav]`, which this sets for the length of one
 * transition:
 *
 *   - `forward` — into something: the new screen slides in from the right.
 *   - `back` — out again: the reverse.
 *   - `tab` — between two tabs of the bottom bar: a quick cross-fade, since
 *     neither is "deeper" than the other.
 *   - `morph` — a tapped card grows into the screen it opens.
 *
 * Nothing here downloads anything, and nothing runs at all where the browser
 * has no View Transitions, where somebody asked their phone for less motion,
 * or on a connection the motion chunk already stays away from (D-104) — the
 * change simply happens, as it always did.
 */
export type NavKind = 'forward' | 'back' | 'tab' | 'morph';

/** The bottom bar's places (`TabBar`'s default hrefs). */
const TAB_PATHS: ReadonlySet<string> = new Set(['/', '/saved/', '/trips/', '/program/', '/messages/', '/profile/']);

function pathOf(href: string): string {
  const path = href.split(/[?#]/)[0] || '/';
  return path.endsWith('/') ? path : `${path}/`;
}

function depth(path: string): number {
  return path.split('/').filter(Boolean).length;
}

/** Which way a move from `from` to `to` goes, judged from the two paths. */
export function navKindFor(from: string, to: string): NavKind {
  const a = pathOf(from);
  const b = pathOf(to);
  const aTab = TAB_PATHS.has(a);
  const bTab = TAB_PATHS.has(b);
  if (aTab && bTab) return 'tab';
  // Up to a tab from somewhere inside one, or to a shallower path: going back.
  if (bTab || depth(b) < depth(a)) return 'back';
  return 'forward';
}

interface ViewTransitionLike {
  readonly finished: Promise<void>;
  readonly ready: Promise<void>;
}
type StartViewTransition = (update: () => Promise<void> | void) => ViewTransitionLike;

function canAnimate(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  if (typeof (document as { startViewTransition?: unknown }).startViewTransition !== 'function') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') return false;
  return true;
}

/**
 * The card a tap landed in, if it opens a screen of its own: an Astryx
 * `ClickableCard`, anything marked `data-pam-morph`, or a plain card whose
 * one link is the one tapped (a place card's name). A card holding several
 * links is a list, not a door, and does not grow.
 */
export function morphSourceFor(target: EventTarget | null): HTMLElement | null {
  const el = target instanceof Element ? target : null;
  const marked = el?.closest<HTMLElement>('[data-pam-morph], .astryx-clickable-card');
  if (marked) return marked;
  const card = el?.closest<HTMLElement>('.astryx-card');
  if (card && card.querySelectorAll('a[href]').length === 1) return card;
  return null;
}

const MORPH = 'pam-morph';
let current = 0;

/**
 * Runs `update` — the change of screen — inside a transition of `kind`.
 *
 * `source` is the card that was tapped: given one on a forward move, the
 * card itself becomes the new screen. It carries the shared name only in the
 * photograph of the old screen, and the new screen's page body
 * (`[data-pam-page]`, from `Page`) only in the new one, so the name is never
 * on two elements at once.
 */
export function runNavTransition(
  kind: NavKind,
  update: () => Promise<void> | void,
  source?: HTMLElement | null,
): void {
  if (!canAnimate()) {
    void update();
    return;
  }

  const root = document.documentElement;
  const token = ++current;
  const morph = kind === 'forward' && source ? source : null;
  if (morph) morph.style.viewTransitionName = MORPH;
  root.dataset.pamNav = morph ? 'morph' : kind;

  let page: HTMLElement | null = null;
  const start = (document as unknown as { startViewTransition: StartViewTransition }).startViewTransition.bind(
    document,
  );
  const transition = start(async () => {
    if (morph) morph.style.viewTransitionName = '';
    await update();
    if (morph) {
      // A screen without `Page` (Trips' full-bleed map) marks its own body.
      page = document.querySelector<HTMLElement>('[data-pam-page], [data-pam-morph-target]');
      if (page) page.style.viewTransitionName = MORPH;
    }
  });

  transition.ready.catch(() => {});
  transition.finished
    .catch(() => {})
    .then(() => {
      if (page) page.style.viewTransitionName = '';
      if (token === current) delete root.dataset.pamNav;
    });
}
