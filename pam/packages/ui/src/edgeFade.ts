import * as stylex from '@stylexjs/stylex';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * The fade above whatever sits on the bottom edge (D-283, D-284): the tab
 * bar, or a strip resting on it (`FloatingAction`). Put it inside the fixed
 * element, which must be positioned; it hangs 96px above that element's top.
 *
 * One style for every bottom edge, so a strip that sits above the bar and
 * covers the bar's own fade draws the same fade above itself, rather than
 * the fade being painted over the strip (Will, 5 October: "items stuck
 * above the fade... ensure items are visible").
 *
 * Eased, so it is mostly page colour well before the edge. Decoration only:
 * hidden from screen readers, never in the way of a tap.
 */
const FADE = `linear-gradient(to bottom, transparent 0%, color-mix(in srgb, ${colorVars['--color-background-body']} 55%, transparent) 40%, color-mix(in srgb, ${colorVars['--color-background-body']} 90%, transparent) 75%, ${colorVars['--color-background-body']} 100%)`;

export const edgeFade = stylex.create({
  above: {
    position: 'absolute',
    insetInline: 0,
    bottom: '100%',
    height: '96px',
    pointerEvents: 'none',
    backgroundImage: FADE,
  },
  /**
   * The same fade at the foot of something that scrolls and rests on the
   * bar — Trips' drawer (Will, 9 October, D-403: Trips "should look like
   * explore"). Sticky to the bottom of the scroll area, so the list dissolves
   * into the bar exactly as a page does under `above`. Its own 96px at the
   * end of the list is the room the last card scrolls clear into. Put it
   * last in the scrolling element, and give that element no bottom padding:
   * a sticky element stops short of its scroller's padding.
   */
  inScroll: {
    position: 'sticky',
    bottom: 0,
    flexShrink: 0,
    height: '96px',
    pointerEvents: 'none',
    backgroundImage: FADE,
  },
});
