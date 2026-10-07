import * as stylex from '@stylexjs/stylex';

/**
 * Pam's own sizing floor, from SOP §0 and §2.5.
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
 * measurements Pam tightens live here.
 *
 * Keys are literal custom-property names (`--pam-…`), as Astryx's are, so the
 * CSS reads `var(--pam-touch-target-min)` rather than a hash, and the same
 * names appear in `styles/tokens.css` for anything reading the system from
 * outside — Claude Design, a designer's inspector, a future native app.
 */
export const pam = stylex.defineVars({
  '--pam-touch-target-min': '48px',
  // A text field's frame, not just its tap area. Astryx's largest input draws a
  // 36px box, which is under Pam's floor: the target was already 48px, so the
  // box you could hit was bigger than the box you could see, and on a phone a
  // person aims at the drawing.
  '--pam-field-height': '56px',
  '--pam-big-button-height': '56px',
  '--pam-body-text-mobile': '18px',
  '--pam-body-text-desktop': '16px',
  '--pam-card-gap': '12px',
  '--pam-screen-padding': '16px',
  /**
   * How wide a screen reads at. Not a phone width — a column that stays
   * readable when the same build is opened on a laptop, which is where staff
   * use Pam.
   */
  '--pam-page-width': '560px',
  /** A page title. One size, so every screen announces itself the same way. */
  '--pam-title-size': '28px',
  /** A link that is not the primary action: readable, and still 48px to hit. */
  '--pam-link-size': '17px',
  /**
   * The bright pink of the tab you are on, and of every "something new" dot
   * (Will, 5 October, D-289: the alert dot "should match the bright pink on
   * menu selected items"). #E31C5F is 4.6:1 on white; #FF6B86 is 6.3:1 on
   * the dark page.
   */
  '--pam-brand-pink': 'light-dark(#E31C5F, #FF6B86)',
  /**
   * A secondary button's pale green (the theme's
   * `.astryx-button[data-variant="secondary"]`), for something that should
   * read as belonging to one: "Link copied" over the friend link (D-338).
   * Keep the two the same.
   */
  '--pam-secondary-fill': 'light-dark(#E7EFE6, #24261A)',
  // The dashed rule (Will, 7 October, D-356): 2px pill-capped dashes, black
  // at 5%. In dark mode the same strength in white, or it would vanish.
  // A badge sitting on a primary button (D-357): the button's green, darker,
  // by laying black over it — so it follows the theme's green in both modes.
  '--pam-on-accent-deep': 'rgba(0, 0, 0, 0.28)',
  // Empty-state icons (Will, 7 October, D-362): a light green line drawing,
  // the same on every empty screen.
  '--pam-empty-icon': 'light-dark(#8FBFA6, #5F8F78)',
  '--pam-rule-dashed': 'light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.08))',
});
