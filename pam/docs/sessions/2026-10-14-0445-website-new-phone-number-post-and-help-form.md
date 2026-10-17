# 2026-10-14 — website new-phone-number post and help form

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** website

## What changed
- Job A (D-570, `b0590f17`, `e64781c7`): no ring on text boxes, keyboard raised as the form opens, "Write to us" as wide as its words from 900px, the gap under Still stuck? moved from margin to padding.
- Job B (D-571): "Got a new phone number?" post and `CalloutCard`, held as a patch in `docs/design/review/2026-10-14-new-phone-number/`.

## What was wrong, and what missed it
- Could not reproduce Will's "touching" report: the margin measured 60px/120px in Chromium. WebKit is not installed here, so it is moved to padding rather than proven.

## Decisions made
D-570, D-571.

## Verified
Job A and Job B: tsc, site tests, usability, a11y (120 scans) and scrollspy all exit 0, each on a fresh build of its own branch.

## Left undone
The iOS keyboard cannot be tested here. The post is held until the app page is live.

## Needs a human
Will signs a84. Sage and Mira: the post has no "What we keep" anchor on the privacy link.
