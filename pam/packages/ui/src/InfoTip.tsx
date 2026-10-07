'use client';

import { useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Popover } from '@astryxdesign/core/Popover';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { InfoIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * An info tip (Will, 7 October, D-368): a small round icon beside a heading
 * or a name that, tapped, opens a popover of explanation. A phone has no
 * hover, so it is a tap, not a tooltip.
 *
 * **The smaller target is the rule here, on purpose.** Pam's floor is 48px
 * (§2.5); an info tip is 36px (`--pam-touch-target-tip`), a true circle,
 * because it explains and never acts — missing it costs nothing, and at 48px
 * it outweighs the words beside it. Anything that *does* something stays at
 * 48px. The site-wide floor (globals.css) is lowered for this button only.
 *
 * The popover has 20px of padding all round, a realistic shadow (globals.css), and its text is a
 * block, so a wrapped paragraph lines up on the left.
 */
export interface InfoTipProps {
  /** Its spoken name: "About services", "Signed every policy". */
  readonly label: string;
  /** What it explains — text, or a small stack. */
  readonly content: ReactNode;
  /** The mark in the circle; an outline "i" when left out. */
  readonly icon?: ReactNode;
  readonly placement?: 'above' | 'below';
  /** Left out, the tip picks the side it fits on (D-369). */
  readonly alignment?: 'start' | 'center' | 'end';
}

const styles = stylex.create({
  trigger: {
    '--pam-touch-target-min': pam['--pam-touch-target-tip'],
    width: pam['--pam-touch-target-tip'],
    height: pam['--pam-touch-target-tip'],
    minWidth: pam['--pam-touch-target-tip'],
    minHeight: pam['--pam-touch-target-tip'],
    padding: 0,
    borderRadius: '50%',
    flexShrink: 0,
    color: colorVars['--color-text-primary'],
  },
  // 20px all round (Will: 32, 16, 18, then "bring to 20px of padding"):
  // Astryx's popover surface brings 12px, this the other 8.
  body: {
    padding: '8px',
    fontSize: '15px',
    lineHeight: 1.5,
    textAlign: 'start',
  },
});

/** As wide as this, where the screen allows. */
const TIP_WIDTH = 320;
/** Kept clear of the screen's edges. */
const GUTTER = 16;

type Fit = { readonly alignment: 'start' | 'center' | 'end'; readonly width?: number };

/**
 * Where a 320px tip fits, from where its button is (D-369). Astryx gives an
 * aligned popover only the room between the button and one edge, so a tip
 * near the middle of a line came out a word wide. Opening along the button
 * (start), back from it (end), or centred on it — whichever keeps 320px on
 * the screen; on a screen too narrow for any, the side with more room, at
 * whatever width that is.
 */
function fitFor(button: HTMLElement | null): Fit {
  if (!button) return { alignment: 'end' };
  const { left, right } = button.getBoundingClientRect();
  const screen = document.documentElement.clientWidth;
  const width = Math.min(TIP_WIDTH, screen - GUTTER * 2);
  const middle = (left + right) / 2;
  if (left + width <= screen - GUTTER) return { alignment: 'start', width };
  if (right - width >= GUTTER) return { alignment: 'end', width };
  if (middle - width / 2 >= GUTTER && middle + width / 2 <= screen - GUTTER) return { alignment: 'center', width };
  return { alignment: right > screen - left ? 'end' : 'start' };
}

export function InfoTip({ label, content, icon, placement = 'below', alignment }: InfoTipProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [fit, setFit] = useState<Fit>({ alignment: alignment ?? 'end' });
  return (
    <Popover
      label={label}
      placement={placement}
      alignment={fit.alignment}
      width={fit.width}
      onOpenChange={(open) => {
        if (open) setFit(alignment ? { alignment } : fitFor(buttonRef.current));
      }}
      content={
        <VStack gap={2} xstyle={styles.body} data-pam-tip="">
          {content}
        </VStack>
      }
    >
      <Button
        ref={buttonRef}
        label={label}
        variant="ghost"
        isIconOnly
        icon={<HStack>{icon ?? <InfoIcon width={22} height={22} aria-hidden />}</HStack>}
        xstyle={styles.trigger}
      />
    </Popover>
  );
}
