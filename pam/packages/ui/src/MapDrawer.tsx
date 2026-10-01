'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * A drawer over a map, with three resting heights (D-213, from Will's
 * references of 1 October):
 *
 *   - **dock** — a strip just tall enough for its title, so the map has the
 *     screen ("view the map larger … navigate the city by pin"),
 *   - **half** — where it opens: the map above, the list below,
 *   - **full** — 90% of the screen, leaving the search bar on top.
 *
 * Drag the handle to move it; it settles on the nearest height. The handle
 * is also a button — a tap moves up a step (and from the top, back down), so
 * nobody needs to drag, and a keyboard or a switch can work it.
 *
 * Built from Astryx's primitives rather than its `BottomSheet`, on purpose:
 * that is a dialog — it sits over the bottom tab bar, and it always opens at
 * its tallest stop. This one sits on the tab bar and opens halfway.
 */
export type DrawerStop = 'dock' | 'half' | 'full';

export interface MapDrawerProps {
  readonly children: ReactNode;
  /** Drawn under the handle at every height — the title. */
  readonly header: ReactNode;
  /** The handle's names — "Show more trips", "Show the map". */
  readonly expandLabel: string;
  readonly collapseLabel: string;
  /** Pixels kept free under the drawer — the tab bar. */
  readonly bottomOffset?: number;
  /** Pixels kept free above it at full height — the search bar. */
  readonly topOffset?: number;
  readonly initialStop?: DrawerStop;
}

const DOCK = 112;

const styles = stylex.create({
  drawer: {
    position: 'fixed',
    insetInline: 0,
    zIndex: 6,
    marginInline: 'auto',
    width: '100%',
    maxWidth: '560px',
    borderTopLeftRadius: '28px',
    borderTopRightRadius: '28px',
    backgroundColor: colorVars['--color-background-body'],
    boxShadow: '0 -6px 24px light-dark(oklch(0 0 0 / 12%), oklch(0 0 0 / 50%))',
    overflow: 'hidden',
    transitionProperty: 'height',
    transitionDuration: '220ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  dragging: { transitionDuration: '0ms' },
  // Height and offset follow the finger and the screen, so they are values,
  // not classes known ahead of time.
  place: (height: number, bottom: number) => ({ height: `${height}px`, bottom: `${bottom}px` }),
  handleButton: {
    width: '100%',
    minHeight: '32px',
    paddingBlock: '10px 6px',
    borderRadius: 0,
    backgroundColor: 'transparent',
    touchAction: 'none',
    cursor: 'grab',
  },
  grip: {
    width: '40px',
    height: '5px',
    borderRadius: '3px',
    backgroundColor: colorVars['--color-border'],
  },
  header: { paddingInline: '16px', paddingBlockEnd: '8px' },
  body: { flexGrow: 1, minHeight: 0, overflowY: 'auto', paddingInline: '16px', paddingBlockEnd: '24px' },
});

export function MapDrawer({
  children,
  header,
  expandLabel,
  collapseLabel,
  bottomOffset = 0,
  topOffset = 80,
  initialStop = 'half',
}: MapDrawerProps) {
  const [viewport, setViewport] = useState(700);
  useEffect(() => {
    const read = () => setViewport(window.innerHeight);
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  const available = Math.max(viewport - bottomOffset, DOCK + 40);
  const heights: Record<DrawerStop, number> = {
    dock: DOCK,
    half: Math.round(available * 0.5),
    full: Math.max(available - topOffset, DOCK + 40),
  };

  const [stop, setStop] = useState<DrawerStop>(initialStop);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const drag = useRef<{ y: number; h: number; moved: boolean } | null>(null);

  const nearest = useCallback(
    (h: number): DrawerStop =>
      (Object.keys(heights) as DrawerStop[]).reduce((best, s) =>
        Math.abs(heights[s] - h) < Math.abs(heights[best] - h) ? s : best,
      ),
    [heights],
  );

  const step = () => setStop((s) => (s === 'dock' ? 'half' : s === 'half' ? 'full' : 'dock'));

  const height = dragHeight ?? heights[stop];

  return (
    <VStack
      xstyle={[styles.drawer, dragHeight !== null && styles.dragging, styles.place(height, bottomOffset)]}
    >
      <Button
        label={stop === 'full' ? collapseLabel : expandLabel}
        isIconOnly
        variant="ghost"
        icon={<VStack xstyle={styles.grip} />}
        xstyle={styles.handleButton}
        onPointerDown={(e: React.PointerEvent) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, h: heights[stop], moved: false };
        }}
        onPointerMove={(e: React.PointerEvent) => {
          if (!drag.current) return;
          const dy = e.clientY - drag.current.y;
          if (Math.abs(dy) > 4) drag.current.moved = true;
          if (drag.current.moved) {
            setDragHeight(Math.min(Math.max(drag.current.h - dy, DOCK), heights.full));
          }
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (d?.moved && dragHeight !== null) setStop(nearest(dragHeight));
          setDragHeight(null);
        }}
        onClick={() => {
          // A drag ends in a click too; only a tap should step.
          if (dragHeight === null) step();
        }}
      />
      <VStack xstyle={styles.header}>{header}</VStack>
      <VStack xstyle={styles.body} aria-hidden={stop === 'dock' && dragHeight === null ? true : undefined}>
        {children}
      </VStack>
    </VStack>
  );
}
