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
  // A text field's frame, not just its tap area. Astryx's largest input draws a
  // 36px box, which is under PAM's floor: the target was already 48px, so the
  // box you could hit was bigger than the box you could see, and on a phone a
  // person aims at the drawing.
  fieldHeight: '56px',
  bigButtonHeight: '64px',
  bodyTextMobile: '18px',
  bodyTextDesktop: '16px',
  cardGap: '12px',
  screenPadding: '16px',
  /**
   * How wide a screen reads at. Not a phone width — a column that stays
   * readable when the same build is opened on a laptop, which is where staff
   * use PAM.
   */
  pageWidth: '560px',
  /** A page title. One size, so every screen announces itself the same way. */
  titleSize: '28px',
  /** A link that is not the primary action: readable, and still 48px to hit. */
  linkSize: '17px',
});
