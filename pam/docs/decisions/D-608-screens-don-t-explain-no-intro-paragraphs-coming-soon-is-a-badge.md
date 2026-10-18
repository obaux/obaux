# D-608 — Screens don't explain: no intro paragraphs, Coming soon is a badge, promises live in Privacy and Terms

**Date:** 2026-10-18 · **Branch:** `claude/sage-signs`

**Decided by Will**, Control Room thread 3c4e2629, 18 October 2026 15:19, with a phone picture of Text alerts:

> "Let's simplify this. Tell the UX writing team that they're too verbose and that they explain too many things in
> the app that should just be explained inside privacy or legal pages. For instance in this notifications page, we
> don't need an introduction paragraph. We also just need to hint that these are notification types. Instead of
> having "coming soon" and explaining what we don't do yet, we can simply have a badge saying "coming soon.""

The merge desk (Mira, 15:22) turned it into a rule, and Sage owns it in `docs/voice.md` §4 and Foundations › Writing.

## The rule

1. **Screens don't explain.** A screen names things and lets people act. It does not explain how Pam works.
2. **No intro paragraph under a title.** A short label over a list is allowed when it says what the list is
   ("Kinds of texts").
3. **What Pam does, doesn't do or never does lives in Privacy or Terms**, not on the screen. That covers "Only
   that…, never who", "Pam does not…", "Nobody else sees…". Those lines go to Lena, and Will signs them (A29).
4. **A feature that isn't on yet gets a "Coming soon" badge**, never a sentence about what Pam doesn't do yet.
5. **A row is its name.** A second line is allowed only when someone needs it to choose between rows. A promise is
   never that reason.

## Still on screens

Errors (what happened, what to do, how to reach a person), carrier-required consent lines where texts are turned on
(STOP, HELP, rates), and a step's instruction when someone is mid-task and would otherwise be stuck. Empty states
keep a title, plus one line only if it says how to fill the list.

## What it replaces

The pattern of an intro paragraph under each settings title, the "Coming soon. Pam does not send this text yet."
sentences, the `alerts.*.body` lines, and the "If something will not happen, say so" advice in voice.md's
Confirmations (a confirmation now says what is true and what comes next, and stops there). The A28 help order is
unchanged.

## What a later session might reverse

A screen where people keep getting stuck without a line (Wren's help-desk searches or the support inbox show it)
can earn one plain line back, signed by Sage, and never a promise. If Will wants a promise said at the moment of
choice (as with a94 or a101), that is his call on a card.

## First applied

Text alerts (`AlertsView.tsx`, `alerts.*`), ledger row "Text alerts, D-608". Then the audit of every screen,
`docs/design/2026-10-18-screens-dont-explain-audit.md`, routed by the merge desk.
