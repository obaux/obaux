'use client';

import { useId, type ReactElement } from 'react';
import * as stylex from '@stylexjs/stylex';
import type { Category } from '@pam/config';

/**
 * A small illustration for each kind of place (Will, 5 October, D-287):
 * "instead of bold icons on colored bg, can we create 2D illustration style
 * icons… something that matches style of sign in page carousel".
 *
 * The carousel is flat, angular, faceted colour: blocks cut on the diagonal,
 * objects lit from one side with a darker half for shadow, no outlines, a
 * loud palette (orange, green, purple, pink, yellow). These are the same
 * idea at 56px: a cropped background of two or three shards, and one object
 * drawn as two tones.
 *
 * Every colour is a theme data token (`--color-data-*`), never a raw hex, so
 * the art follows the theme. Decoration only: hidden from screen readers —
 * the card's name and category say what the place is.
 */
export interface CategoryArtProps {
  readonly category: Category;
  /** Square, in px. 56 on a place card. */
  readonly size?: number;
}

// One class per colour used, so nothing is styled inline. Literal strings:
// StyleX compiles these at build time and cannot call a helper.
const c = stylex.create({
  orange3: { fill: 'var(--color-data-orange-3)' },
  orange4: { fill: 'var(--color-data-orange-4)' },
  shamrock2: { fill: 'var(--color-data-shamrock-2)' },
  shamrock3: { fill: 'var(--color-data-shamrock-3)' },
  shamrock4: { fill: 'var(--color-data-shamrock-4)' },
  purple2: { fill: 'var(--color-data-purple-2)' },
  purple3: { fill: 'var(--color-data-purple-3)' },
  purple4: { fill: 'var(--color-data-purple-4)' },
  purple5: { fill: 'var(--color-data-purple-5)' },
  pink2: { fill: 'var(--color-data-pink-2)' },
  pink3: { fill: 'var(--color-data-pink-3)' },
  yellow3: { fill: 'var(--color-data-yellow-3)' },
  yellow4: { fill: 'var(--color-data-yellow-4)' },
  teal3: { fill: 'var(--color-data-teal-3)' },
  red3: { fill: 'var(--color-data-red-3)' },
  red4: { fill: 'var(--color-data-red-4)' },
  tassel: { fill: 'none', stroke: 'var(--color-data-yellow-3)', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' },
  handle: { fill: 'none', stroke: 'var(--color-data-purple-5)', strokeWidth: 3 },
  art: { display: 'block', flexShrink: 0 },
});

const P = ({ d, k }: { d: string; k: stylex.StyleXStyles }) => <path d={d} {...stylex.props(k)} />;

/** School and training: a mortarboard on a stack of books. */
function Education() {
  return (
    <>
      <rect width="56" height="56" {...stylex.props(c.pink2)} />
      <P d="M0 38 56 20v36H0z" k={c.purple3} />
      <P d="M36 0h20v15z" k={c.orange3} />
      {/* Books, each lit from the left. */}
      <P d="M9 40h38v9H9z" k={c.orange3} />
      <P d="M34 40h13v9H34z" k={c.orange4} />
      <P d="M12 31h32v9H12z" k={c.shamrock3} />
      <P d="M34 31h10v9H34z" k={c.shamrock4} />
      {/* The cap. */}
      <P d="M18 21h20v7l-10 4-10-4z" k={c.purple5} />
      <P d="M28 10 47 18 28 26 9 18z" k={c.purple4} />
      <P d="M28 10 47 18 28 26z" k={c.purple5} />
      <path d="M28 18h14v9" {...stylex.props(c.tassel)} />
      <P d="M40.5 26h3v4h-3z" k={c.yellow3} />
    </>
  );
}

/** Work and money: a briefcase. */
function Workforce() {
  return (
    <>
      <rect width="56" height="56" {...stylex.props(c.shamrock2)} />
      <P d="M0 0h30L0 26z" k={c.teal3} />
      <P d="M56 30v26H24z" k={c.shamrock4} />
      <rect x="21" y="12" width="14" height="11" rx="3" {...stylex.props(c.handle)} />
      <rect x="8" y="20" width="40" height="27" rx="4" {...stylex.props(c.orange3)} />
      <P d="M28 20h16a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H28z" k={c.orange4} />
      <P d="M8 30h40v3H8z" k={c.red4} />
      <rect x="24.5" y="27.5" width="7" height="8" rx="1.5" {...stylex.props(c.yellow3)} />
    </>
  );
}

/** Family and food: a grocery bag with greens and an apple. */
function FamilyServices() {
  return (
    <>
      <rect width="56" height="56" {...stylex.props(c.purple2)} />
      <P d="M0 42 56 26v30H0z" k={c.purple4} />
      <P d="M40 0h16v11z" k={c.pink3} />
      {/* What's in the bag, behind its front. */}
      <P d="M21 25 15 9l10 9z" k={c.shamrock3} />
      <P d="M25 25 28 6l4 15z" k={c.shamrock4} />
      <P d="M30 25l8-13-1 13z" k={c.shamrock3} />
      <circle cx="37" cy="23" r="6.5" {...stylex.props(c.red3)} />
      <P d="M37 16.5a6.5 6.5 0 0 1 0 13z" k={c.red4} />
      {/* The bag. */}
      <P d="M13 25h30l3 23H10z" k={c.yellow3} />
      <P d="M28 25h15l3 23H28z" k={c.yellow4} />
      <P d="M13 25h30l-.5 4h-29z" k={c.orange3} />
    </>
  );
}

const ART: Readonly<Record<Category, () => ReactElement>> = {
  education: Education,
  workforce: Workforce,
  family_services: FamilyServices,
};

export function CategoryArt({ category, size = 56 }: CategoryArtProps) {
  const clip = useId();
  const Art = ART[category] ?? Education;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      aria-hidden
      focusable="false"
      {...stylex.props(c.art)}
    >
      <defs>
        <clipPath id={clip}>
          <rect width="56" height="56" rx="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Art />
      </g>
    </svg>
  );
}
