# 2026-10-11 — design signin short

**Branch:** `claude/pam-design-signin-short` · **Lane:** design system & Storybook (Dot)

## What changed

Iris's member flow pass (S1 and W4), urgent. D-500.

- S1: `LegalFooter.tsx` is `LegalLinks`; `Page` gets `isFooterInFlow` (the footer last, in the flow, pushed to the bottom of a
  tall screen, after the content on a short one). Sign in and the expired-invite screen pass the links as their footer. No more
  `position: fixed` bar over the button.
- W4: `TextLink` has a 48px minimum width as well as height ("Sign" on the Trips banner, "Clear" on the signature sheet, and
  every other short link); the policy header's "Done" (`MemberPoliciesView`, Piper's file) has `minWidth: 48px`.
- e2e: `signin-short.spec.ts` (6 cases at 320×568, x3 projects), `tap-targets.spec.ts` (6, x3).

## What was wrong, and what missed it

D-251 pinned the links so they were "always in view" and reserved their height under the content: that holds only while the
content plus the bar fits the screen. Every sign-in check ran at 390×844 or taller; Iris's 320×568 is the first at the height
where it breaks. The 48px rule had a height and no width.
I wrote "D-498" in two comments before claiming; the claim came back D-500 (498 and 499 were taken), so the guesses were
wrong and were corrected before the commit. Sixth time on the number rule.

## Decisions made

D-500.

## Verified

Both new specs fail on the old code the way Iris measured it (S1 invited en/es/ar and not-invited es; the widths 34, 25, 24 and
40px) and pass after. tsc; bundle budget 22.9 kB spare; the whole browser suite once (see the READY), because `TextLink` is
used everywhere.

## Left undone

Not seen on a phone or in WebKit. The footer's old always-on-screen behaviour is gone on short screens by design.
Piper: `MemberPoliciesView.tsx` gained one line (`doneButton.minWidth`).

## Added later the same night: the header stays on top (D-502)

Will, 00:54 UTC via Mira: Sign in's header should stay sticky. On the first step the invite line is pinned and, once the hero is
scrolled away, a compact bar (the mark and the language switch, `AppHeader`) fades in under it, drawn over the content so the
button gets no less room. The code step's bar was already pinned (`SubPageHeader`): left alone, and the invite line is not pinned
there (two bars at `top: 0` would cover each other; `SubPageHeader` has no offset). Tests added to `signin-short.spec.ts`
(6 cases; all fail on the old screen). OnboardingSlides is not touched. I wrote "D-501" in two comments before claiming: it is
Wren's carousel pause; mine came back D-502 and I fixed it before committing (seventh time on the number rule).

## Needs a human

Nothing.
