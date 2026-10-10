# 2026-10-10 — website: About Pam without the company line, and signed in English

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Website

Will (Control Room, 14:44 UTC, relayed by Mira): "We dont say to public Pam is a human-touch company. That sounds
weird. That's just for our internal instructions for making decisions on the best paths forward; to Keeping it
human-centered. Redo, then auto approve."

## What changed

- **The company line is out** of About Pam's summary and lead in all seven languages; nothing replaces it. English:
  summary "Pam helps people find services, get to them, and remember to go."; lead "Pam helps people find city services,
  get to them, and remember to go." The other six keep the sentence they already had, turned into "Pam helps…".
- **No other public wording**: grepped the site source, the posts, the home page and the share files for human-touch and its six
  translations; only a code comment quoting Will in `apps/web/src/stories/components/StaffInviteEmail.stories.tsx`
  (internal, left, as Mira said). A test now fails if the phrase appears in the About text or the home page.
- **English signed** (D-483): `"en"` in `signed-off.json` → `/en/about-pam/` and the home section are on the site. The
  six stay drafts. The language list is hidden when only one language is built (it would list English alone).
- **Spanish**: "Guarde una visita para encontrarla fácilmente después." (the app says visita, D-480); no other "viaje" in the site.
- D-483, the rule in `.claude/skills/pam-support-post/SKILL.md`, before-launch (the sign-off item ticked; the six still open), STATUS.

## What was wrong, and what missed it

- I wrote the company line into the copy because the brief quoted Will's description of the company, and treated
  an internal principle as a message for the public. Nothing separates "what Will says about how we work" from "what we
  say to the public"; the rule and the test now do.

## Decisions made

- D-483 — About Pam signed in English; "human-touch" is an internal principle, never public copy.

## Verified

- Site tests 25, tsc; normal build now has `/en/about-pam/` and the home section; a11y (numbers in the READY note).

## Left undone

- The six other languages have no native reader. Lena reviews the six changed sentences after the merge (Mira).
- Unchecked: the deployed app, Vercel, GitHub Actions.

## Needs a human

- A native reader for each of the six languages of About Pam.
