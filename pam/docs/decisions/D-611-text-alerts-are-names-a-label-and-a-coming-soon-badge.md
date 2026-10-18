# D-611 — Text alerts are names, a label and a "Coming soon" badge

**Date:** 2026-10-18 · **Branch:** `claude/messages-pam-s0-s1a`

**Decided by:** Will, 18 October 2026, 15:19 (D-608): "We don't need an introduction paragraph. We also just need to hint that these are notification types. Instead of having 'coming soon' and explaining what we don't do yet, we can simply have a badge saying 'coming soon.'" Words signed by Sage at 9fcfd26f; shape set by Mira, 15:22. This entry records the build; the rule is D-608.

## What

- `AlertsView.tsx`: the introduction is gone; a short label, `alerts.kinds` "Kinds of texts", sits over the list; each row is its name, a "Coming soon" badge (Astryx `Badge`, neutral) where the text is not sent yet, and its switch. The sentence under each row is gone. `alerts.how` stays at the bottom, final after Lena's carrier check (04768917): "Pam sends one text each time, only for what is on. Reply STOP to stop, or HELP for help. Text and data rates may apply." Under it, a small link `alerts.privacy` "Privacy" to `/privacy/#texts`, whose accessible name is `alerts.privacy.label` "Privacy: Text messages" (`tPlain`). `TextLink` gained an optional `accessibleLabel` for it.
- The badge is the switch's description (`aria-describedby`), so a screen reader hears "{row}, switch, off, Coming soon" once, with its row. The switch's own name stays the row name.
- No input added or removed; `data-collected.ts` unchanged.

## Not removed

`alerts.intro` and the seven `alerts.*.body` keys are no longer used by any screen. They stay in the bundles for Lena's retire sweep (the parity test needs all seven languages in step; Sage's English removal and Lena's removal from the six go in one change).

## Drafts

The six languages' `alerts.kinds`, `alerts.comingSoon` and `alerts.how` are **my drafts** (Nico), not Lena's: ack'd so the tests pass, to be read and replaced by her. `alerts.how` and `alerts.privacy*` follow Sage's signed English; the six translations are still mine.

## Proof

`alerts.spec.ts` "Text alerts say little" fails on the old screen (no "Kinds of texts") and passes now; 15 of 15 across the three projects. Pictures: `docs/sessions/pictures/2026-10-18-text-alerts/` (390 light and 320 dark, member and case manager).
