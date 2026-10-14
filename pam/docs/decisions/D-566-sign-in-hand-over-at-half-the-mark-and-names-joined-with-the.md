# D-566 — Sign in hand-over at half the mark, and names joined with the language's own comma

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-signin-polish`

Iris's b32 walk-through (P1, P5), relayed by the merge desk. Polish, nothing blocks.

**P1 — the hand-over.** The compact bar's `IntersectionObserver` (D-564) used threshold 0, so the bar appeared only once the hero's Pam mark had left view completely. Between about 56 and 64px of scroll the mark was a 4–8px sliver with no bar yet. The bar now shows when less than half the mark is in view (`intersectionRatio < 0.5`, thresholds 0, 0.5, 1). At 320×568 it takes over at about 48px of scroll, drawn over the hero on its white background, so no sliver shows and there is no gap. Pictures: `docs/design/review/2026-10-13-signin-handover/` (en and ar). The `signin-short` test is unchanged: it still measures from the invite note's bottom + 56px (D-564 follow-up).

**P5 — the comma in a button's name.** `BigButton` named a counted button "Next, 1 of 3" with a Latin comma, which reads wrongly in Arabic and Chinese. The joiner is now per language: `nameJoinerOf(locale)` in `@pam/config/i18n` ("، " for ar, "，" for zh-CN and zh-HK, ", " elsewhere), passed to `BigButton` as `nameJoiner` by Join and the program wizard. It is punctuation in the locale table beside `dir` and `intl`, not a copy key, so no string needs Lena or Sage. A later session could move it to a locale key if a language needs a different pattern than label + joiner + count.

**Not done:** the accessible name's count still comes through `t`, so in Arabic it carries bidi isolates (D-435 asks `tPlain` for names). Out of scope here; worth a look by whoever owns Join.
