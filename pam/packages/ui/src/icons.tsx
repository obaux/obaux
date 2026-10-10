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

/** One figure and a plus. Bring someone along (D-333). */
export function UserPlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3 20a6.5 6.5 0 0 1 13 0" />
      <path d="M19 8v6M16 11h6" />
    </svg>
  );
}

/** A PDF document: a page with its corner turned, "PDF" drawn on it (D-348). */
export function PdfIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M7.6 17.5v-4h1.3a1.25 1.25 0 0 1 0 2.5H7.6M11.1 17.5v-4h.9a2 2 0 0 1 0 4zM16.4 13.5h-1.9v4M14.5 15.5h1.5" strokeWidth={1.2} />
    </svg>
  );
}

/**
 * A page with its corner folded and three lines of writing: a document — a
 * Word file or a Google Doc in a conversation, and the button that adds one
 * (D-399). PDFs keep `PdfIcon`.
 */
export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M8.5 12.5h7M8.5 15.5h7M8.5 18h4" />
    </svg>
  );
}

/** A camera: add or change a photo (D-345). */
/** The camera, filled, its lens cut through (Will, 7 October, D-364): the photo button on Profile. */
/** "More about this": a circled i (D-367). */
export function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6v.4" />
    </svg>
  );
}

export function CameraFilledIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} fill="currentColor" stroke="none" {...props}>
      <path
        fillRule="evenodd"
        d="M5.5 6.5h2l1.5-2.1c.3-.4.7-.6 1.2-.6h3.6c.5 0 .9.2 1.2.6l1.5 2.1h2A2.5 2.5 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5V9a2.5 2.5 0 0 1 2.5-2.5zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
      />
    </svg>
  );
}

export function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.6-2.2h5.4L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

/**
 * A picture: a frame, the sun, a hill. Adds a photo to a message (D-394) —
 * a picture rather than a camera, because the phone's picker offers the
 * photos already on it as well as taking a new one.
 */
export function PhotoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.75" />
      <path d="M4 17l4.6-4.6a1.5 1.5 0 0 1 2.1 0L14 15.7" />
      <path d="M13 14.7l1.9-1.9a1.5 1.5 0 0 1 2.1 0l3 3" />
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

/**
 * One figure, filled. The header's account button (Will, 16 September): the
 * bell beside it is a solid shape, and a line-drawn person next to it read as
 * two different weights of icon rather than one system. Same silhouette as
 * `MeIcon`, closed into one path so it survives a small size the way the bell
 * does — this is the one to reach for beside `BellIcon`, not the outline.
 */
export function MeIconFilled(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} fill="currentColor" stroke="none" {...props}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0 .9.9 0 0 1-.9.9H5.4a.9.9 0 0 1-.9-.9z" />
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
 * exactly this case — so this is one more glyph in Pam's own small set, not a
 * second icon system. Drawn quiet on purpose: no motion lines, no clapper
 * swinging. These are things to attend to, not alarms.
 */
/** The bell in line, like the search glass beside it (Will, 7 October, D-362). */
export function BellOutlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M12 3a6 6 0 0 0-6 6c0 4.4-1.7 6-2.5 6.6h17c-.8-.6-2.5-2.2-2.5-6.6a6 6 0 0 0-6-6z" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

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

/**
 * A bookmark, filled or not.
 *
 * The one icon in the set that carries state rather than naming a destination:
 * filled means kept, outline means not. Filled is drawn the same shape at the
 * same weight, so the two read as one control changing rather than two icons
 * swapping.
 */
export function BookmarkIcon({ isFilled = false, ...props }: SVGProps<SVGSVGElement> & { isFilled?: boolean }) {
  return (
    <svg
      {...svgProps}
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      {...props}
    >
      <path d="M6.5 3.5h11a1 1 0 0 1 1 1V20l-6.5-4-6.5 4V4.5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

/** An arrow leaving a box. Send this to somebody. */
export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M12 3.5v11" />
      <path d="m8 7.5 4-4 4 4" />
      <path d="M5.5 13.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-5.5" />
    </svg>
  );
}

/** A flag on a pole. Tell somebody this listing is wrong. */
export function FlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M6 21V4" />
      <path d="M6 4.5h10.5l-2 3.75 2 3.75H6" />
    </svg>
  );
}

/** A shield. Privacy. */
export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M12 2.5 4.5 5.5v5.7c0 5 3.2 8.6 7.5 10.3 4.3-1.7 7.5-5.3 7.5-10.3V5.5z" />
      <path d="m8.8 12 2.3 2.3 4.1-4.6" />
    </svg>
  );
}

/** A globe. Language. */
export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
    </svg>
  );
}

/** A star. Points — the only place in Pam that keeps a score. */
export function StarIcon({ isFilled = true, ...props }: SVGProps<SVGSVGElement> & { isFilled?: boolean }) {
  // Outlined when not filled — a case manager's "not starred" (D-218).
  return (
    <svg
      {...svgProps}
      fill={isFilled ? 'currentColor' : 'none'}
      stroke={isFilled ? 'none' : 'currentColor'}
      {...props}
    >
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z" />
    </svg>
  );
}


/** A magnifying glass. Explore — the home tab since the 1 October redesign (D-210). */
export function ExploreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

/** A speech bubble. Messages. */
export function MessagesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v10a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17h0A1.5 1.5 0 0 1 4 15.5z" />
    </svg>
  );
}

