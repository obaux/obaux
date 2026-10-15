# D-500 — Sign in's legal links flow after the content instead of being pinned, so they never cover the button

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-signin-short`

Iris's member flow pass (10 October, `docs/research/2026-10-10-member-flow.md`), relayed by Mira as urgent.

**S1: on a short phone the legal links covered "Send me a code".** `LegalFooter` was `position: fixed` to the bottom
of the screen (D-251) with a spacer under the content. On a 320×568 phone (an iPhone SE, or a 640-tall Android once the
browser bar is counted) the content plus the bar is taller than the screen, so the fixed bar stood over the button, and a
tap on it opened Privacy or Terms. Reproduced as Iris reported: invited in English, Spanish and Arabic, not invited in
Spanish.

**Decided.** Nothing about the legal links is pinned any more. `LegalFooter.tsx` is now `LegalLinks`, the three links,
passed to `Page` as its `footer` with a new `isFooterInFlow`: on a tall screen they sit at the bottom edge (the page is
at least a screen tall and pushes its footer to the end, as `Page`'s footer always has), and on a short one they follow
the content and are reached by scrolling. Nothing can cover the button at any height or language. The existing sticky
`footer` (a place's "Plan a trip", D-326, D-334) is unchanged: that is an action, this is small print.
Given up: the links are no longer always on screen on a short phone. They are one scroll away, and the way in still
carries Help.

**W4: three targets under 48px.** `TextLink` had a 48px minimum height and no minimum width, so a short word was as wide
as its letters: the Trips banner's "Sign" (34px, 25 in Arabic) and the signature sheet's "Clear" (40px). It now has a
48px minimum width as well, which also fixes every other short link in the app. The policy header's "Done" (24px in Arabic,
"تم") is a plain button in `MemberPoliciesView` (Piper's lane): one line, `minWidth: 48px`, and Piper is told.
It stays visually a word; the target is what grew.

**Checked.** `e2e/signin-short.spec.ts`: 320×568, invited and not, en/es/ar, taps the button's exact centre with a raw
mouse click and lands on "Enter your code" (on the old footer: invited en/es/ar and not-invited es fail, not-invited en and
ar pass, which is Iris's matrix). `e2e/tap-targets.spec.ts`: the three controls are 48px or more in English and Arabic (old
sizes measured at 34, 25, 24 and 40px, as she measured them). Full browser suite once, because `TextLink` is everywhere.

**A later session might reverse:** the in-flow links (back to pinned) only with a way to keep them off the button.
