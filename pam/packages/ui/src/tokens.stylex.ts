import * as stylex from '@stylexjs/stylex';

/**
 * PAM's own sizing floor, from SOP §0 and §2.5.
 *
 * These are not style preferences. A member may be using a cracked prepaid
 * phone in bright sun, with reading glasses they do not have, on their first
 * smartphone in eight years. The numbers below are the accessibility contract:
 *
 *   - 48px minimum touch target, everywhere
 *   - 64px primary buttons (BigButton)
 *   - 18px body text on mobile, 16px on desktop
 *
 * Colour, type family and elevation all come from the Astryx theme. Only the
 * measurements PAM tightens live here.
 */
export const pam = stylex.defineVars({
  touchTargetMin: '48px',
  bigButtonHeight: '64px',
  bodyTextMobile: '18px',
  bodyTextDesktop: '16px',
  cardGap: '12px',
  screenPadding: '16px',
});
