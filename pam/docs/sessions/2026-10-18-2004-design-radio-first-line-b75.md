# 2026-10-18 — design radio first line b75

**Branch:** `claude/pam-design-radio-first-line` (off main e1a2cbec, b74) · **Lane:** design system (Dot)

## What changed

A radio whose label wraps drew its circle between the two lines (Astryx centres it on the row). `globals.css`, pam layer: `.astryx-radio-list .astryx-item` is top-aligned and its text column takes 2px (a 20px line is short of the 24px circle), so the circle is level with the first line and one-line rows keep their height. Every `RadioList` gets it; the other users (the city lists, the message-report reasons) have label-only rows. Cut fresh off main without the Flag change (Will kept the card, 19:22).

## What was wrong, and what missed it

Nothing named a wrapped radio label as a case; Flag's long reason showed it.

## Decisions made

None.

## Verified

New check in `flag.spec` (every radio's circle within 1px of the middle of its label's first line; the long reason wraps): fails on main's build (10.5px off), 21 pass on 3 projects with the fix. `messages.spec` report cases: 33 pass. The earlier run of the other radio-using specs (account, invite, join, language-list-fits, languages, lead-flow-pass, program-policies, row-taps) was 420 pass on the previous base; I did not repeat it on this one. Before/after pictures: `docs/design/review/2026-10-18-radio-first-line-b75/`.

## Left undone

Nothing.

## Needs a human

Nothing.
