import { useId, type SVGProps } from 'react';

/**
 * The two maps apps a person may open an address in, as app symbols in square
 * frames, in full colour (Will, 9 October 2026: "use their icons, in full
 * colour, app symbol in square frames").
 *
 * These are drawn here, not copied from either company's files, as plain
 * stand-ins that read as the apps they name: Google's pin in its four colours on
 * white, and Apple's map with a highway and a blue arrow. They identify the app
 * in a list; they are not Pam's own art. To use the companies' official artwork
 * instead, replace the contents of these two components — nothing else knows
 * how they are drawn.
 *
 * Not tinted by `currentColor` (an app's icon keeps its colours on a dark
 * page), and `aria-hidden`: the row's words name the app.
 */
const FRAME: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 48 48',
  width: '1em',
  height: '1em',
  'aria-hidden': true,
  focusable: false,
};

/** Google Maps: the four-colour pin on a white square. */
export function GoogleMapsAppIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, '');
  const pin = 'M24 6.5c-7 0-12.7 5.6-12.7 12.5 0 9.4 12.7 22.5 12.7 22.5S36.7 28.4 36.7 19C36.7 12.1 31 6.5 24 6.5Z';
  return (
    <svg {...FRAME} {...props}>
      <defs>
        <clipPath id={`${id}-pin`}>
          <path d={pin} />
        </clipPath>
      </defs>
      <rect x="0.5" y="0.5" width="47" height="47" rx="10.5" fill="#fff" stroke="#dadce0" />
      <g clipPath={`url(#${id}-pin)`}>
        <rect x="8" y="4" width="32" height="40" fill="#4285f4" />
        <rect x="24" y="4" width="16" height="17" fill="#ea4335" />
        <rect x="8" y="4" width="16" height="9.5" fill="#ea4335" />
        <path d="M24 4h16v12.5L30 24 24 21Z" fill="#ea4335" />
        <path d="M30 24l10-7.5V30L33 38Z" fill="#fbbc04" />
        <path d="M8 21l10.5 9L24 41.5V44H8Z" fill="#34a853" />
      </g>
      <circle cx="24" cy="19" r="4.6" fill="#fff" />
    </svg>
  );
}

/** Apple Maps: a map square with a park, water, a yellow highway and a blue arrow. */
export function AppleMapsAppIcon(props: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, '');
  return (
    <svg {...FRAME} {...props}>
      <defs>
        <clipPath id={`${id}-frame`}>
          <rect width="48" height="48" rx="11" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-frame)`}>
        <rect width="48" height="48" fill="#f4f1ea" />
        <path d="M0 0h21L0 24Z" fill="#b9e0a5" />
        <path d="M31 48l17-19v19Z" fill="#a8d4f2" />
        <path d="M-4 40 40-8l6 6L2 46Z" fill="#fff" />
        <path d="M1 44 44 1l3 3L4 47Z" fill="#fbc531" />
        <path d="M10 5h5v43h-5Z" fill="#fff" opacity="0.9" />
        <path d="M25.5 15 36 37l-7-2.6-3.5 7.6-1.4-2.9Z" fill="#1c78f2" stroke="#fff" strokeWidth="2" strokeLinejoin="round" transform="rotate(-18 28 28)" />
      </g>
      <rect x="0.5" y="0.5" width="47" height="47" rx="10.5" fill="none" stroke="#0000001a" />
    </svg>
  );
}
