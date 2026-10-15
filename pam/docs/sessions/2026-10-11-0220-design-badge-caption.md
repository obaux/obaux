# 2026-10-11 — design badge caption

**Branch:** `claude/pam-design-badge-caption` · **Lane:** design system & Storybook (Dot)

## What changed

A27 says nothing is under 12px; the one 11px caption ("Your badge" on the Profile badge tile, `ProfileCards.tsx`) is 12px now.
Mira: just following A27, no question to Will. One line.

## What was wrong, and what missed it

The caption was set at 11px before A27 existed and nothing checked a floor. The count that found it (the corrected one, 7 elements
over 7 stories, all this caption) is in A27 and D-504.

## Decisions made

None: A27.

## Verified

`audit:fit` on the 18 Profile stories and the 11 badge stories in en, es, pt-BR, zh-CN, zh-HK, ru, ar and pseudo (the caption is a
nowrap pill on the badge art, so a longer language could have overflowed): nothing new; the 8 Profile findings were already accepted and
are the same 8 as before. a11y e2e (45 passed); tsc; build-storybook. Not seen on a phone.

## Left undone

Sign in's field label and consent sentence at 16px waits on Will's yes (card a52).

## Needs a human

Nothing.