/** A calendar with a pin on a day. Trips — a visit somebody planned. */
export function TripsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="M12 18.5s-2.75-2.3-2.75-4.1a2.75 2.75 0 0 1 5.5 0c0 1.8-2.75 4.1-2.75 4.1z" />
    </svg>
  );
}

/** Three sliders. Account settings — plainer than a gear at 26px. */
export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1" />
      <circle cx="15" cy="6.5" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="17.5" r="2" />
    </svg>
  );
}

/** A question mark in a circle. Get help — leads to the help screen. */
export function HelpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8" />
      <path d="M12 17.25h.01" strokeWidth={2.25} />
    </svg>
  );
}

/** A bin with a lid. Delete — always behind an "Are you sure?" (D-385). */
export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M4.5 6.5h15M9.5 6.5V4h5v2.5" />
      <path d="M6.5 6.5l1 13.5h9l1-13.5M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

/** A page with lines. Legal — privacy and terms. */
export function LegalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14.5 3.5V8H19M9 12h7M9 15.5h7M9 9h3" />
    </svg>
  );
}

/** A door with an arrow leaving. Sign out. */
export function SignOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M13.5 4H6.5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h7" />
      <path d="M10.5 12h10M17.5 8.5 21 12l-3.5 3.5" />
    </svg>
  );
}

/** Two figures side by side. Connections — the people on a member's side. */
export function ConnectionsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="8.5" cy="8.5" r="3" />
      <circle cx="16" cy="9.5" r="2.5" />
      <path d="M3 19.5a5.5 5.5 0 0 1 11 0M14.5 15a4.5 4.5 0 0 1 6.5 4.5" />
    </svg>
  );
}

/*
 * Place categories (D-212), for Explore's chips — the reference's
 * "Homes / Experiences / Services" row, carrying Pam's three fixed categories
 * (§2.5) instead. Same line weight as the rest of the set, so a chip reads as
 * part of the app rather than a sticker on it.
 */

/** Four squares. Every kind of place. */
export function AllPlacesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

/** A mortarboard. School and training. */
export function EducationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.5v4.25c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V11.5" />
      <path d="M21.5 9.5v5" />
    </svg>
  );
}

/** A briefcase. Work. */
export function WorkforceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
      <path d="M8.5 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2" />
      <path d="M3 12.5h18M10.5 12.5v1.5h3v-1.5" />
    </svg>
  );
}

/** A house with a heart. Help for you and your family. */
export function FamilyServicesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M12 17.5s-3-2.1-3-4a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 1.9-3 4-3 4z" />
    </svg>
  );
}

/** Signal waves, crossed out. No connection — the error a member meets most. */
export function OfflineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.75 16a5 5 0 0 1 6.5 0" />
      <path d="M12 19.5h.01" strokeWidth={2.5} />
      <path d="M3.5 3.5l17 17" />
    </svg>
  );
}

/** A magnifying glass over nothing. A search that found nothing. */
export function NoResultsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5M8.25 8.25l4.5 4.5M12.75 8.25l-4.5 4.5" />
    </svg>
  );
}

/** An arrow pointing back. The nested-page back button (D-213). */
export function BackArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    // Not turned round in Arabic: only text and layout mirror (Will, 10 October 2026).
    <svg {...svgProps} {...props}>
      <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
    </svg>
  );
}

/** An open book. A policy to read — the Legal list's rows. */
export function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M12 6.5c-1.8-1.4-4.5-2-8-2v13c3.5 0 6.2.6 8 2 1.8-1.4 4.5-2 8-2v-13c-3.5 0-6.2.6-8 2z" />
      <path d="M12 6.5v13M14.75 9.5h2.5M14.75 12.5h2.5M14.75 15.5h2.5" />
    </svg>
  );
}

/** A heavy tick. The chosen row in a list of options (D-274). */
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} strokeWidth={3} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** A medal on a ribbon. A member's award level, on Profile (D-274). */
export function AwardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="12" cy="14.5" r="5.5" />
      <path d="M8.5 10.25 5.5 3.5h4l2.5 5M15.5 10.25l3-6.75h-4L12 8.5" />
      <path d="m12 12 .9 1.6 1.8.3-1.3 1.2.3 1.8-1.7-.9-1.7.9.3-1.8-1.3-1.2 1.8-.3z" />
    </svg>
  );
}

/** A pen on a line. A policy still to sign (D-270). */
export function SignIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" />
      <path d="M13 7l4 4M14 20h6" />
    </svg>
  );
}

/** A tick in a circle. A policy signed (D-270). */
export function SignedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.25 12.25l2.5 2.5 5-5.25" />
    </svg>
  );
}

/** A plus. Add a program (D-218). */
export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** A speech bubble with a plus. New message (D-220). */
export function NewMessageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M4.5 5.5h15a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H10l-4.5 3.5V17h-1a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" />
      <path d="M12 8.5v6M9 11.5h6" />
    </svg>
  );
}

/** A clock face. A place's opening hours (D-309). */
export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/** Two sheets, one behind the other. Copy this (D-416). */
export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M15.5 8.5V5.5A2 2 0 0 0 13.5 3.5h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

/** A heavy cross. The thing somebody cannot see or do (D-416). Pairs with CheckIcon. */
export function CrossIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} strokeWidth={3} {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

/** An open eye. What somebody can see (D-416). */
export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** A crossed-out eye. What somebody cannot see (D-416). */
export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="M9.9 5.8A9.5 9.5 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4" />
      <path d="M6.3 7.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3.5 3.5l17 17" />
    </svg>
  );
}
