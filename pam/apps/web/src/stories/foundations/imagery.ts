/**
 * Every raster image and brand mark Pam ships, for Foundations › Imagery
 * (Will, 7 October: "bring in photos and treat it all under storybook for
 * easy handoff"). The vector illustrations are listed from code instead
 * (`SETUP_ART_KINDS`, `CATEGORIES`, `BADGE_ART_KEYS`).
 *
 * `imagery.test.ts` fails if a file in `apps/web/public` is not listed here,
 * so nothing ships without a place in the inventory.
 */
export interface ImageryItem {
  /** Path under `apps/web/public`, as the app serves it. */
  readonly src: string;
  readonly name: string;
  /** Where it is used, and the decision that put it there. */
  readonly note: string;
  /** Other sizes of the same picture, also in `public`. */
  readonly alsoAt?: readonly string[];
  /** Shown on a dark ground (a white mark). */
  readonly isOnDark?: boolean;
}

export const PHOTOGRAPHS: readonly ImageryItem[] = [
  { src: '/onboarding/hero-city.webp', name: 'Sign in, slide 1', note: 'A place to look — commissioned illustration (D-135)' },
  { src: '/onboarding/hero-phone.webp', name: 'Sign in, slide 2', note: 'A person to ask (D-135)' },
  { src: '/onboarding/hero-sneakers.webp', name: 'Sign in, slide 3', note: 'A plan to go (D-135)' },
  {
    src: '/friend/bring-a-friend-800.webp',
    name: 'Bring a friend',
    note: 'The friend drawer (D-337)',
    alsoAt: ['/friend/bring-a-friend-1200.webp'],
  },
  { src: '/og/invite.jpg', name: 'Invite link preview', note: 'Shown when a link is pasted into a text (D-263)' },
];

export const BRAND: readonly ImageryItem[] = [
  { src: '/pam-wordmark-light.svg', name: 'Wordmark, for light grounds', note: 'Sign in, About Pam' },
  { src: '/pam-wordmark-dark.svg', name: 'Wordmark, for dark grounds', note: 'Dark mode', isOnDark: true },
  { src: '/pam-wordmark-white.svg', name: 'Wordmark, white', note: 'Over pictures (the sign-in carousel)', isOnDark: true },
  { src: '/email/pam-logo.png', name: 'Email logo', note: 'Invite and renewal emails (D-263)' },
  {
    src: '/icon-512.png',
    name: 'App icon',
    note: 'The wordmark\'s "p" on Pam green: the icon of every Pam website — this app, the public site, Storybook (D-437). Made by scripts/make-icons.mjs; the favicon and Apple touch icon are drawn from the same source',
    alsoAt: ['/icon-192.png'],
  },
  {
    src: '/icon-maskable-512.png',
    name: 'App icon, maskable',
    note: 'The same "p", full bleed and smaller, so an Android launcher can crop it to any shape (D-437)',
  },
  {
    src: '/maps/google-maps.webp',
    name: 'Google Maps',
    note: "Google's pin on its light grey, in the Open in… drawer on an address (D-439). A third party's mark, there only to say which app a link opens.",
  },
  {
    src: '/maps/apple-maps.webp',
    name: 'Apple Maps',
    note: "Apple's icon, cropped 5% in so its corners and edge glow are outside a 22% rounded frame (the same radius as Google's), in the Open in… drawer (D-439). Also a third party's mark.",
  },
];
