# D-466 — About Pam in seven languages, drafts until signed

**Date:** 2026-10-10 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided:** Will, 10 October 08:52 UTC (relayed by the merge desk): "Create a website post
about Pam in seven languages, and create a graphic for it." and, a minute later, "Add a
section on homepage about this also." The shape below is the website lane's.

## What it is

- One post, **About Pam**, in English, Spanish, Brazilian Portuguese, Simplified Chinese,
  Traditional Chinese (Hong Kong), Russian and Arabic. Each is a static page at
  `/<lang>/about-pam/` with its own `<html lang>` (and `dir="rtl"` for Arabic), a
  language list at the top, `hreflang` links to the other six and `x-default` pointing at
  English. It is not filed under a Support topic. The words are in
  `apps/site/src/content/about.ts`.
- The copy says only what is true today: Pam finds, plans and talks to a person;
  reminder texts are plainly "coming" (the same switch as `TextsFromPam.tsx`,
  `VISIT_REMINDERS_LIVE`). The north star is stated as an aim ("our aim is for Pam to
  message people at the right time"), not as a feature.
- One wordless picture, drawn in Pam's illustration style and palette, serves all seven:
  a header (1600×600, `public/art/about-pam.webp`) and the share image (1200×630,
  `public/og/about-pam.png`), both from `social/about-art.mjs`. The alt text is written
  in all seven languages.
- A section on the home page: the English first sentence, the picture, "Read more about
  Pam" to the English post.

## Drafts, by D-461's rule

Will signs the English; the other six are "approved to learn from; no native reader yet".
Nothing is live until a language is listed in `apps/site/src/content/signed-off.json`.
That one file does three things: it decides which pages are built, it decides whether the
home section shows (it follows English), and it is what the tests pin (today: empty).
Storybook › Website › Journey shows all seven, each with a Draft banner, and the home page
with the section on.

## Why a file and not a flag in the component

`output: 'export'` refuses a dynamic route whose `generateStaticParams` is empty, so
"build no languages" cannot be an empty list. While nothing is signed the route's files
are named `layout.about.tsx` / `page.about.tsx` and the extension `about.tsx` is added to
`pageExtensions` (`next.config.mjs`) only when a language is signed or `PAM_SITE_DRAFTS=1`.
Without it the route does not exist, which is checked: a normal build has no
`/<lang>/about-pam/` and no home section. CI also builds with `PAM_SITE_DRAFTS=1` and runs
the accessibility check over all seven.

## Left as it is, and flagged

- The home page card "Pam reminds you before you go so nothing gets missed" promises
  reminders that are not live. Not rewritten here (not asked); flagged to the merge desk.
- The header and footer stay English on a language page (they are the site's, not the
  post's). The links to Support lead to English pages, and the pages say so.
- The picture was drawn as a standalone SVG with the palette written out, not with
  `packages/ui/src/art/kit.tsx` (that kit draws in themed components for the app, and a
  file rendered for the web needs literal colours). If Will wants it in the kit and in
  Foundations › Imagery, that is a follow-up.

## What a later session might reverse

Signing: add a language to `signed-off.json`; remove the Draft banner wording only when a
native reader has been over it. A language other than English may be signed on its own;
its page then links to the other signed ones only.
