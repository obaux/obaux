'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { useFitTitle } from './fitTitle.js';

/**
 * A screen's title, large at the top and shrinking into a bar as the page
 * scrolls (D-210, from the reference Will gave on 1 October).
 *
 * Two pieces, one heading: the large title is the page's `<h1>`; the compact
 * bar repeats the words for the eye only (`aria-hidden`), so a screen reader
 * meets the title once. The bar is always there — it is what keeps the
 * screen's actions (the bell, Help) in reach at every scroll position — and
 * it only gains its title and hairline once the large title has scrolled away.
 *
 * Scroll is read from the window rather than observed on the heading: Astryx's
 * `Heading` takes no ref, and a 40px threshold is all the precision this
 * needs.
 */
export interface LargeTitleHeaderProps {
  readonly title: string;
  /** Right-hand actions — the notifications bell and Help. Each 48px. */
  readonly actions?: ReactNode;
  /**
   * Sits on the large title's line, at its end — a case manager's People /
   * Programs switch on Saved (Will, 3 October, D-233).
   */
  readonly titleAccessory?: ReactNode;
  /**
   * The title centred on the page, the accessory centred under it — a
   * program lead's "Coming in / this week ▾" (Will, 7 October, D-352).
   */
  readonly isCentered?: boolean;
  /**
   * The large title read out but not drawn — the accessory stands in for it
   * (a program lead's Day / Week / Month tabs, D-355). It still appears in
   * the bar once the page scrolls.
   */
  readonly isTitleHidden?: boolean;
}

const COLLAPSE_AT = 40;

const sizes = stylex.create({
  title: (px: number) => ({ fontSize: `${px}px` }),
});

const styles = stylex.create({
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    minHeight: '64px',
    marginInline: '-16px',
    paddingInline: '16px',
    backgroundColor: colorVars['--color-background-body'],
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    transitionProperty: 'border-color',
    transitionDuration: '150ms',
  },
  barCollapsed: { borderBottomColor: colorVars['--color-border'] },
  small: {
    fontSize: '20px',
    fontWeight: 700,
    // The compact title shares a row with the buttons. It may be shortened
    // there (the large title above already says it whole), but it may not push
    // the buttons off the screen: in a language with a longer word than
    // English's, the row came out wider than the phone and the page scrolled
    // sideways (text-fit audit, 9 October 2026). In English nothing moves.
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '150ms',
  },
  smallShown: { opacity: 1 },
  // Large and bold, like the reference: the screen says where you are before
  // anything else on it does.
  // 34px, stepping down for a word that will not fit (D-422, `useFitTitle`).
  large: {
    fontSize: '34px',
    lineHeight: 1.15,
    fontWeight: 700,
    paddingBlockEnd: '8px',
    overflowWrap: 'normal',
    hyphens: 'manual',
  },
  largeBreaks: { overflowWrap: 'anywhere' },
  titleRow: { width: '100%', paddingBlockEnd: '8px' },
  largeInRow: { paddingBlockEnd: '0px', minWidth: 0 },
  // Wraps if the phrase is too long for the line, so the words never clip.
  centered: { width: '100%', alignItems: 'center', paddingBlockEnd: '8px' },
  largeCentered: { textAlign: 'center', paddingBlockEnd: '0px' },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
});

export function LargeTitleHeader({
  title,
  actions,
  titleAccessory,
  isCentered = false,
  isTitleHidden = false,
}: LargeTitleHeaderProps) {
  const [collapsed, setCollapsed] = useState(false);
  const fit = useFitTitle<HTMLHeadingElement>(title);
  const fitted = [sizes.title(fit.size), fit.mustBreak && styles.largeBreaks];

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > COLLAPSE_AT);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <HStack
        align="center"
        justify="between"
        wrap="nowrap"
        gap={2}
        xstyle={[styles.bar, collapsed && styles.barCollapsed]}
      >
        <Text xstyle={[styles.small, collapsed && styles.smallShown]} aria-hidden="true">
          {title}
        </Text>
        <HStack gap={1} align="center" wrap="nowrap">
          {actions}
        </HStack>
      </HStack>
      {isCentered ? (
        <VStack gap={1} xstyle={styles.centered}>
          <Heading level={1} ref={fit.ref} xstyle={[styles.large, ...fitted, styles.largeCentered, isTitleHidden && styles.hidden]}>
            {title}
          </Heading>
          {titleAccessory}
        </VStack>
      ) : titleAccessory ? (
        <HStack
          align="center"
          justify="between"
          wrap="nowrap"
          gap={4}
          xstyle={styles.titleRow}
        >
          <Heading level={1} ref={fit.ref} xstyle={[styles.large, ...fitted, styles.largeInRow]}>
            {title}
          </Heading>
          {titleAccessory}
        </HStack>
      ) : (
        <Heading level={1} ref={fit.ref} xstyle={[styles.large, ...fitted]}>
          {title}
        </Heading>
      )}
    </>
  );
}
