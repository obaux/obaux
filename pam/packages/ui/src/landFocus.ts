import * as stylex from '@stylexjs/stylex';

/**
 * Where a dialog or sheet puts focus when it opens (Will, 9 October, D-411:
 * "why are buttons automatically selected on modals … Those should not be
 * auto selected. Only input fields ready to type").
 *
 * A modal has to take focus when it opens — otherwise a screen reader stays
 * on the page behind it, and Tab walks the page it covers. The browser's own
 * choice is the first button inside, which on a phone draws that button as
 * selected, and on a computer makes Enter press it: in "Remove these?" that
 * is Remove. So Pam lands focus on the dialog's content instead — not a
 * control, so nothing looks chosen and Enter does nothing; a screen reader
 * reads the question; Tab goes to the first button.
 *
 * Spread `landFocus` on the element that holds the dialog's content, with
 * `landFocusStyle.quiet` in its xstyle. Both ways in are covered: the
 * `autofocus` attribute is what the browser's `showModal()` honours (Astryx's
 * BottomSheet keeps whatever that chose), and `data-autofocus` is what
 * Astryx's Dialog focuses after it opens. React does not write `autofocus`
 * into the page itself, so the ref does.
 *
 * Not for a dialog whose point is typing: a search or a form puts its field
 * first, ready to type (`hasAutoFocus`), as before.
 */
const markAutofocus = (element: HTMLElement | null) => {
  element?.setAttribute('autofocus', '');
};

export const landFocus = { ref: markAutofocus, tabIndex: -1, 'data-autofocus': '' } as const;

export const landFocusStyle = stylex.create({
  // Not a control, so no focus ring: nothing on it can be pressed.
  quiet: { outlineStyle: 'none' },
});
