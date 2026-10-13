'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import type { PostSection } from '../lib/sections';

/**
 * "On this page" for a post (Will, 11 October: "a scrollspy for the posts that connects to headers ... labels summarized but
 * informative ... correct scroll jumping per section so everything is visible"). Two faces of one list, one shown at a time:
 *
 * - `side` (screens 1180px and wider): a column that stays in view beside the post.
 * - `bar` (narrower): a bar stuck to the top of the screen, "On this page" and the section you are in, that opens a list.
 *
 * The section you are in is the last heading above a line a little below the top of the screen (below the bar, on a phone).
 * It is found when a heading crosses that line (an IntersectionObserver; no scroll listener), shown with `aria-current`.
 * A tap scrolls the heading to just under the bar (the headings carry `scroll-margin-top`), smoothly unless the person asked
 * for less motion, and moves focus to the section so a keyboard or screen-reader user lands where the page did.
 */
const styles = stylex.create({
  side: {
    position: 'sticky',
    top: '24px',
    alignSelf: 'start',
    maxHeight: 'calc(100dvh - 48px)',
    overflowY: 'auto',
    paddingBlock: '4px',
    display: { default: 'none', '@media (min-width: 1180px)': 'flex' },
  },
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    marginInline: '-16px',
    paddingInline: '16px',
    backgroundColor: colorVars['--color-background-card'],
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colorVars['--color-border'],
    display: { default: 'block', '@media (min-width: 1180px)': 'none' },
  },
  heading: { fontWeight: 700 },
  link: {
    display: 'block',
    paddingBlock: '10px',
    paddingInlineStart: '12px',
    borderInlineStartWidth: '3px',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: 'transparent',
    minHeight: '24px',
  },
  current: { borderInlineStartColor: colorVars['--color-accent'], fontWeight: 700 },
  barLink: { display: 'block', paddingBlock: '14px', minHeight: '48px', boxSizing: 'border-box' },
  barTrigger: { minHeight: '56px' },
  barLabel: { fontWeight: 700 },
  barCurrent: { opacity: 0.85 },
});

/** How far below the top of the screen a heading is "the one you are in" (the bar is 57px, plus air). */
const LINE = { bar: 96, side: 48 } as const;

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** The sections as the page has them: its own headings, in order. */
function readPage(): PostSection[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-post-section]')).map((el) => ({
    id: el.id,
    label: el.dataset['postSection'] || el.id,
  }));
}

