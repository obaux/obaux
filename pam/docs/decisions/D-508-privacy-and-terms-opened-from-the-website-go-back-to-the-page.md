# D-508 — Privacy and Terms opened from the website go Back to the page they came from

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-legal-back-to-site`

**Decided by:** Will, via the merge desk (11 October 2026, 02:43 ET): "Footer links from homepage open legal policies, but when I press back. The app needs to know which page it came from so the back return them to the page they were on the website."

**Why.** The website's Privacy and Terms links open the app's pages (the policies live in the app, in seven languages). Back there went to Legal, inside the app, which a visitor who never signed in has never seen.

**What.**
- The website's links carry `?from=site&return=<the page's own path>` (`apps/site/src/lib/links.ts` `legalUrl`; `LegalLink.tsx`, a small client component that reads the path, used by the footer and the two "read the privacy policy" links in content).
- The app's Privacy and Terms (`LegalPage.tsx`) read it as a third door beside Sign in and Join (D-250). When it is valid the back control says **"Back to the website"** (`nav.back.website`) and is a plain link to `https://joinpam.org` + the path (`SITE_URL`, `NEXT_PUBLIC_SITE_URL`). The contents tabs (D-497) do not navigate, so they keep it; the link to the other document carries it on.
- **No open redirect.** `lib/siteReturn.ts` accepts a path only if it starts with a single "/", has no "//" anywhere, no backslash, no scheme, only URL-safe characters, and is under 200 characters. It is then joined onto the fixed site address, so it cannot name another host. Anything else — and `from=site` with no return — behaves as if the page had not been opened from the site: Back to Legal, as before.
- Tests: `siteReturn.test.ts` (accepts and rejects), `apps/site/test/legal-links.test.ts` (the URL the website builds), `e2e/legal-site.spec.ts` (from the footer on two pages Back lands on the same website page; Terms; tabs and the other document keep it; six hostile values are ignored; axe).

**Not part of this.** The website is a separate address, so Back there is a full page load, not the app's history; a reader who arrived on the website from elsewhere still lands on the page they left, which is the point.

**What a later session might reverse.** The 200-character limit and the character set (a path with unusual characters falls back to Legal). The website's own path is read on the client, so a page that is exported statically still links correctly.
