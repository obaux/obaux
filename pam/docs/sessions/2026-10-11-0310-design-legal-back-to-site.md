# 2026-10-11 — design legal back to site

**Branch:** `claude/pam-design-legal-back-to-site` · **Lane:** Design system & Storybook (touches the public website's footer links: told Wren)

## What changed

Will (02:43): Back from Privacy/Terms opened on the website's footer went to Legal inside the app. The site's links now carry `?from=site&return=<path>` (`links.ts` `legalUrl`, new `LegalLink.tsx`); the app's `LegalPage` reads it, checks it (`lib/siteReturn.ts`), and shows "Back to the website" (`nav.back.website`, seven languages, six drafts for Lena) going to `https://joinpam.org` + path. Tabs and the other-document link keep it. D-508.

## What was wrong, and what missed it

Nothing told the app where a visitor came from; no test opened the policies from the site. Also in this run, I wrote decision numbers in comments before claiming them and had to correct them: claim first.

## Decisions made

D-508.

## Verified

`tsc` (web, site); web unit tests 116; site unit tests 40; Playwright `legal-site`, `legal`, `legal-tabs`, `legal-phone` in all three projects (126 passed; run with `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`); `copy:status` in step; app build; `build-storybook`.

## Left undone

Lena to read the six drafts of `nav.back.website`. The site was not built and served end to end against the app (the e2e stubs joinpam.org).

## Needs a human

Will: the English string "Back to the website".
