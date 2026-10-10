# 2026-10-10 — website: "Signing a program's rules", a draft in seven languages

**Branch:** `claude/compassionate-bohr-mzrchf` (main merged in) · **Lane:** Website

Will (Control Room, 14:36 UTC, relayed by Mira): "create a post about this for the public" — program policies
members sign, approved for Piper to build (card a25).

## What changed

- A post for members and programs, **Signing a program's rules**, in the seven languages (`content/rules.ts`):
  what a policy is ("Bring ID"), how you sign (open the program → "Policies to sign" → Read → "Sign": draw your name or
  "Type my name instead"; once, then one tap), signing never stops you booking, what a program sees (first name and
  date, never the picture), a policy is not changed after you sign (a new version asks again), what a signature
  means (a record that you read and agreed; **not a legal signature**), and a section for programs. Labels are the
  app's own strings in each language; registers as About Pam (es usted, pt-BR você, zh 您, ru вы, ar formal).
  It says nothing about texts or reminders (a test pins that).
- **Where it lives:** English as a Support post (`signing-a-programs-rules`, `status: 'draft'`); the other six at
  `/<lang>/program-rules/` (new route `page.rules.tsx` under the language root layout, now `layout.lang.tsx`).
- **Hidden until both are true** (`signed-off.json`): `"program-rules-live": true` (Piper's signing screens are really in
  the app) and the language in `"program-rules"` (Will signs the English; the six are drafts, D-461). `next.config.mjs`
  adds the route extensions only then. Today: neither, so a normal build has no post and no page.
- Storybook › Website › Journey: **Program rules** × 7 (English, Spanish, Portuguese, Chinese ×2, Russian, Arabic),
  each with a Draft banner. No pictures: the screens are not real yet.
- Records: before-launch (the flip steps, and the one sentence a lawyer reads before launch), STATUS, the skill.

## What was wrong, and what missed it

- Nothing found. Design note: the gate is two conditions (feature live AND language signed) because the post must not
  appear for a feature that does not exist, even if the words are signed. The existing `about.tsx` extension trick
  generalised to `rules.tsx` and `lang.tsx`; a build with only one of the two features signed does not break (checked
  in the normal and the preview builds).

## Decisions made

None new (a convention carried over from About Pam, D-466).

## Verified

- Site tests 24 (5 new in `rules.test.ts`), tsc (site, web). Normal build: no post, no pages. Preview build
  (`PAM_SITE_DRAFTS=1`): the six pages. `a11y.mjs` on the preview build (numbers in the READY note).

## Left undone

- Pictures, from main's Storybook, when the signing screens are real. The English must be checked against them.
- A lawyer reads "What your signature means". A native reader for each of the six.
- Unchecked: the deployed app, Vercel, GitHub Actions.

## Needs a human

- Will: sign the English of About Pam, and later of this post.
- Piper (P2): tell the website lane when the signing screens merge, so `program-rules-live` can flip.
