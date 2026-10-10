# D-483 — About Pam is signed in English; "human-touch" is an internal principle, never public copy

**Date:** 2026-10-10 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided** by Will, 10 October 2026, 14:44 UTC (Control Room, relayed by the merge desk), on the About Pam
post (D-466): "We dont say to public Pam is a human-touch company. That sounds weird. That's just for our
internal instructions for making decisions on the best paths forward; to Keeping it human-centered. Redo,
then auto approve."

## What

- The sentence "Pam is a human-touch company" (and its six translations) is taken out of the About Pam
  summary and lead. Nothing replaces it. English now reads: summary "Pam helps people find services, get to
  them, and remember to go."; lead "Pam helps people find city services, get to them, and remember to go."
  Each other language keeps the sentence it already had after the company line, turned into "Pam helps…" in its
  own natural form. The rest of the post is as it was.
- **Will signed the English** on 10 October 2026, after the company line was taken out: `"en"` is in
  `apps/site/src/content/signed-off.json` under `about-pam`, so `/en/about-pam/` and the home page's About Pam
  section are on the site. The other six languages stay drafts (D-461) until a native reader has been over them.
- **The rule that sticks:** "human-touch" is an internal principle for making decisions, to keep Pam
  human-centered. It is never public copy: not on the site, in a post, a card, a share preview or an alt text. It
  is in the website rules in `.claude/skills/pam-support-post/SKILL.md`, and a site test fails if the phrase (or its
  translations in the six languages) appears in the public text.

## What it replaces

D-466 said the post opened with "Pam is a human-touch company" (Mira's brief, from Will's own words about the
company). That line is gone; the rest of D-466 (the files, the sign-off file, the draft rule for the six) stands.

## What a later session might reverse

Nothing here: Will's words are the rule. A native reader still has to approve each of the six before it is
added to `signed-off.json`.
