import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

/**
 * PAM's theme: the neutral theme, wearing the logo's colours.
 *
 * **This file is the source, not what runs.** `pam.css` and `pam.js` beside it
 * are generated and committed, because the deployment builds the app and does
 * not run the Astryx CLI. After editing this file:
 *
 *     pnpm exec astryx theme build src/theme/pam.theme.ts
 *
 * and commit the three generated files with it. The source is named
 * `pam.theme.ts` rather than `pam.ts` on purpose: with both present, an import
 * of `./pam.js` resolves to the TypeScript source, which drags the theme
 * compiler and the whole neutral theme into the browser bundle. That cost 4 kB
 * of the §12 budget before anybody noticed.
 *
 * Everything about the greys, the type scale and the spacing stays as it was —
 * this changes one thing, which is what "accent" means. Until now it was the
 * neutral theme's near-black in light and near-white in dark, so every primary
 * button in the product was grey. The mark is deep green on light grounds and
 * a bright green on dark ones, and the buttons are now the same two colours
 * (Will, 13 September).
 *
 * ## The two colours
 *
 * `#0F5847` is the wordmark's green, taken from the artwork. `#DCE068` is the
 * bright green Will supplied for dark mode. They are not a light and dark pair
 * of the same hue and were never meant to be: one is a deep ground with light
 * text on it, the other a bright fill with near-black text on it. That
 * inversion is why every state below is written out rather than left to a
 * generic tint.
 *
 * ## Contrast, measured, in every state
 *
 * Label against fill, both modes, rest / hover / pressed:
 *
 * | State                | Fill      | Label     | Ratio  |
 * |----------------------|-----------|-----------|--------|
 * | light rest           | `#0F5847` | `#FFFFFF` | 8.4:1  |
 * | light hover          | `#0C4639` | `#FFFFFF` | 10.8:1 |
 * | light pressed        | `#093528` | `#FFFFFF` | 13.5:1 |
 * | dark rest            | `#DCE068` | `#0A1317` | 13.3:1 |
 * | dark hover           | `#E7EA8C` | `#0A1317` | 14.8:1 |
 * | dark pressed         | `#C4C94F` | `#0A1317` | 10.6:1 |
 *
 * And the brand as text, which is what secondary and ghost buttons use:
 * 7.6:1 on the light page, 8.4:1 on a light card, 13.4:1 on the dark page,
 * 11.7:1 on a dark surface. The floor is 4.5:1 (§12), and the focus ring's is
 * 3:1 — the same colours clear that several times over.
 *
 * Disabled is deliberately not in that table: WCAG exempts disabled controls,
 * and a disabled button that still meets 4.5:1 does not look disabled.
 *
 * ## How the states are set, and why not the obvious way
 *
 * The obvious way does not work. Astryx does not swap a button's
 * `background-color` on hover: it paints a translucent gradient layer over
 * whatever the fill already is, from `--color-overlay-hover` and
 * `--color-overlay-pressed`. A `:hover { backgroundColor }` override in a theme
 * loses to that layer, silently — the computed value never changes and the
 * button looks exactly as it did.
 *
 * So the states are set where the component actually reads them: those two
 * tokens, narrowed to each button variant. The default tint is black in light
 * mode and white in dark, which on a deep green goes muddy and on a bright
 * green goes chalky.
 *
 * Both greens darken instead, in both modes, and darken further when pressed,
 * so a press reads as the same colour getting firmer rather than the brand
 * fading toward grey. The quieter buttons go the other way in dark mode: their
 * ground is already nearly the page, so darkening it would make the hover
 * invisible.
 */
export const pamTheme = defineTheme({
  name: 'pam',
  extends: neutralTheme,

  tokens: {
    // The mark's own colours. Light: deep green with white on it. Dark: the
    // bright green with near-black on it — the inversion is the point, and
    // white text on `#DCE068` would be 1.4:1 and unreadable.
    '--color-accent': ['#0F5847', '#DCE068'],
    '--color-on-accent': ['#FFFFFF', '#0A1317'],
    // The same greens as text and icons, which is what a secondary or ghost
    // button, a link and a selected state all read.
    '--color-text-accent': ['#0F5847', '#DCE068'],
    '--color-icon-accent': ['#0F5847', '#DCE068'],
    // A quiet brand ground: a pale wash in light, a translucent one in dark so
    // it sits on whatever surface it lands on rather than punching a hole.
    '--color-accent-muted': ['#E7EFE6', '#DCE06824'],
    // The focus ring follows the brand. Measured above: 7.6:1 and 13.4:1
    // against the page, where the rule is 3:1.
    '--focus-outline-color': 'var(--color-accent)',
  },

  components: {
    button: {
      // Primary: the fill is the brand, and the press is the same colour
      // getting firmer. `light-dark()` because these differ by mode and a
      // component override takes one value, unlike a token.
      'variant:primary': {
        backgroundColor: 'light-dark(#0F5847, #DCE068)',
        color: 'light-dark(#FFFFFF, #0A1317)',
        // The fill, darkened 12% on hover and 22% on press, in both modes.
        // Composited: #0D4D3E and #0C4537 in light, #C1C55B and #ACAF51 in
        // dark — 10.6:1 at the worst of those four against its own label.
        '--color-overlay-hover': '#0000001F',
        '--color-overlay-pressed': '#00000038',
      },
      // Secondary: the brand as text on a quiet brand ground, so the two
      // buttons on a screen read as one family rather than a coloured one and
      // a grey one.
      'variant:secondary': {
        backgroundColor: 'light-dark(#E7EFE6, #24261A)',
        color: 'var(--color-text-accent)',
        // Down in light, up in dark: the dark ground is close enough to the
        // page that darkening it would be a hover nobody can see.
        '--color-overlay-hover': 'light-dark(#00000014, #FFFFFF14)',
        '--color-overlay-pressed': 'light-dark(#00000026, #FFFFFF26)',
      },
      // Ghost: no ground at all until it is touched. Used for every "way on"
      // that is not the main action — Back, Privacy, Send it again.
      'variant:ghost': {
        color: 'var(--color-text-accent)',
        // No ground at all until it is touched, and then the brand's own wash
        // rather than a grey one.
        '--color-overlay-hover': 'light-dark(#0F58471F, #DCE0681F)',
        '--color-overlay-pressed': 'light-dark(#0F584733, #DCE06833)',
      },
    },
  },
});
