import * as stylex from '@stylexjs/stylex';

/**
 * Website-only colour tokens (D-528). Mirrors the Figma variable collection
 * "Website" in Pam — Website, one name per variable: `Surface/Page` is
 * `--website-surface-page`. Light and dark in one value, like the app theme.
 *
 * Site only. The app and `@pam/ui` keep using the Astryx theme tokens; nothing
 * here is exported to them. Keep this file and `website-palette.ts` identical;
 * `test/website-tokens.test.ts` checks that they are, and checks contrast.
 */
/**
 * Two variants beyond the Figma set, for the two light pairs that fail AA
 * (Mira, 11 October): `text-muted-strong` is muted text on Gray, Green and
 * Purple surfaces; `text-success` is success-green text on white (page only).
 * Figma keeps Will's values until he chooses.
 *
 * `text-link` (Will, 13 October, D-562): the words of a link. Light is the brand green as before; in dark it is a very light lime
 * (off-white with a hint of green), not the lime `brand-primary`, which stays for icons, chevrons and fills. A link in dark is
 * therefore told from the text round it by an underline or its row, not by colour alone (the two are 1.17:1 apart).
 */
export const website = stylex.defineVars({
  '--website-surface-page': 'light-dark(#FFFFFF, #1B1B1B)',
  '--website-surface-muted': 'light-dark(#F1F1F1, #262626)',
  '--website-surface-gray': 'light-dark(#E2E2E2, #303030)',
  '--website-surface-tint': 'light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06))',
  '--website-surface-ink': 'light-dark(#1B1B1B, #1B1B1B)',
  '--website-surface-brand-soft': 'light-dark(#E7EFE6, rgba(220, 224, 104, 0.14))',
  '--website-surface-brand-deep': 'light-dark(#004033, #004033)',
  '--website-surface-green': 'light-dark(#BCE0BB, #2B422B)',
  '--website-surface-purple': 'light-dark(#F7D5FF, #4A2F51)',
  '--website-surface-veil': 'light-dark(rgba(255, 255, 255, 0.8), rgba(27, 27, 27, 0.8))',
  '--website-text-primary': 'light-dark(#000000, #FFFFFF)',
  '--website-text-secondary': 'light-dark(#474747, #A6A6A6)',
  '--website-text-muted': 'light-dark(#666666, #8F8F8F)',
  '--website-text-on-brand-deep': 'light-dark(#FFFFFF, #FFFFFF)',
  '--website-brand-primary': 'light-dark(#0F5847, #DCE068)',
  '--website-brand-on-primary': 'light-dark(#FFFFFF, #0A1317)',
  '--website-border-subtle': 'light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1))',
  '--website-border-strong': 'light-dark(#D4D4D4, #525252)',
  '--website-border-green': 'light-dark(#AAD4A9, #6AB26B)',
  '--website-border-on-brand-deep': 'light-dark(#FFFFFF, #FFFFFF)',
  '--website-icon-primary': 'light-dark(#171717, #FAFAFA)',
  '--website-icon-shamrock': 'light-dark(#0B603D, #108E5A)',
  '--website-accent-success': 'light-dark(#0B991F, #0B991F)',
  '--website-text-muted-strong': 'light-dark(#595959, #A6A6A6)',
  '--website-text-success': 'light-dark(#087A18, #0B991F)',
  '--website-text-link': 'light-dark(#0F5847, #EEF1C2)',
});
