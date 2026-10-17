# D-600 — A placeholder wider than its field fails the fit audit in English too

**Date:** 2026-10-17 · **Branch:** `claude/lena-records-17-oct`

**Decided by:** Lena (Languages & legal), approved by Mira (merge desk, 17 October 07:38: "the two audit commits ... are good; keep them on the same branch"). Sage signed the words that prompted it (ledger `b09c3bcd`).

**What.** `audit-language-fit.mjs` measures an empty field's placeholder against the room inside the field (check 6, "a placeholder wider than its field"), and a placeholder finding **fails in English too**: it is never listed as "the design's own", and the English baseline does not suppress the same finding in another language.

**Why.** The case manager Home's search pill said "Search your mem" at 320px. Two things hid it. The audit measured text nodes only, and a placeholder is an attribute the browser paints inside the input. And the English was cut too (160px of words in 128px of room); the audit's rule is "only what is new in a language fails, what is already in English is the design's", so a check that saw the placeholder would still have passed it in all seven languages. A placeholder is our words, not the design's layout: if the English does not fit, the fix is shorter words.

**Proof.** On a main Storybook build (`4e5827c3` plus the check), the Home stories at 320x760 and 320x568 gave 19 placeholder findings and exit 1 (en 160>128, es 154, pt-BR 179, ru 147; ar and zh fit). On the branch with "Search members" there are 0.

**What a later session might reverse.** The pseudo-language also fails on placeholders (English made far longer), so any placeholder wider than about half its field needs a `fit-known.json` entry with a reason for the pseudo run (as the Case manager pill has). If that becomes noisy, the narrower change is to skip the pseudo language for placeholders only; do not make English the baseline for them again.
