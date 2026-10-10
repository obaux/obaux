# 2026-10-10 — website: About Pam in seven languages

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Website (public site)

## What changed

- **About Pam**, seven pages at `/<lang>/about-pam/` (en, es, pt-BR, zh-CN, zh-HK, ru, ar), words in
  `apps/site/src/content/about.ts`. Each has its own `<html lang>` (Arabic `dir="rtl"`), a language
  list, `hreflang` + `x-default` English, the share image and a Draft-free page (the Draft banner is
  Storybook's). The English copy is Will's brief from Mira ("a human-touch company"; north star as an
  aim); reminder texts are plainly "coming".
- **Routes were restructured** so each page gets the right `<html lang>`: `app/(site)/…` is the old
  root layout (moved, unchanged), `app/(stories)/[lang]/…` a second root layout. Shared document in
  `components/RootShell.tsx`.
- **A picture**, wordless, from `social/about-art.mjs`: `public/art/about-pam.webp` (1600×600) and
  `public/og/about-pam.png` (1200×630), alt text in all seven.
- **A home section** (`HomeScreen`, `showAbout`): English first sentence, picture, "Read more about
  Pam". Hidden until the English is signed.
- Storybook: Website/Journey › **About Pam** × 7 and **Home with About Pam**; the walker follows
  `/<lang>/about-pam/` links.
- Tests `test/about.test.ts` (9); a11y script and CI also check the seven pages (preview build).

## What was wrong, and what missed it

- **An empty `generateStaticParams` is refused by `output: 'export'`**
  ("Page … is missing generateStaticParams()") — the obvious way to build "no languages" while
  nothing is signed. Caught by building before writing anything else around it. The fix is
  `pageExtensions` (`next.config.mjs`): the route files are `*.about.tsx` and exist as pages only when
  `signed-off.json` has a language or `PAM_SITE_DRAFTS=1`. A test pins the file as empty today.
- **My art script's first run failed on the browser path** (`CHROMIUM_PATH` needs the
  `chromium-1194` binary here, not the headless shell Playwright asks for) — environment only.
- A screenshot script of mine wrote response headers before reading the file — the same slip as an
  earlier one; read first, then write.

## Decisions made

- D-464 — About Pam in seven languages, drafts until signed (in full: the file route, the sign-off
  file, what was left alone).

## Verified

- `pnpm --filter @pam/site test`: 23 pass (9 new). `tsc`: clean.
- Normal build: no `/<lang>/about-pam/`, no home section (`grep about-pam out/index.html` → 0).
  `PAM_SITE_DRAFTS=1` build: seven pages, right `lang`/`dir` (checked en, ar, zh-HK), `hreflang` ×7 +
  `x-default`, share image in `og:image`.
- `scripts/a11y.mjs` on the preview build: **105 scans, 0 problems** (axe, light/dark, 390 and 320px,
  no sideways scroll, header overlap) across the seven pages and the rest.
- Looked at: ar and zh-CN at 320px, en at 1280px, the home page in Storybook, zh-HK at 390px.
- Storybook builds; `audit-language-fit` on the eight new stories: 0 new defects.

## Left undone

- Not signed: `signed-off.json` is `{"about-pam": []}`. Nothing is live.
- The picture is not in the illustration kit or Foundations › Imagery (D-464 says why).
- Pages' header/footer and the "Go to Support" link are English; the pages say so.
- The home card "Pam reminds you before you go so nothing gets missed" promises reminders that are
  not live. Flagged, not changed.
- Not checked from this sandbox: a Vercel preview, GitHub Actions, the live `joinpam.org`.

## Needs a human

- Will: read and sign the English (`about.ts`), then add `"en"` to `signed-off.json`.
- Someone who reads each other language, before it is added.
- Will: the home card above.
