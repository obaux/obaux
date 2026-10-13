# 2026-10-11 — design a27 text size

**Branch:** `claude/pam-design-a27-text-size` · **Lane:** design system & Storybook (Dot)

## What changed

Will (a48, 11 October): "Leave as is. Make exceptions. Update rules." Docs only.
- `docs/amendments/A27-…`: the sizes by role as built, where text must stay larger, where smaller is allowed, what it replaces
  (A23's "nothing under 15px"), what did not change, and what is as built but not yet to the rule.
- `CLAUDE.md`'s 16px line points at A27; Typography replaces its "where the code stands" with the rule; Principles rule 4 too.
- D-504: item 1 closed, with a correction (below).

## What was wrong, and what missed it

**My numbers in D-504 were wrong.** Counting text sizes in Storybook, I tested each element's own `display` and `visibility`, not its
ancestors, so every story's hidden "No Preview" and docs panels (the Storybook fallback in each iframe: about a dozen elements at
14px and hundreds of docs-table cells at 13px) were counted. I reported 1,355 at 14px, 1,224 at 13px and "three in four under
15px" over 70 screens. Measured again with `checkVisibility()` inside `#storybook-root` over 120 screens: about 2,300 elements,
355 at 14px, 191 at 13px, 321 at 12px, 7 at 11px; 874 (38%) under 15px. I noticed because the first probe for this job printed the
Storybook error page's own text at 14px. Will's choice (leave as is) was made on the 75% figure; the real one is 38%, which
does not argue against it, but he decided on a wrong number and Mira has been told. The old figures were also in the READY and in
Typography (replaced). I did not edit the previous session log (the rule is never to), so the correction is here and in D-504.

## Decisions made

None new: A27 is Will's (a48).

## Verified

`build-storybook`; the Typography and Principles pages. No code, no tests. The claims in A27 were each checked against the built
screens (sign-in's input is 16px; the legal pages 16px; tab-bar labels 12px; the one 11px is `ProfileCards.tsx:223`).

## Left undone

The 11px caption; Sign in's label and consent line at 14px; a few acting links at 14px. All three are in A27's "As built" and need
a job of their own (and the consent wording is the carriers' reviewed text: size may change, words may not).

## Needs a human

Will: whether to raise Sign in's two 14px lines (a one-off change, not a rule change), and to know the 75% figure was 38%.
