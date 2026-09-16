import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';

/**
 * Waiting.
 *
 * Every screen in PAM used to say "Finding places nearby..." while it worked
 * out who was signed in — including the ones that were not finding places.
 * Moving between tabs is a full page load in a static export, so that sentence
 * was what a person saw on the way to their account, their saved list, and the
 * case manager's screen (Will, 16 September). Copy that is wrong three screens
 * out of four teaches people not to read it.
 *
 * A spinner says the one thing that is true everywhere — something is
 * happening, wait — without claiming to know what. It is Astryx's, so it
 * carries `role="status"`, and under `prefers-reduced-motion` it slows to a
 * third of its speed rather than stopping: a still ring in the middle of an
 * empty screen reads as a broken image, and the promise made to somebody who
 * asked for less motion was less, not none.
 *
 * The label is announced and never drawn. A screen reader hears "Loading"; the
 * eye gets the ring, which needs no words in any language.
 *
 * **`screen`** fills the space under the header and centres in it, so the ring
 * lands in the middle of the phone rather than tucked under the mark. Sized in
 * `vh` on purpose: this state exists before anything below it has a height, so
 * there is nothing to measure against.
 *
 * **`inline`** is for a list still arriving under a header that is already
 * drawn — the places, a caseload, the directory. Centring it in the viewport
 * there would put it over content that is already on screen.
 */
export interface LoadingProps {
  /** Localised, e.g. "Loading". Announced to screen readers, never drawn. */
  readonly label: string;
  /** `screen` centres in the window; `inline` sits in the flow. */
  readonly variant?: 'screen' | 'inline';
}

const styles = stylex.create({
  box: { width: '100%' },
  /*
   * The window, less the header and the page's own padding. Not 100vh: that
   * would push the help bar under the fold on a short screen, and the one
   * control on this screen is the one a person on a dying connection actually
   * needs.
   */
  screen: { minHeight: '60vh' },
  inline: { paddingBlock: '40px' },
});

export function Loading({ label, variant = 'screen' }: LoadingProps) {
  return (
    <HStack justify="center" align="center" xstyle={[styles.box, styles[variant]]}>
      {/*
        Astryx's largest spinner is a 28px ring, and this is often the whole of
        what somebody can see — read in bright sun, by somebody who does not
        have their glasses. The theme redraws `xl` at 40px: the size lives
        there because `--spinner-diameter` is a themeable variable and `xstyle`
        does not take custom properties.
      */}
      <Spinner size="xl" aria-label={label} />
    </HStack>
  );
}
