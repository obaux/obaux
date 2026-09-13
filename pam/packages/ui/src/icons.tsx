import type { SVGProps } from 'react';

/**
 * Navigation icons.
 *
 * Astryx's semantic icon set is UI chrome — close, chevron, search, microphone.
 * It has nothing for home, map, people, plan or profile, and its docs say to
 * pass an SVG component directly for anything outside that set. These are those
 * components.
 *
 * They copy Astryx's own icon conventions exactly (24 viewBox, no fill,
 * currentColor stroke at 1.5, round caps and joins, 1em box, aria-hidden) so
 * they size and colour identically to a built-in icon wherever they are used.
 *
 * Drawn plainly on purpose. A member may be reading these without their glasses,
 * in sun, on a cracked screen, having not used a phone in years — a clever icon
 * is a worse icon here.
 */

const svgProps: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '1em',
  height: '1em',
  'aria-hidden': true,
};

/** A house. Home. */
export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

/** A map pin. Places. */
export function PlacesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/** Two figures. People. */
export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16.5 5.2a3.5 3.5 0 0 1 0 6.6" />
      <path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </svg>
  );
}

/** A checklist. My Plan. */
export function PlanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M8 2.5v3M16 2.5v3M4 9.5h16" />
      <path d="m8.5 14 2 2 4-4" />
    </svg>
  );
}

/** One figure. Me. */
export function MeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

/** A handset. Help — this one dials. */
export function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M7.5 3.5h-2a2 2 0 0 0-2 2.2A16.5 16.5 0 0 0 18.3 20.5a2 2 0 0 0 2.2-2v-2a1.5 1.5 0 0 0-1.2-1.5l-2.6-.5a1.5 1.5 0 0 0-1.5.6l-.8 1.1a12.5 12.5 0 0 1-5.1-5.1l1.1-.8a1.5 1.5 0 0 0 .6-1.5L10.5 5a1.5 1.5 0 0 0-1.5-1.2z" />
    </svg>
  );
}

/**
 * A bell. Things that have happened and need somebody.
 *
 * Astryx's icon registry has no bell, and its `Icon` takes an SVG component for
 * exactly this case — so this is one more glyph in PAM's own small set, not a
 * second icon system. Drawn quiet on purpose: no motion lines, no clapper
 * swinging. These are things to attend to, not alarms.
 */
export function BellIcon(props: SVGProps<SVGSVGElement>) {
  /*
   * Filled, unlike the navigation icons, which are drawn in line (Will, 13
   * September). It is the one glyph in the set that has to be found rather
   * than read — a solid shape survives a cracked screen, bright sun and a
   * small size in a way an outline does not.
   */
  return (
    <svg {...svgProps} fill="currentColor" stroke="none" {...props}>
      <path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5c0 4.2-1.6 5.6-2.2 6.1a.9.9 0 0 0 .6 1.6h16.2a.9.9 0 0 0 .6-1.6c-.6-.5-2.2-1.9-2.2-6.1A6.5 6.5 0 0 0 12 2.5z" />
      <path d="M9.6 18.4a2.5 2.5 0 0 0 4.8 0z" />
    </svg>
  );
}

/** A pencil. Change what this says. */
export function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}