/** Resolves when the page has stopped changing height (a list closing above the target), or after half a second. */
function pageSettled(): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now();
    let last = document.documentElement.scrollHeight;
    let same = 0;
    const tick = () => {
      const h = document.documentElement.scrollHeight;
      same = h === last ? same + 1 : 0;
      last = h;
      if (same >= 4 || performance.now() - started > 500) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function useSpy(ids: readonly string[], line: number): [string, (id: string, settle?: boolean) => void] {
  const [active, setActive] = useState(ids[0] ?? '');
  // After a tap the page is scrolling to its target; the observer must not flick the highlight through the sections on the way.
  const lockUntil = useRef(0);
  const pickRef = useRef<() => void>(() => {});
  // The section a tap chose, kept as the current one until the person scrolls by hand: the last sections of a short post can
  // never reach the top, and the highlight must not fall back to the one before the moment the page stops.
  const pinned = useRef('');

  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pick = () => {
      if (pinned.current) {
        setActive(pinned.current);
        return;
      }
      const wait = lockUntil.current - Date.now();
      if (wait > 0) {
        // still scrolling to where a tap sent the page: look again when it has arrived
        clearTimeout(timer);
        timer = setTimeout(pick, wait + 30);
        return;
      }
      // At the very bottom the last sections of a short post can never reach the line: the last one is the one you are in
      // (Iris, SP1/SP3: "Still stuck?" never became current, and an earlier section stayed marked while off screen).
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2 && window.scrollY > 0;
      if (atBottom) {
        setActive(els[els.length - 1]!.id);
        return;
      }
      // A heading is "the one you are in" once it is in the upper part of the screen, so a section whose text has scrolled
      // away is not left marked while the next one is already showing (Iris, SP3).
      if (window.scrollY < 8) {
        setActive(els[0]!.id);
        return;
      }
      const reach = line + window.innerHeight * 0.25;
      let current = els[0]!.id;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= reach) current = el.id;
        else break;
      }
      setActive(current);
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        pick();
      });
    };
    // The zone is between `line` and the lower 60% of the screen: a heading crossing `line` is an event.
    pickRef.current = pick;
    const io = new IntersectionObserver(pick, { rootMargin: `-${line}px 0px -60% 0px`, threshold: [0, 1] });
    els.forEach((el) => io.observe(el));
    pick();
    window.addEventListener('resize', pick);
    // The IntersectionObserver says nothing when a heading is already past the line and the page then stops at the bottom.
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      io.disconnect();
      window.removeEventListener('resize', pick);
    };
  }, [ids, line]);

  // `settle`: the list above the target is closing, so wait for the page to stop moving before measuring where to scroll.
  const go = useCallback(async (id: string, settle = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    lockUntil.current = Date.now() + (settle ? 1500 : 900);
    if (settle) await pageSettled();
    el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    // When the page has arrived (the browser says so with `scrollend`; a timer stands in where it does not), look once
    // at where it landed: a heading scrolled up to never crosses the line, so the observer would not say.
    const arrived = () => {
      lockUntil.current = 0;
      pickRef.current();
    };
    // A hand on the page (wheel, finger, keys) lets the highlight follow the page again.
    pinned.current = id;
    const release = () => {
      pinned.current = '';
      for (const t of ['wheel', 'touchmove', 'keydown']) window.removeEventListener(t, release);
      pickRef.current();
    };
    for (const t of ['wheel', 'touchmove', 'keydown']) window.addEventListener(t, release, { once: true, passive: true });
    window.addEventListener('scrollend', arrived, { once: true });
    window.setTimeout(arrived, reducedMotion() ? 120 : 1200);
    history.replaceState(null, '', `#${id}`);
    el.focus({ preventScroll: true });
  }, []);

  return [active, go];
}

export function PostNav({ sections, variant }: { readonly sections: readonly PostSection[]; readonly variant: 'side' | 'bar' }) {
  const [items, setItems] = useState<readonly PostSection[]>(sections);
  const [open, setOpen] = useState(false);
  // The page is the truth: a section built inside another component is found here, not in the first render.
  useEffect(() => {
    const found = readPage();
    if (found.length && JSON.stringify(found) !== JSON.stringify(items)) setItems(found);
    // Only on arrival; `items` is what it replaces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ids = items.map((s) => s.id);
  const [active, go] = useSpy(ids, LINE[variant]);
  // Esc closes the open list on a phone (Iris).
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  if (items.length < 2) return null;
  const here = items.find((s) => s.id === active)?.label ?? items[0]!.label;

  if (variant === 'side') {
    return (
      <VStack as="nav" aria-label="On this page" gap={1} xstyle={styles.side}>
        <Text xstyle={styles.heading}>On this page</Text>
        {items.map((s) => (
          <Link
            key={s.id}
            href={`#${s.id}`}
            aria-current={s.id === active ? 'location' : undefined}
            onClick={(e) => {
              e.preventDefault();
              void go(s.id);
            }}
            xstyle={[styles.link, s.id === active && styles.current]}
          >
            {s.label}
          </Link>
        ))}
      </VStack>
    );
  }

  return (
    <VStack as="nav" aria-label="On this page" xstyle={styles.bar}>
      <Collapsible
        isOpen={open}
        onOpenChange={setOpen}
        defaultIsOpen={false}
        trigger={
          <VStack gap={0} xstyle={styles.barTrigger}>
            <Text type="supporting">On this page</Text>
            <Text xstyle={styles.barLabel}>{here}</Text>
          </VStack>
        }
      >
        <VStack gap={0} paddingBlockEnd={2}>
          {items.map((s) => (
            <Link
              key={s.id}
              href={`#${s.id}`}
              aria-current={s.id === active ? 'location' : undefined}
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                void go(s.id, true);
              }}
              xstyle={[styles.barLink, s.id === active && styles.current]}
            >
              {s.label}
            </Link>
          ))}
        </VStack>
      </Collapsible>
    </VStack>
  );
}
