# D-571 — New phone number post held as a patch

**Date:** 2026-10-14 · **Branch:** `claude/compassionate-bohr-mzrchf`

Will, 14 October 04:23: "for the new number, add that as an article inside the support website and in the article it has a callout to this form and have the post facilitate this process."

**Decided.** A Support post "Got a new phone number?" (members topic) in Sage's signed words (ledger `e708a7e8`), with a call-out card "Start with your new number" that links to the app's `/signin/new-number/` through `NEW_NUMBER_URL` in `lib/links.ts`. "Can't sign in" points to it, and the new-phone search phrases find it.

**Held.** The app page does not exist until Will signs a84 and D-567 (Ava, `5285f31b`) ships. A button to a missing page is a dead end, so the post is kept as a patch against `origin/main`: `docs/design/review/2026-10-14-new-phone-number/new-phone-number.patch`. Mira applies it when the page is live. It was checked with `git apply --check` on `origin/main`.

**Not decided here.** No new English beyond Sage's words. Search ranking: "cant sign in" shows the new post fourth, so the test allows the first five for those two phrases.
