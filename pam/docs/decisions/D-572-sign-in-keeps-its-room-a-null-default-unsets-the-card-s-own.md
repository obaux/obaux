# D-572 — Sign in keeps its room: a null default unsets the card's own spacing

**Date:** 2026-10-14 · **Branch:** `claude/pam-design-signin-spacing`

**Raised by:** Will, 14 October 04:47, on Ava's Sign in picture (card a84): "what happened to the gap spacing in the sign-in screen? Something's off."

**What happened.** My D-564 (13 October, short-screen fit) wrote `rowGap: { default: null, '@media (max-height: 640px)': '8px' }` on the card's stack, the same on the hero's brand group, and `paddingBlockStart` / `paddingBlockEnd: { default: null, … }` on the card, meaning "leave it alone unless the screen is short". In StyleX a `null` default is not "no opinion": merged over the component's own style it **unsets** it. So `VStack gap={3}`, `Card padding={5}` and the brand group's gap vanished on **every** screen, not just short ones. Checked on `main` (36cd4651) at 390×844: the title sat 4px under the picture, the label, field, "Send me a code" and the consent line touched (0px between), and 100px of nothing followed before the legal links. It reached `main` with b32 and is on every Sign in since. My tests measured the 320×568 fit, where the tight values are right, so none of them looked at a normal phone.

**The fix.** The default is now the token the component had: `spacingVars['--spacing-3']` for the stack's `rowGap`, `['--spacing-5']` for the card's top and bottom padding, `['--spacing-4']` for the brand group's gap, and the 8px / 12px short values only under 640px tall, as D-564 meant. At 390×844 the picture to title is 24px, title to label 12px, label to field 8px, field to button 12px, button to consent line 12px (it was 4, 0, 8, 0, 0).

**The small phone.** Giving the room back pushed the legal links off the fold at 375×667 (an iPhone SE, taller than the 640px rule). The slide gives a little there: from 641 to 720px tall it is `clamp(256px, 46vh, 520px)` (it was 50vh), so at 375×667 everything, legal links included, ends at 659 of 667. The tier is exclusive of the 640px rule on purpose: written as `max-height: 720px` it also matched under 640 and, coming later, won and pushed the 320×568 case 20px down (found by the 42-case fit run; fixed).

**Checked.** The 42 fit cases (7 languages × 320×568, 360×640, 390×844 × invited or not): 0 not fitting, the same numbers as before (ru 553, pt-BR 542, en 503 of 568 at 320×568). `signin-short.spec.ts` has a new test at 390×844 and 375×667: the gaps above, and everything above the fold. signin-short, consent, signin-next, signin-wrong-code and join specs pass at narrow-320. Pictures, before and after at both sizes, light and dark: `docs/design/review/2026-10-14-signin-spacing/`.

**A rule for later.** Never use `null` as the default of a conditional style over a component prop (`gap`, `padding`): give the token's value. Rewrote nothing else; I searched `apps/web/src/app/signin` and `packages/ui/src` for other `default: null` and found only these three, now fixed.
