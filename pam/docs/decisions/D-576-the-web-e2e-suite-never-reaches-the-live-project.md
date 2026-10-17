# D-576 — The web e2e suite never reaches the live project

**Date:** 2026-10-14 · **Branch:** `claude/e2e-never-live`

**Decided:** the merge desk, 14 October 2026, 07:56, after Piper's log read showed 209 refused `places-search` calls from Anthropic's network, and its own count of about 3,500 refused calls to the live project in an hour (rest, auth and functions; no 2xx on anything that writes; no email or text).

**The leak.** `src/lib/project.ts` falls back to the live URL and publishable key when `NEXT_PUBLIC_SUPABASE_URL` is not set at build time. CI sets a stub; a person's or a session's container often does not. Playwright runs against `out/`, so every call a spec did not mock went to the real project. The only thing that made it harmless was that the stub sign-in token (`t`) is not a valid JWT: luck. A signed-out spec with an unmocked call would go out with the real publishable key, and `help-request` runs with `verify_jwt` off, so it could have sent a real email.

**Two layers, so neither has to be remembered.**
1. **A check before any test** (`e2e/global-setup.ts`, `e2e/liveGuard.ts`): the build in `out/` must name the stub project and must not contain the live project's ref, or the run stops with the reason and how to build (`pnpm --filter @pam/web build:e2e`). Why a scan of the build: the project is baked in at build time, so the build is the truth, whatever env a runner has.
2. **A browser that cannot leave this machine** (`playwright.config.ts`: `--proxy-server=http://127.0.0.1:9` and a bypass list of loopback only). Every request to any other host fails inside the browser. This holds with any build, any container proxy and a request nobody mocked; mocks (`page.route`) and the local server are not affected. Why this and not a route: `page.route` must be added per page or per context (a hundred specs), and one for `functions/v1` alone is too narrow. A flag works at the network layer for every page the suite opens.

**Proven** (14 October): (a) a live-built `out/` with the real config: the run refuses, with the message, sending nothing; (b) a live-built `out/` with layer 1 taken off, signed in with the stub token and nothing mocked: 861 requests to the live host attempted by the page, 0 answered, 861 failed in the browser; (c) a stub build: `never-live.spec.ts` shows fetches to the live project, `help-request` and `example.com` fail and `/` answers, and the whole suite is run on all three projects with the proxy flags.

**What a later session might reverse.** The scan keys on the ref string, so a project change needs `LIVE_REF` updated (`liveGuard.ts`); a spec that really needs an outside host (none today) would have to mock it.
