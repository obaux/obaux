# 2026-10-31 — languages & legal: the Google Maps notice Pam's Terms are missing

**Branch:** `claude/lena-google-maps-notice` (off `mira/b78` @ `0c820c27`) · **Lane:** Languages & legal (Lena) · from Mira (21:00), after Iris's research note

## What I did
- Read Google's Maps Platform Terms of Service (last modified 26 August 2026) and Maps Service Specific Terms (28 October 2026) from `cloud.google.com` with `curl`
  (WebFetch truncated the long page; the other Google hosts do not resolve from the sandbox). Quoted §3.2.2(a)(i) and (b), §4.4, A.2, 14.1 to 14.3.
- Searched Terms, Privacy, docs, the website and the code in all seven languages: no Google notice in the Terms, no `terms_maps` or `policies.google.com` anywhere.
- Checked the code against what Google receives (`places-search/handler.ts`, `TripsMap.tsx`): matches `sharing.p5` and `sharing.p7`, so no Privacy line.
- Drafted the held Terms section (`google-maps`, p1 to p3) in `docs/legal/2026-10-31-google-maps-notice-in-the-terms.md`, with how to ship it.
- Added to `test/third-party-hosts.test.ts`: a Maps Platform host (`maps.googleapis.com`, `places.googleapis.com`) needs a `terms` entry; once `terms.s.google-maps.p2` exists in
  English, every language must hold both addresses. Proven both ways with the key added to the bundles and one language missing an address, then reverted.
- before-launch: the street-search item now records what was read and what was not.

## Not done, on purpose
Nothing in the bundles, no translation, no `legal.ts` change, no `legal:date`: Terms are Will's to sign (A29) and the date moves only on the day it ships.

## Open
- Will signs the English (or edits it); then six languages, `legal.ts`, `copy:ack`, `legal:date terms <day>`.
- Someone who can reach `developers.google.com` checks the Places attribution page against the two points in section 5 of the note.
- Optional for Dot or Ava: make the two addresses tappable on the Terms page.
