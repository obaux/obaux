# D-502 — Sign in's header stays pinned as the page scrolls: the invite line, then a compact mark bar

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-signin-short`

Will, 11 October (00:54 UTC), relayed by Mira, on the same branch as the short-phone fix (D-500): "we need the header of sign in
screen to stay sticky on top as the user scrolls down, otherwise they lose context."

**What carries the context.** Two things: *who invited them to be what* (the thin black line, D-254) and *what this is*
(the Pam mark, with the language switch). The hero's own big mark and globe are art over a picture and scroll away with it.

**Decided.** On the first step:
- The invite line is pinned (`position: sticky; top: 0`), above everything, always.
- Under it, once the hero has scrolled away (`scrollY > 72px`), a compact bar fades in: the dark/light Pam mark at the
  start and the language switch at the end (`AppHeader`, no home link), on the page's own ground with a thin edge. At
  the top of the page it is hidden (not in the tab order), because the hero already shows both.
- The bar is drawn **over** the content, absolutely positioned under the invite line, not in the flow. Pinning it costs
  the page no height: "Send me a code" is exactly where D-500 left it at 320×568, whole and tappable (the existing tap
  test runs with the bar in the page), and the bar only appears once the reader has scrolled on.
Right to left works because it is `AppHeader`'s own start/end: the mark is on the right in Arabic, the globe on the left.

**The code step ("Enter your code").** Already pinned: its header is the nested-page template (`SubPageHeader`), whose bar is
`position: sticky; top: 0`. Left alone. The invite line is not pinned there: two stuck bars at `top: 0` would cover each
other, and `SubPageHeader` has no offset to stack under the line. If Will wants it there too, `SubPageHeader` needs a
`top` offset (and the line's height measured, since it wraps to two lines in Spanish and Arabic at 320px).

**Checked.** `e2e/signin-short.spec.ts`: 320×568, invited and not, en/es/ar, three projects (light and dark): scrolled by
300px the invite line is at the very top (0px), the compact mark and a button are in the top 130px; back at the top the
button is whole. On the old screen all six fail. Looked at in light and dark, English, Spanish and Arabic.

**A later session might reverse:** the 72px threshold; the bar appearing only after the hero (it could always show, at the
cost of two marks at the top of the first screen).
