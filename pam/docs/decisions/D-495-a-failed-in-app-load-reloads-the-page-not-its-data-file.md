# D-495 — A failed in-app load reloads the page, not its data file

**Date:** 2026-10-10 · **Branch:** `mira/invite-link-fixes` · **By:** the merge desk (Mira), platform

Will, 10 October, from his phone: an invite link opened "a page of raw code". The screenshot is the
sign-in screen's flight data (`1:"$Sreact.fragment" 2:I[…]`), shown as the page, under
app.joinpam.org.

**What happens.** Pam is a static export (`output: 'export'`). Every in-app tap goes through Next's router
(D-269), which loads the next screen's flight data from `<screen>/index.txt`. If that load *throws*
(a dropped connection on a phone; or a tab still on the old vercel.app address, whose load is redirected
to app.joinpam.org and refused as a cross-site request), Next falls back to loading the page in full. On
that one path, Next 15.5.25 navigates to the URL it was fetching, which already ends in `index.txt`; every
other fallback in the same file strips it (`doMpaNavigation`). So the browser opens the data file. Reproduced
on our own build: a failed load of `/about/index.txt` left the browser on `/about/index.txt` showing the
same text as Will's screenshot.

**Decided.**
1. **Patch Next** (`patches/next@15.5.25.patch`, `pnpm-workspace.yaml` `patchedDependencies`): the catch
   path returns `doMpaNavigation(url)`, like the others, in both the CommonJS and ESM builds. When Next is
   upgraded, check whether the fix is upstream (look for the `flightData: url.toString()` fallback in
   `fetch-server-response.js`) and drop the patch if so; `pnpm install` fails loudly if the patch no longer
   applies.
2. **A safety net at the edge** (`apps/web/vercel.json`): a *document* request (`Sec-Fetch-Dest: document`)
   for `…/index.txt` is redirected to the screen itself. That covers tabs still running a build from before
   the patch, which no code change can reach. In-app loads are `fetch`es (`Sec-Fetch-Dest: empty`) and are
   not affected.
3. **The build cache knows about patches** (`apps/web/next.config.mjs`). Webpack's build cache trusts an
   installed package not to change until its version does, so the first build after patching still shipped
   Next's old code from the cache; Vercel restores that cache between deploys, so it would have shipped
   there too. The patches' contents are now part of the cache's key.
4. A browser test, `e2e/failed-load.spec.ts`, fails one load on purpose and checks that the browser is never
   sent to a data file. It fails on a build from before the fix (it lands on `/about/index.txt`) and passes
   after.

**Not the cause:** the server. Fetched fresh, the link returns the sign-in page; the flight data in the
screenshot carried an older build's id, from a tab opened before a deploy.

**Related, same day:** texts link to app.joinpam.org (`app_url`, migration `20261010190831`), so a tab is
no longer opened on the old address from a text.
